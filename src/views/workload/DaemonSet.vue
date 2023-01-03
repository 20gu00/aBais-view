<template>
    <div>
        <MainHead
            searchDescribe="关键词"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @namespaceList="getNamespaceList"
            @dataList="getDaemonSetList"
            add
            @addFunc="handleAdd"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:15px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="daemonSetList"
                :pagination="pagination"
                @change="handleTableChange">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'name'">
                        <span style="font-weight: bold;color:coral;font-size:medium">{{ record.metadata.name }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'labels'">
                        <div v-for="(val, key) in record.metadata.labels" :key="key">
                            <a-popover>
                                <!--content-->
                                <template #content>
                                    <span>{{ key + ":" +val }}</span>
                                </template>
                                <a-tag style="margin-bottom:5px;cursor:pointer;font-size:medium;color:greenyellow">{{ ellipsis(key + ":" +val, 15) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'containers'">
                        <!--应该调度的有也就是应该有多少个容器 可用的有 左边true那么就是?右边不然就是:右边的0 如果小于等于0那就是0-->
                        <span>{{ record.status.numberAvailable>0?record.status.numberAvailable:0  }} / {{ record.status.desiredNumberScheduled>0?record.status.desiredNumberScheduled:0 }} </span>
                    </template>
                    <template v-if="column.dataIndex === 'image'">
                        <!--遍历容器-->
                        <div v-for="(val, key) in record.spec.template.spec.containers" :key="key">
                            <a-popover>
                                <template #content>
                                    <!--image-->
                                    <span>{{ val.image }}</span>
                                </template>
                                <a-tag style="font-size:medium;color:gold;margin-bottom:5px;cursor:pointer;" color="geekblue">{{ ellipsis(val.image.split('/').pop() ? val.image.split('/').pop() : val.image, 15 ) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag style="color:linen;font-size:medium">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;color:aqua" class="daemonSet-button" type="primary" icon="form-outlined" @click="getDaemonSetDetail(record)">YAML</c-button>
                        <c-button style="color:crimson" class="daemonSet-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delDaemonSet)">删除</c-button>
                    </template>
                </template>
            </a-table>
        </a-card>
        <!-- 展示YAML信息的弹框 modal对话框-->
        <a-modal
            width="900px"
            v-model:visible="yamlModal"
            title="YAML信息"
            :confirm-loading="appLoading"
            cancelText="取消"
            okText="更新"
            @ok="updateDaemonSet">
            <!-- codemirror编辑器 -->
            <!-- border 带边框 -->
            <!-- options  编辑器配置 -->
            <!-- change 编辑器中的内容变化时触发 -->
            <codemirror
                :value="contentYaml"
                border
                :options="cmOptions"
                height="600"
                style="font-size:19px;"
                @change="onChange"
            ></codemirror>
        </a-modal>
        <a-drawer
            v-model:visible="createDrawer"
            title="创建Daemonset"
            width="800px"
            :footer-style="{ textAlign: 'right' }"
            @close="onClose">
            <br>
            <a-form ref="formRef" :model="createDaemonset" :labelCol="{style: {width: '30%'}}">
                <a-form-item
                    label="name"
                    name="createName"
                    :rules="[{ required: true, message: '请输入Deployment名称' }]">
                    <!--输入框 v-model本质v-bind v-on 双向绑定-->
                    <a-input style="color:khaki" v-model:value="createName" />
                </a-form-item>
                <a-form-item
                    style="color:khaki"
                    label="namespace"
                    name="createNamespace"
                    :rules="[{ required: true, message: '请选择namespace' }]">
                    <!--下拉选择框 placeholder占位符-->
                    <a-select show-search  style="width:140px;color:khaki" v-model:value="createNamespace" placeholder="请选择">
                        <!--可选项 遍历-->
                        <a-select-option
                            style="color:khaki"
                            v-for="(item, index) in namespaceList"
                            :key="index"
                            :value="item.metadata.name">
                            {{ item.metadata.name }}
                        </a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item
                    label="image"
                    name="createImage"
                    :rules="[{ required: true, message: '请输入image' }]">
                    <a-input style="color:khaki" v-model:value="createImage" />
                    <a-popover>
                        <template #content>
                            <span style="color:aquamarine">多个镜像用","隔开,即一pod多容器场景</span>
                        </template>
                        <info-circle-outlined style="margin-left:10px;color:greenyellow" />
                    </a-popover>
                </a-form-item>
                <a-form-item
                    label="label"
                    name="createLabelStr"
                    :rules="[{ required: false, message: '请输入label' }]">
                    <!--占位符 案例-->
                    <a-input style="color:khaki" v-model:value="createLabelStr" placeholder="project=test,app=gateway" />
                </a-form-item>
                <a-form-item
                    label="pod label"
                    name="createPodLabel"
                    :rules="[{ required: true, message: '请输入pod label' }]">
                    <!--占位符 案例-->
                    <a-input style="color:khaki" v-model:value="createPodLabel" placeholder="project=test,app=gateway" />
                </a-form-item>
                <a-form-item
                    label="limit"
                    name="limit资源"
                    :rules="[{ required: false, message: '请输入limit资源' }]">
                    <a-input style="color:khaki" v-model:value="createLimitCpu" placeholder="like 0.5 or 1 or2" />
                    <a-input style="color:khaki" v-model:value="createLimitMemory" placeholder="like 100Mi or 1Gi" />
                    <a-popover>
                        <template #content>
                            <span style="color:aquamarine">有先后顺序,对应image数目以image为参考,多了无意义,多了无意义,多个用","隔开</span>
                        </template>
                        <info-circle-outlined style="margin-left:10px;color:greenyellow" />
                    </a-popover>
                </a-form-item>
                <a-form-item
                    label="request"
                    name="request资源"
                    :rules="[{ required: false, message: '请输入request资源' }]">
                    <a-input style="color:khaki" v-model:value="createRequestCpu" placeholder="like 0.5 or 1 or2" />
                    <a-input style="color:khaki" v-model:value="createRequestMemory" placeholder="like 100Mi or 1Gi" />
                    <a-popover>
                        <template #content>
                            <span style="color:aquamarine">有先后顺序,对应image,数目以image为参考,多了无意义,多了无意义,多个用","隔开</span>
                        </template>
                        <info-circle-outlined style="margin-left:10px;color:greenyellow" />
                    </a-popover>
                </a-form-item>
                <a-form-item
                    label="container port"
                    name="createContainerPort"
                    :rules="[{ required: true, message: '请输入端口号' }]">
                    <a-input style="color:khaki" v-model:value="createContainerPort" />
                    <a-popover>
                        <template #content>
                            <span style="color:aquamarine">多个端口用","隔开,即一pod多容器场景(数目与image对应)</span>
                        </template>
                        <info-circle-outlined style="margin-left:10px;color:greenyellow" />
                    </a-popover>
                </a-form-item>
                <a-form-item
                    label="health check"
                    name="createHealthCheck">
                    <a-switch v-model:checked="createHealthCheck" />
                </a-form-item>
                <!--默认简单的路径 ping检测-->
                <a-form-item
                    v-if="createHealthCheck"
                    label="检测路径"
                    name="createHealthPath"
                    :rules="[{ required: true, message: '请输入要进行健康检测的路径' }]">
                    <a-input style="color:khaki" v-model:value="createHealthPath" />
                </a-form-item>
            </a-form>
            <!--抽屉底部-->
            <template #footer>
                <a-button style="margin-right: 8px" @click="onClose()">取消</a-button>
                <a-button type="primary" @click="formSubmit()">确定</a-button>
            </template>
        </a-drawer>
    </div>
</template>

<script>
//导入方法
import { createVNode, reactive, ref,toRefs } from 'vue';
//类似别名
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
        //column
        const columns = ref([
            {
                title: 'DeamonSet',
                dataIndex: 'name'
            },
            {
                title: 'label',
                dataIndex: 'labels'
            },
            {
                title: 'pod组',
                dataIndex: 'containers',
            },
            {
                title: 'image',
                dataIndex: 'image'
            },
            {
                title: '创建时间',
                dataIndex: 'creationTimestamp'
            },
            {
                title: 'action',
                key: 'action',
                fixed: 'right',
                width: 200
            }
        ])
        //常用项
        const appLoading = ref(false)
        const searchValue = ref('')
        const namespaceValue = ref('')
        //分页
        const pagination = reactive({
            showSizeChanger: true,
            showQuickJumper: true,
            total: 0,
            currentPage: 1,
            pagesize: 10,
            pageSizeOptions: ["10", "20", "50", "100","200","500","1000"],
            showTotal: total => `共 ${total} 条`
        })
        //列表
        const daemonSetList = ref([])
        const daemonSetListData = reactive({
            url : common.k8sDaemonSetList,
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

        const namespaceList = ref([])
        const daemonSetDetail =  reactive({
            metadata: {}
        })
        const daemonSetDetailData =  reactive({
            url: common.k8sDaemonSetDetail,
            params: {
                daemonset_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //yaml更新
        const updateDaemonSetData = reactive({
            url: common.k8sDaemonSetUpdate,
            params: {
                namespace: '',
                content: '',
                cluster: ''
            }
        })
        //删除
        const delDaemonSetData = reactive({
            url: common.k8sDaemonSetDel,
            params: {
                daemonset_name: '',
                namespace: '',
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
            getDaemonSetList()
        }
        function getSearchValue(val) {
            searchValue.value = val
        }
        function getNamespaceValue(val) {
            namespaceValue.value = val
        }
        //编辑器内容变化时触发的方式,用于将更新的内容复制到变量中
        function onChange(val) {
            contentYaml.value = val
        }
        function getNamespaceList(val) {
            namespaceList.value = val
        }
        //列表
        function getDaemonSetList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            daemonSetListData.params.filter_name = searchValue.value
            daemonSetListData.params.namespace = namespaceValue.value
            daemonSetListData.params.cluster = localStorage.getItem('k8s_cluster')
            daemonSetListData.params.page = pagination.currentPage
            daemonSetListData.params.limit = pagination.pagesize
            httpClient.get(daemonSetListData.url, {params: daemonSetListData.params})
            .then(res => {
                //响应成功，获取daemonSet列表和total
                daemonSetList.value = res.data.items
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
        function getDaemonSetDetail(e) {
            appLoading.value = true
            daemonSetDetailData.params.daemonset_name = e.metadata.name
            daemonSetDetailData.params.namespace = namespaceValue.value
            daemonSetDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(daemonSetDetailData.url, {params: daemonSetDetailData.params})
            .then(res => {
                //daemonSetDetail = Object.assign(daemonSetDetail, res.data)
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
        //更新daemonSet
        function updateDaemonSet() {
            appLoading.value = true
            //将yaml格式的daemonSet对象转为json
            let content = JSON.stringify(transObj(contentYaml.value))
            updateDaemonSetData.params.namespace = namespaceValue.value
            updateDaemonSetData.params.content = content
            updateDaemonSetData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(updateDaemonSetData.url, updateDaemonSetData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getDaemonSetList()
                yamlModal.value = false
            })
        }
        //删除daemonSet
        function delDaemonSet(name) {
            appLoading.value = true
            delDaemonSetData.params.daemonSet_name = name
            delDaemonSetData.params.namespace = namespaceValue.value
            delDaemonSetData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delDaemonSetData.url, {data: delDaemonSetData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getDaemonSetList()
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

        //创建
        const formRef = ref()
        const createDrawer = ref(false)
        const createDaemonset = reactive({
            createName: '',
            createNamespace: 'default',
            createLabel: '',
            createImage: '',
            createLimitCpu: '',
            createLimitMemory: '',
            createRequestCpu: '1',
            createRequestMemory: '1Gi',
            createContainerPort: '',
            createHealthCheck: false,
            createHealthPath: '',
            createPodLabel:'',
        })
        const createDaemonsetData = reactive({
            url: common.k8sDaemonsetCreate,
            params: {
                name: '',
                cluster: '',
                namespace:'',
                image:'',
                label:{},
                pod_label:{},
                limit_cpu:'',
                limit_memory:'',
                request_cpu:'',
                request_memory:'',
                container_port:'',
                health_check:false,
                health_path:'',
            }
        })

        //处理新增
        function handleAdd() {
            createDrawer.value = true
        }
        function resetForm() {
            formRef.value.resetFields();
        }
        //验证表单
        async function formSubmit() {
            try {
                await formRef.value.validateFields();
                //console.log('Success:', values);
                createDaemonsetFunc()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        //创建deployment
        function createDaemonsetFunc() {
            let reg = new RegExp("(^[A-Za-z]+=[A-Za-z0-9]+).*")
            if (!reg.test(createDaemonset.createLabel) && createDaemonset.createLabel!=='') {
                message.warning("标签填写异常，请确认后重新填写")
                return
            }
            if (!reg.test(createDaemonset.createPodLabel)&& createDaemonset.createPodLabel!=='') {
                message.warning("标签填写异常，请确认后重新填写")
                return
            }
            appLoading.value = true
            let label = new Map()
            let podLabel =new Map()
            let a = (createDaemonset.createLabel).split(",")
            let c = (createDaemonset.createPodLabel).split(",")
            a.forEach(item => {
                let b = item.split("=")
                label[b[0]] = b[1]
            })
            c.forEach(item => {
                let d = item.split("=")
                podLabel[d[0]] = d[1]
            })
            //加载loading动画
            createDaemonsetData.params.label = label
            createDaemonsetData.params.limit_cpu = createDaemonset.createLimitCpu
            createDaemonsetData.params.request_cpu = createDaemonset.createRequestCpu
            createDaemonsetData.params.limit_memory = createDaemonset.createLimitMemory
            createDaemonsetData.params.pod_label = podLabel
            createDaemonsetData.params.request_memory = createDaemonset.createRequestMemory
            createDaemonsetData.params.name = createDaemonset.createName
            createDaemonsetData.params.namespace = createDaemonset.createNamespace
            createDaemonsetData.params.image = createDaemonset.createImage
            createDaemonsetData.params.health_check = createDaemonset.createHealthCheck
            createDaemonsetData.params.health_path = createDaemonset.createHealthPath
            createDaemonsetData.params.container_port = createDaemonset.createContainerPort
            //vue中实现本地储存的方法：localStorage，在HTML5中，新加入了一个localStorage特性，这个特性主要是用来作为本地存储来使用的，解决了cookie存储空间不足的问题(cookie中每条cookie的存储空间为4k)，localStorage中一般浏览器支持的是5M大小，这个在不同的浏览器中localStorage会有所不同。
            createDaemonsetData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.post(createDaemonsetData.url, createDaemonsetData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                //重置表单
                resetForm()
                getDaemonSetList()
                //关闭抽屉
                createDrawer.value = false
            })
        }
        //关闭抽屉
        function onClose () {
            Modal.confirm({
                title: "是否确认关闭? ",
                icon: createVNode(ExclamationCircleOutlined),
                content: createVNode('div', {
                    //style: 'color:red;',
                }),
                cancelText: '取消',
                okText: '确认',
                onOk() {
                    createDrawer.value = false
                    resetForm()  //重置表单
                },
                onCancel() {
                    createDrawer.value = true
                }
            })
        }
        return {
            appLoading,
            pagination,
            columns,
            daemonSetList,
            daemonSetDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            createDrawer,
            createDaemonset,
            namespaceList,
            formRef,
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getNamespaceValue,
            getDaemonSetList,
            getDaemonSetDetail,
            onChange,
            updateDaemonSet,
            showConfirm,
            delDaemonSet,
            ...toRefs(createDaemonset),
            handleAdd,
            onClose,
            formSubmit,
            getNamespaceList,
        }
    },
})
</script>

<style scoped>
    .daemonSet-button {
        margin-right: 5px;
        width:77px;
    }
    .ant-form-item {
        margin-bottom: 20px;
    }
</style>