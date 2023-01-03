<template>
    <div>
        <MainHead
            searchDescribe="关键词"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @dataList="getStatefulSetList"
            add
            @addFunc="handleAdd"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:15px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="statefulSetList"
                :pagination="pagination"
                @change="handleTableChange">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'name'">
                        <span style="font-weight: bold;color:coral;font-size:medium">{{ record.metadata.name }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'labels'">
                        <div v-for="(val, key) in record.metadata.labels" :key="key">
                            <a-popover>
                                <template #content>
                                    <span>{{ key + ":" +val }}</span>
                                </template>
                                <a-tag style="margin-bottom:5px;cursor:pointer;font-size:medium;color:greenyellow" color="blue">{{ ellipsis(key + ":" +val, 15) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'containers'">
                        <span>{{ record.status.currentReplicas>0?record.status.currentReplicas:0  }} / {{ record.spec.replicas>0?record.spec.replicas:0 }} </span>
                    </template>
                    <template v-if="column.dataIndex === 'image'">
                        <div v-for="(val, key) in record.spec.template.spec.containers" :key="key">
                            <a-popover>
                                <template #content>
                                    <span>{{ val.image }}</span>
                                </template>
                                <a-tag style="margin-bottom:5px;cursor:pointer;font-size:medium;color:gold" color="geekblue">{{ ellipsis(val.image.split('/').pop() ? val.image.split('/').pop() : val.image, 15 ) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag style="color:linen;font-size:medium">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;color:aqua" class="statefulSet-button" type="primary" icon="form-outlined" @click="getStatefulSetDetail(record)">YAML</c-button>
                        <c-button style="color:crimson" class="statefulSet-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delStatefulSet)">删除</c-button>
                    </template>
                </template>
            </a-table>
        </a-card>
        <!-- 展示YAML信息的弹框 visible显示 设置了默认值false-->
        <a-modal
            v-model:visible="yamlModal"
            title="YAML信息"
            :confirm-loading="appLoading"
            cancelText="取消"
            width="900px"
            okText="更新"
            @ok="updateStatefulSet">
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
            title="创建Statefulset"
            width="800px"
            :footer-style="{ textAlign: 'right' }"
            @close="onClose">
            <br>
            <a-form ref="formRef" :model="createStatefulset" :labelCol="{style: {width: '30%'}}">
                <a-form-item
                    label="name"
                    name="createName"
                    :rules="[{ required: true, message: '请输入Statefulset名称' }]">
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
                    label="replicas"
                    name="createReplicas">
                    <!--数字输入 最大最小的限制-->
                    <a-input-number style="color:khaki" v-model:value="createReplicas" :min="1" :max="50"></a-input-number>
                    <!--提示-->
                    <a-popover>
                        <template #content>
                            <span style="color:aquamarine">副本数Min1，Max50</span>
                        </template>
                        <!--信息圈概述  提示-->
                        <br>
                        <info-circle-outlined style="margin-left:10px;color:greenyellow" />
                    </a-popover>
                </a-form-item>
                <a-form-item
                    label="service name"
                    name="createServiceName"
                    :rules="[{ required: true, message: '请输入service name' }]">
                    <a-input style="color:khaki" v-model:value="createServiceName" />
                </a-form-item>
                <a-form-item
                    label="mount name"
                    name="createVolumeMountName"
                    :rules="[{ required: true, message: '请输入volume mount name' }]">
                    <a-input style="color:khaki" v-model:value="createVolumeMountName" />
                </a-form-item>
                <a-form-item
                    label="mount path"
                    name="createMountPath"
                    :rules="[{ required: true, message: '请输入mount path' }]">
                    <a-input style="color:khaki" v-model:value="createMountPath" />
                </a-form-item>
                <a-form-item
                    label="volumn claim name"
                    name="createVolumeClaimName"
                    :rules="[{ required: true, message: '请输入volume claim name' }]">
                    <a-input style="color:khaki" v-model:value="createVolumeClaimName" />
                </a-form-item>
                <a-form-item
                    label="storage"
                    name="createStorage"
                    :rules="[{ required: true, message: '请输入storage' }]">
                    <a-input style="color:khaki" v-model:value="createStorage" />
                </a-form-item>
                <a-form-item
                    label="access mode"
                    name="createAccessMode"
                    :rules="[{ required: true, message: '请输入Access Mode' }]">
                    <a-select show-search style="width:140px;color:aquamarine" v-model:value="createAccessMode" placeholder="请选择">
                        <a-select-option style="color:aquamarine" value="ReadWriteOnce">RWO</a-select-option>
                        <a-select-option style="color:aquamarine" value="ReadWriteMany">RWX</a-select-option>
                        <a-select-option style="color:aquamarine" value="ReadOnlyMany">ROX</a-select-option>
                        <a-select-option style="color:aquamarine" value="ReadWriteOnce/ReadOnlyMany">RWO/ROX</a-select-option>
                        <a-select-option style="color:aquamarine" value="ReadWriteMany/ReadOnlyMany">RWX/ROX</a-select-option>
                        <a-select-option style="color:aquamarine" value="ReadWriteOnce/ReadOnlyMany">ROX/RWO</a-select-option>
                        <a-select-option style="color:aquamarine" value="ReadWriteOnce/ReadWriteMany/ReadOnlyMany">RWO/RWX/ROX</a-select-option>
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
                title: 'StatefulSet',
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
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: total => `共 ${total} 条`
        })
        //列表
        const statefulSetList = ref([])
        const statefulSetListData = reactive({
            url : common.k8sStatefulSetList,
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
        const statefulSetDetail =  reactive({
            metadata: {}
        })
        const statefulSetDetailData =  reactive({
            url: common.k8sStatefulSetDetail,
            params: {
                statefulset_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //yaml更新
        const updateStatefulSetData = reactive({
            url: common.k8sStatefulSetUpdate,
            params: {
                namespace: '',
                content: '',
                cluster: ''
            }
        })
        //删除
        const delStatefulSetData = reactive({
            url: common.k8sStatefulSetDel,
            params: {
                statefulset_name: '',
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
        const namespaceList = ref([])
        function handleTableChange(val) {
            pagination.currentPage = val.current
            pagination.pagesize = val.pageSize
            getStatefulSetList()
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
        //列表
        function getStatefulSetList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            statefulSetListData.params.filter_name = searchValue.value
            statefulSetListData.params.namespace = namespaceValue.value
            statefulSetListData.params.cluster = localStorage.getItem('k8s_cluster')
            statefulSetListData.params.page = pagination.currentPage
            statefulSetListData.params.limit = pagination.pagesize
            httpClient.get(statefulSetListData.url, {params: statefulSetListData.params})
            .then(res => {
                //响应成功，获取statefulSet列表和total
                statefulSetList.value = res.data.items
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
        function getStatefulSetDetail(e) {
            appLoading.value = true
            statefulSetDetailData.params.statefulset_name = e.metadata.name
            statefulSetDetailData.params.namespace = namespaceValue.value
            statefulSetDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(statefulSetDetailData.url, {params: statefulSetDetailData.params})
            .then(res => {
                //statefulSetDetail = Object.assign(statefulSetDetail, res.data)
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
        //更新statefulSet
        function updateStatefulSet() {
            appLoading.value = true
            //将yaml格式的statefulSet对象转为json
            let content = JSON.stringify(transObj(contentYaml.value))
            updateStatefulSetData.params.namespace = namespaceValue.value
            updateStatefulSetData.params.content = content
            updateStatefulSetData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(updateStatefulSetData.url, updateStatefulSetData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getStatefulSetList()
                yamlModal.value = false
            })
        }
        //删除statefulSet
        function delStatefulSet(name) {
            appLoading.value = true
            delStatefulSetData.params.statefulSet_name = name
            delStatefulSetData.params.namespace = namespaceValue.value
            delStatefulSetData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delStatefulSetData.url, {data: delStatefulSetData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getStatefulSetList()
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
                //关闭
                cancelText: '取消',
                okText: '确认',
                onOk() {
                    fn(res)
                },
                // onCancel() {
                //     console.log('Cancel'); f12
                // }
            })
        }

        //创建
        const formRef = ref()
        const createDrawer = ref(false)
        const createStatefulset = reactive({
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
            createReplicas:1,
            createServiceName:'',
            createVolumeMountName:'',
            createMountPath:'',
            createVolumeClaimName:'',
            createAccessMode:'ReadWriteOnce',
            createStorage:'',
        })
        const createStatefulsetData = reactive({
            url: common.k8sStatefulsetCreate,
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
                replicas:1,
                service_name:'',
                volume_mount_name:'',
                mount_path:'',
                volume_claim_name:'',
                access_mode:'',
                storage:'',
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
                createStatefulsetFunc()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        function getNamespaceList(val) {
            namespaceList.value = val
        }
        //创建statefulset
        function createStatefulsetFunc() {
            let reg = new RegExp("(^[A-Za-z]+=[A-Za-z0-9]+).*")
            if (!reg.test(createStatefulset.createLabel) && createStatefulset.createLabel!=='') {
                message.warning("标签填写异常，请确认后重新填写")
                return
            }
            if (!reg.test(createStatefulset.createPodLabel)&& createStatefulset.createPodLabel!=='') {
                message.warning("标签填写异常，请确认后重新填写")
                return
            }
            appLoading.value = true
            let label = new Map()
            let podLabel =new Map()
            let a = (createStatefulset.createLabel).split(",")
            let c = (createStatefulset.createPodLabel).split(",")
            a.forEach(item => {
                let b = item.split("=")
                label[b[0]] = b[1]
            })
            c.forEach(item => {
                let d = item.split("=")
                podLabel[d[0]] = d[1]
            })
            let storage
            storage=createStatefulset.createStorage+"Gi"
            //加载loading动画
            createStatefulsetData.params.label = label
            createStatefulsetData.params.limit_cpu = createStatefulset.createLimitCpu
            createStatefulsetData.params.request_cpu = createStatefulset.createRequestCpu
            createStatefulsetData.params.limit_memory = createStatefulset.createLimitMemory
            createStatefulsetData.params.replicas = createStatefulset.createReplicas
            createStatefulsetData.params.service_name = createStatefulset.createServiceName
            createStatefulsetData.params.volume_mount_name = createStatefulset.createVolumeMountName
            createStatefulsetData.params.pod_label = podLabel
            createStatefulsetData.params.mount_path = createStatefulset.createMountPath
            createStatefulsetData.params.volume_claim_name = createStatefulset.createVolumeClaimName
            createStatefulsetData.params.access_mode = createStatefulset.createAccessMode
            createStatefulsetData.params.storage = storage
            createStatefulsetData.params.request_memory = createStatefulset.createRequestMemory
            createStatefulsetData.params.name = createStatefulset.createName
            createStatefulsetData.params.namespace = createStatefulset.createNamespace
            createStatefulsetData.params.image = createStatefulset.createImage
            createStatefulsetData.params.health_check = createStatefulset.createHealthCheck
            createStatefulsetData.params.health_path = createStatefulset.createHealthPath
            createStatefulsetData.params.container_port = createStatefulset.createContainerPort
            //vue中实现本地储存的方法：localStorage，在HTML5中，新加入了一个localStorage特性，这个特性主要是用来作为本地存储来使用的，解决了cookie存储空间不足的问题(cookie中每条cookie的存储空间为4k)，localStorage中一般浏览器支持的是5M大小，这个在不同的浏览器中localStorage会有所不同。
            createStatefulsetData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.post(createStatefulsetData.url, createStatefulsetData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                //重置表单
                resetForm()
                getStatefulSetList()
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
            statefulSetList,
            statefulSetDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            createDrawer,
            createStatefulset,
            namespaceList,
            formRef,
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getNamespaceValue,
            getStatefulSetList,
            getStatefulSetDetail,
            onChange,
            updateStatefulSet,
            showConfirm,
            delStatefulSet,
            ...toRefs(createStatefulset),
            handleAdd,
            onClose,
            formSubmit,
            getNamespaceList,
        }
    },
})
</script>


<style scoped>
    .statefulSet-button {
        margin-right: 5px;
        width:77px;

    }
    .ant-form-item {
        margin-bottom: 20px;
    }
</style>