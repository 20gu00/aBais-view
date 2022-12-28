<template>
    <div>
        <MainHead
            searchDescribe="请输入"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @namespaceList="getNamespaceList"
            @dataList="getIngressList"
            add
            @addFunc="handleAdd"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:12px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="ingressList"
                :pagination="pagination"
                @change="handleTableChange">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'name'">
                        <span style="font-weight: bold;">{{ record.metadata.name }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'labels'">
                        <div v-for="(val, key) in record.metadata.labels" :key="key">
                            <a-popover>
                                <template #content>
                                    <span>{{ key + ":" +val }}</span>
                                </template>
                                <a-tag style="margin-bottom:5px;cursor:pointer;" color="blue">{{ ellipsis(key + ":" +val, 15) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'host'">
                        <div v-for="(val, key) in record.spec.rules" :key="key">
                            <a-popover>
                                <template #content>
                                    <span>{{ val.host }}</span>
                                </template>
                                <a-tag style="margin-bottom:5px;cursor:pointer;" color="green">{{ ellipsis(val.host, 15) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'path'">
                        <div v-for="(val, key) in record.spec.rules" :key="key">
                            <a-popover>
                                <template #content>
                                    <span>{{ val.http.paths[0].path }}</span>
                                </template>
                                <a-tag style="margin-bottom:5px;cursor:pointer;" color="green">{{ ellipsis(val.http.paths[0].path, 15) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'external-ip'">
                        <span>{{ record.status.loadBalancer.ingress ? record.status.loadBalancer.ingress[0].ip : '' }} </span>
                    </template>
                    <template v-if="column.dataIndex === 'tls'">
                        <span>{{ record.spec.tls ? 'YES' : '' }} </span>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag color="gray">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;" class="ingress-button" type="primary" icon="form-outlined" @click="getIngressDetail(record)">YML</c-button>
                        <c-button class="ingress-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delIngress)">删除</c-button>
                    </template>
                </template>
            </a-table>
        </a-card>
        <!-- 展示YAML信息的弹框 -->
        <a-modal
            v-model:visible="yamlModal"
            title="YAML信息"
            :confirm-loading="appLoading"
            cancelText="取消"
            okText="更新"
            @ok="updateIngress">
            <!-- codemirror编辑器 -->
            <!-- border 带边框 -->
            <!-- options  编辑器配置 -->
            <!-- change 编辑器中的内容变化时触发 -->
            <codemirror
                :value="contentYaml"
                border
                :options="cmOptions"
                height="500"
                style="font-size:14px;"
                @change="onChange"
            ></codemirror>
        </a-modal>
        <!-- 创建ingress的抽屉弹框 -->
        <a-drawer
            v-model:visible="createDrawer"
            title="创建Ingress"
            :footer-style="{ textAlign: 'right' }"
            @close="onClose">
            <br>
            <a-form ref="formRef" :model="createIngress" :labelCol="{style: {width: '30%'}}">
                <a-form-item
                    label="名称"
                    name="cName"
                    :rules="[{ required: true, message: '请输入Ingress名称' }]">
                    <a-input v-model:value="cName" />
                </a-form-item>
                <a-form-item
                    label="命名空间"
                    name="cNamespace"
                    :rules="[{ required: true, message: '请选择命名空间' }]">
                    <a-select show-search style="width:140px;" v-model:value="cNamespace" placeholder="请选择">
                        <a-select-option
                            v-for="(item, index) in namespaceList"
                            :key="index"
                            :value="item.metadata.name">
                            {{ item.metadata.name }}
                        </a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item
                    label="标签"
                    name="cLabelStr"
                    :rules="[{ required: true, message: '请输入标签' }]">
                    <a-input v-model:value="cLabelStr" placeholder="project=ms,app=gateway" />
                </a-form-item>
                <a-form-item
                    label="域名"
                    name="cHost"
                    :rules="[{ required: true, message: '请输入域名' }]">
                    <a-input v-model:value="cHost" />
                </a-form-item>
                <a-form-item
                    label="Path"
                    name="cPath"
                    :rules="[{ required: true, message: '请输入Path' }]">
                    <a-input v-model:value="cPath" placeholder="/abc" />
                </a-form-item>
                <a-form-item
                    label="Path类型"
                    name="cPathType"
                    :rules="[{ required: true, message: '请选择Path类型' }]">
                    <a-select style="width:140px;" v-model:value="cPathType" placeholder="请选择">
                        <a-select-option value="Prefix">Prefix</a-select-option>
                        <a-select-option value="Exact">Exact</a-select-option>
                        <a-select-option value="ImplementationSpecific">ImplementationSpecific</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item
                    label="Service名"
                    name="cServiceName"
                    :rules="[{ required: true, message: '请输入service name' }]">
                    <a-input v-model:value="cServiceName" />
                </a-form-item>
                <a-form-item
                    label="Service端口"
                    name="cServicePort"
                    :rules="[{ required: true, message: '请输入service端口' }]">
                    <a-input v-model:value="cServicePort" />
                </a-form-item>
            </a-form>
            <template #footer>
                <a-button style="margin-right: 8px" @click="onClose()">取消</a-button>
                <a-button type="primary" @click="formSubmit()">创建</a-button>
            </template>
        </a-drawer>
    </div>
</template>

<script>
import { createVNode, reactive, ref, toRefs } from 'vue';
import MainHead from '@/components/MainHead';
import httpClient from '@/request';
import common from "@/config";
import { message } from 'ant-design-vue';
import yaml2obj from 'js-yaml';
import json2yaml from 'json2yaml';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';
export default({
    components: {
        MainHead,
    },
    setup() {
        //表结构
        const columns = ref([
            {
                title: 'Ingress名',
                dataIndex: 'name'
            },
            {
                title: '标签',
                dataIndex: 'labels'
            },
            {
                title: 'Host',
                dataIndex: 'host',
            },
            {
                title: 'Path',
                dataIndex: 'path'
            },
            {
                title: 'EXTERNAL-IP',
                dataIndex: 'external-ip'
            },
            {
                title: 'TLS',
                dataIndex: 'tls'
            },
            {
                title: '创建时间',
                dataIndex: 'creationTimestamp'
            },
            {
                title: '操作',
                key: 'action',
                fixed: 'right',
                width: 200
            }
        ])
        //常用项
        const appLoading = ref(false)
        const searchValue = ref('')
        const namespaceValue = ref('')
        const namespaceList = ref([])
        //分页
        const pagination = reactive({
            showSizeChanger: true,
            showQuickJumper: true,
            total: 0,
            currentPage: 1,
            pagesize: 10,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: total => `共 ${total} 条`
        })
        //列表
        const ingressList = ref([])
        const ingressListData = reactive({
            url : common.k8sIngressList,
            params: {
                filter_name: '',
                namespace: '',
                cluster: '',
                page: 1,
                limit: 10
            }
        })
        //详情
        const contentYaml = ref('')
        const yamlModal = ref(false)
        const cmOptions = common.cmOptions
        const ingressDetail =  reactive({
            metadata: {}
        })
        const ingressDetailData =  reactive({
            url: common.k8sIngressDetail,
            params: {
                ingress_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //yaml更新
        const updateIngressData = reactive({
            url: common.k8sIngressUpdate,
            params: {
                namespace: '',
                content: '',
                cluster: ''
            }
        })
        //删除
        const delIngressData = reactive({
            url: common.k8sIngressDel,
            params: {
                ingress_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //创建
        const formRef = ref()
        const createDrawer = ref(false)
        const createIngress = reactive({
            cName: '',
            cNamespace: '',
            cLabelStr: '',
            cHost: '',
            cPath: '',
            cPathType: '',
            cServiceName: '',
            cServicePort: ''
        })
        const createIngressData = reactive({
            url: common.k8sIngressCreate,
            params: {
                name: '',
                namespace: '',
                label: {},
                hosts: {},
                cluster: ''
            }
        })

        //【方法】
        //json转yaml方法
        function transYaml(content) {
            return json2yaml.stringify(content)
        }
        //yaml转对象
        function transObj(content) {
            return yaml2obj.load(content)
        }
        function timeTrans(timestamp) {
            let date = new Date(new Date(timestamp).getTime() + 8 * 3600 * 1000)
            date = date.toJSON();
            date = date.substring(0, 19).replace('T', ' ')
            return date 
        }
        function ellipsis (val, len) {
            return val.length > len ? val.substring(0,len) + '...' : val
        }
        function handleTableChange(val) {
            pagination.currentPage = val.current
            pagination.pagesize = val.pageSize
            getIngressList()
        }
        function getSearchValue(val) {
            searchValue.value = val
        }
        function getNamespaceValue(val) {
            namespaceValue.value = val
        }
        function getNamespaceList(val) {
            namespaceList.value = val
        }
        //编辑器内容变化时触发的方式,用于将更新的内容复制到变量中
        function onChange(val) {
            contentYaml.value = val
        }
        //列表
        function getIngressList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            ingressListData.params.filter_name = searchValue.value
            ingressListData.params.namespace = namespaceValue.value
            ingressListData.params.cluster = localStorage.getItem('k8s_cluster')
            ingressListData.params.page = pagination.currentPage
            ingressListData.params.limit = pagination.pagesize
            httpClient.get(ingressListData.url, {params: ingressListData.params})
            .then(res => {
                //响应成功，获取ingress列表和total
                ingressList.value = res.data.items
                pagination.total = res.data.total
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                appLoading.value = false
            })
        }
        //详情
        function getIngressDetail(e) {
            appLoading.value = true
            ingressDetailData.params.ingress_name = e.metadata.name
            ingressDetailData.params.namespace = namespaceValue.value
            ingressDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(ingressDetailData.url, {params: ingressDetailData.params})
            .then(res => {
                //ingressDetail = Object.assign(ingressDetail, res.data)
                contentYaml.value = transYaml(res.data)
                yamlModal.value = true
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                appLoading.value = false
            })
        }
        //更新ingress
        function updateIngress() {
            appLoading.value = true
            //将yaml格式的ingress对象转为json
            let content = JSON.stringify(transObj(contentYaml.value))
            updateIngressData.params.namespace = namespaceValue.value
            updateIngressData.params.content = content
            updateIngressData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(updateIngressData.url, updateIngressData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getIngressList()
                yamlModal.value = false
            })
        }
        //删除ingress
        function delIngress(name) {
            appLoading.value = true
            delIngressData.params.ingress_name = name
            delIngressData.params.namespace = namespaceValue.value
            delIngressData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delIngressData.url, {data: delIngressData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getIngressList()
            })
        }
        //确认框
        function showConfirm(action, res, fn) {
            Modal.confirm({
                title: '是否继续' + action + "操作? 操作对象：",
                icon: createVNode(ExclamationCircleOutlined),
                content: createVNode('div', {
                    //style: 'color:red;',
                }, res),
                cancelText: '取消',
                okText: '确认',
                onOk() {
                    fn(res)
                },
                // onCancel() {
                //     console.log('Cancel');
                // }
            })
        }
        //处理新增
        function handleAdd() {
            createDrawer.value = true
        }
        //验证表单
        async function formSubmit() {
            try {
                await formRef.value.validateFields();
                //console.log('Success:', values);
                createIngressFunc()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        function resetForm() {
            formRef.value.resetFields();
        }
        //创建ingress
        function createIngressFunc() {
            //正则匹配，验证label的合法性
            let reg = new RegExp("(^[A-Za-z]+=[A-Za-z0-9]+).*")
            if (!reg.test(createIngress.cLabelStr)) {
                message.warning("标签填写异常，请确认后重新填写")
                return
            }
            //加载loading动画
            appLoading.value = true
            //定义label、cpu和memory变量
            let label = new Map()
            //将label字符串转成数组
            let a = (createIngress.cLabelStr).split(",")
            //将数组转成map
            a.forEach(item => {
                let b = item.split("=")
                label[b[0]] = b[1]
            })
            //处理Hosts
            let hosts = new Map()
            let httpPaths = []
            let httpPath = {
                path: createIngress.cPath,
                path_type: createIngress.cPathType,
                service_name: createIngress.cServiceName,
                service_port: parseInt(createIngress.cServicePort)
            }
            httpPaths.push(httpPath)
            hosts[createIngress.cHost] = httpPaths
            createIngressData.params.name = createIngress.cName
            createIngressData.params.namespace = createIngress.cNamespace
            createIngressData.params.label = label
            createIngressData.params.hosts = hosts
            createIngressData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.post(createIngressData.url, createIngressData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                //重置表单
                resetForm()
                getIngressList()
                //关闭抽屉
                createDrawer.value = false
            })
        }
        //关闭抽屉
        function onClose () {
            Modal.confirm({
                title: "是否确认关闭操作? ",
                icon: createVNode(ExclamationCircleOutlined),
                content: createVNode('div', {
                    //style: 'color:red;',
                }),
                cancelText: '取消',
                okText: '确认',
                onOk() {
                    createDrawer.value = false
                    resetForm()
                },
                onCancel() {
                    createDrawer.value = true
                }
            })
        }

        return {
            appLoading,
            namespaceList,
            pagination,
            columns,
            ingressList,
            ingressDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            createDrawer,
            createIngress,
            formRef,
            ...toRefs(createIngress),
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getNamespaceValue,
            getNamespaceList,
            getIngressList,
            getIngressDetail,
            onChange,
            updateIngress,
            showConfirm,
            delIngress,
            handleAdd,
            onClose,
            formSubmit
        }
    },
})
</script>

<style scoped>
    .ingress-button {
        margin-right: 5px;
    }
    .ant-form-item {
        margin-bottom: 20px;
    }
</style>