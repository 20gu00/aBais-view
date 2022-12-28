<template>
    <div>
        <MainHead
            searchDescribe="请输入"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @namespaceList="getNamespaceList"
            @dataList="getSvcList"
            add
            @addFunc="handleAdd"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:12px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="svcList"
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
                    <template v-if="column.dataIndex === 'type'">
                        <span style="color: rgb(84, 138, 238);font-weight:bold;">{{ record.spec.type }} </span>
                    </template>
                    <template v-if="column.dataIndex === 'cluster-ip'">
                        <span>{{ record.spec.clusterIP }} </span>
                    </template>
                    <template v-if="column.dataIndex === 'external-ip'">
                        <span>{{ record.status.loadBalancer.svc ? record.status.loadBalancer.svc[0].ip : '' }} </span>
                    </template>
                    <template v-if="column.dataIndex === '端口'">
                        <span v-if="!record.spec.ports[0].nodePort">{{ record.spec.ports[0].port }}/{{ record.spec.ports[0].protocol }}</span>
                        <span v-if="record.spec.ports[0].nodePort">{{ record.spec.ports[0].port }}:{{ record.spec.ports[0].nodePort }}/{{ record.spec.ports[0].protocol }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag color="gray">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;" class="svc-button" type="primary" icon="form-outlined" @click="getSvcDetail(record)">YML</c-button>
                        <c-button class="svc-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delSvc)">删除</c-button>
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
            @ok="updateSvc">
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
        <!-- 创建svc的抽屉弹框 -->
        <a-drawer
            v-model:visible="createDrawer"
            title="创建Svc"
            :footer-style="{ textAlign: 'right' }"
            @close="onClose">
            <br>
            <a-form ref="formRef" :model="createSvc" :labelCol="{style: {width: '30%'}}">
                <a-form-item
                    label="名称"
                    name="cName"
                    :rules="[{ required: true, message: '请输入Svc名称' }]">
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
                    label="类型"
                    name="cType"
                    :rules="[{ required: true, message: '请输入类型' }]">
                    <a-select style="width:140px;" v-model:value="cType" placeholder="请选择">
                        <a-select-option value="ClusterIP">ClusterIP</a-select-option>
                        <a-select-option value="NodePort">NodePort</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item
                    label="容器端口"
                    name="cContainerPort"
                    :rules="[{ required: true, message: '请输入容器端口' }]">
                    <a-input v-model:value="cContainerPort" placeholder="80" />
                </a-form-item>
                <a-form-item
                    label="Service端口"
                    name="cPort"
                    :rules="[{ required: true, message: '请输入service端口' }]">
                    <a-input v-model:value="cPort" placeholder="80" />
                </a-form-item>
                <a-form-item
                    v-if="createSvc.cType == 'NodePort'"
                    label="NodePort"
                    name="cNodePort"
                    :rules="[{ required: true, message: '请输入nodeport' }]">
                    <a-input v-model:value="cNodePort" placeholder="30001" />
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
                title: 'Svc名',
                dataIndex: 'name'
            },
            {
                title: '标签',
                dataIndex: 'labels'
            },
            {
                title: '类型',
                dataIndex: 'type',
            },
            {
                title: 'CLUSTER-IP',
                dataIndex: 'cluster-ip'
            },
            {
                title: 'EXTERNAL-IP',
                dataIndex: 'external-ip'
            },
            {
                title: '端口',
                dataIndex: 'port'
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
        const svcList = ref([])
        const svcListData = reactive({
            url : common.k8sSvcList,
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
        const svcDetail =  reactive({
            metadata: {}
        })
        const svcDetailData =  reactive({
            url: common.k8sSvcDetail,
            params: {
                service_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //yaml更新
        const updateSvcData = reactive({
            url: common.k8sSvcUpdate,
            params: {
                namespace: '',
                content: '',
                cluster: ''
            }
        })
        //删除
        const delSvcData = reactive({
            url: common.k8sSvcDel,
            params: {
                service_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //创建
        const formRef = ref()
        const createDrawer = ref(false)
        const createSvc = reactive({
            cName: '',
            cNamespace: '',
            cType: 'ClusterIP',
            cContainerPort: '',
            cPort: '',
            cNodePort: '',
            cLabelStr: ''
        })
        const createSvcData = reactive({
            url: common.k8sSvcCreate,
            params: {
                name: '',
                namespace: '',
                label: {},
                type: '',
                container_port: '',
                port: '',
                node_port: '',
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
            getSvcList()
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
        function getSvcList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            svcListData.params.filter_name = searchValue.value
            svcListData.params.namespace = namespaceValue.value
            svcListData.params.cluster = localStorage.getItem('k8s_cluster')
            svcListData.params.page = pagination.currentPage
            svcListData.params.limit = pagination.pagesize
            httpClient.get(svcListData.url, {params: svcListData.params})
            .then(res => {
                //响应成功，获取svc列表和total
                svcList.value = res.data.items
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
        function getSvcDetail(e) {
            appLoading.value = true
            svcDetailData.params.service_name = e.metadata.name
            svcDetailData.params.namespace = namespaceValue.value
            svcDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(svcDetailData.url, {params: svcDetailData.params})
            .then(res => {
                //svcDetail = Object.assign(svcDetail, res.data)
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
        //更新svc
        function updateSvc() {
            appLoading.value = true
            //将yaml格式的svc对象转为json
            let content = JSON.stringify(transObj(contentYaml.value))
            updateSvcData.params.namespace = namespaceValue.value
            updateSvcData.params.content = content
            updateSvcData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(updateSvcData.url, updateSvcData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getSvcList()
                yamlModal.value = false
            })
        }
        //删除svc
        function delSvc(name) {
            appLoading.value = true
            delSvcData.params.svc_name = name
            delSvcData.params.namespace = namespaceValue.value
            delSvcData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delSvcData.url, {data: delSvcData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getSvcList()
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
                createSvcFunc()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        function resetForm() {
            formRef.value.resetFields();
        }
        //创建svc
        function createSvcFunc() {
            //正则匹配，验证label的合法性
            let reg = new RegExp("(^[A-Za-z]+=[A-Za-z0-9]+).*")
            if (!reg.test(createSvc.cLabelStr)) {
                message.warning("标签填写异常，请确认后重新填写")
                return
            }
            //加载loading动画
            appLoading.value = true
            //定义label、cpu和memory变量
            let label = new Map()
            //将label字符串转成数组
            let a = (createSvc.cLabelStr).split(",")
            //将数组转成map
            a.forEach(item => {
                let b = item.split("=")
                label[b[0]] = b[1]
            })
            createSvcData.params.name = createSvc.cName
            createSvcData.params.namespace = createSvc.cNamespace
            createSvcData.params.container_port = parseInt(createSvc.cContainerPort)
            createSvcData.params.port = parseInt(createSvc.cPort)
            createSvcData.params.node_port = parseInt(createSvc.cNodePort)
            createSvcData.params.label = label
            createSvcData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.post(createSvcData.url, createSvcData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                //重置表单
                resetForm()
                getSvcList()
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
            svcList,
            svcDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            createDrawer,
            createSvc,
            formRef,
            ...toRefs(createSvc),
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getNamespaceValue,
            getNamespaceList,
            getSvcList,
            getSvcDetail,
            onChange,
            updateSvc,
            showConfirm,
            delSvc,
            handleAdd,
            onClose,
            formSubmit
        }
    },
})
</script>

<style scoped>
    .svc-button {
        margin-right: 5px;
    }
    .ant-form-item {
        margin-bottom: 20px;
    }
</style>