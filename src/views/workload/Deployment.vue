<template>
    <div>
        <!--添加 新建-->
        <MainHead
            searchDescribe="关键词"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @namespaceList="getNamespaceList"
            @dataList="getDeploymentList"
            add
            @addFunc="handleAdd"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:12px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="deploymentList"
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
                    <template v-if="column.dataIndex === 'containers'">
                        <!--pod副本副本数目,运行正常的pod 预计的pod数目-->
                        <span style="font-weight:bold;">{{ record.status.availableReplicas > 0 ? record.status.availableReplicas: 0 }} / {{ record.spec.replicas > 0 ? record.spec.replicas: 0 }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'image'">
                        <div v-for="(val, key) in record.spec.template.spec.containers" :key="key">
                            <a-popover>
                                <template #content>
                                    <span>{{ val.image }}</span>
                                </template>
                                <a-tag style="margin-bottom:5px;cursor:pointer;" color="geekblue">{{ ellipsis(val.image.split('/').pop() ? val.image.split('/').pop() : val.image, 15 ) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag color="gray">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button class="deployment-button" type="primary" icon="form-outlined" @click="getDeploymentDetail(record)">YAML</c-button>
                        <c-button style="margin-bottom:5px;" class="deployment-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delDeployment)">删除</c-button>
                        <c-button class="deployment-button" type="warning" icon="block-outlined" @click="handleScale(record)">扩缩容</c-button>
                        <c-button class="deployment-button" type="warning" icon="retweet-outlined" @click="showConfirm('重启', record.metadata.name, restartDeployment)">重启</c-button>
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
            @ok="updateDeployment">
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
        <!-- 调整副本数的弹框 -->
        <a-modal
            v-model:visible="scaleModal"
            title="副本数调整"
            :confirm-loading="appLoading"
            cancelText="取消"
            okText="更新"
            @ok="scaleDeployment">
            <div style="text-align:center">
                <span style="margin-right:30px;">实例数: </span>
                <a-input-number v-model:value="scaleNum" :min="0" :max="30" label="描述文字"></a-input-number>
                <a-popover>
                    <template #content>
                        <span>Deployment实例数最小0，最大30</span>
                    </template>
                    <info-circle-outlined style="margin-left:10px;color:rgb(84, 138, 238);" />
                </a-popover>
            </div>
        </a-modal>
        <!--
             创建deployment的抽屉弹框
             抽屉从窗口边缘滑入，用户可在抽屉中完成相应操作后，回到原窗口，常用于数据展示、表单添加等
             title 抽屉的标题
             footerStyle 抽屉页脚部件的样式 align排列
             placement 抽屉的方向 'top' | 'right' | 'bottom' |'left' 
             bodyStyle 可用于设置 Drawer 内容部分的样式
            v-model:visible Drawer 是否可见
            width 宽度
            <br>空行
            -->
        <a-drawer
            v-model:visible="createDrawer"
            title="创建Deployment"
            :footer-style="{ textAlign: 'right' }"
            @close="onClose">
            <br>
        <!--
            a-form表单
            表单包含输入框，单选框，下拉选择，多选框等用户输 入的组件。使用表单，可以收集、验证和提交数据。
            表单内常用组件：
            a-input：输入框
            a-select：下拉选择框
            a-checkbox-group：多选框
            a-radio-group ：单选框
            a-switch：开关

            <a-form></a-form>:
            model 表单数据对象
            labelCol label 标签布局，同 <Col> 组件，设置 span offset 值，如 {span: 3, offset: 12} 或 sm: {span:3, offset: 12}
            rules 表单验证规则
            layout 表单布局
            labelAlign label 标签的文本对齐方式
            ref 用来获取dom元素或者组件
        -->
            <a-form ref="formRef" :model="createDeployment" :labelCol="{style: {width: '30%'}}">
                <!--
                    label label 标签的文本
                    name 表单域 model 字段，在使用 validate、resetFields 方法的情况下， 该属性是必填的
                    rules 表单验证规则
                -->
                <!--每个表单项目-->
                <a-form-item
                    label="名称"
                    name="createName"
                    :rules="[{ required: true, message: '请输入Deployment名称' }]">
                    <!--输入框 v-model本质v-bind v-on 双向绑定-->
                    <a-input v-model:value="createName" />
                </a-form-item>
                <a-form-item
                    label="命名空间"
                    name="createNamespace"
                    :rules="[{ required: true, message: '请选择命名空间' }]">
                    <!--下拉选择框 placeholder占位符-->
                    <a-select show-search style="width:140px;" v-model:value="createNamespace" placeholder="请选择">
                        <!--可选项 遍历-->
                        <a-select-option
                            v-for="(item, index) in namespaceList"
                            :key="index"
                            :value="item.metadata.name">
                            {{ item.metadata.name }}
                        </a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item
                    label="副本数"
                    name="createReplicas">
                    <!--数字输入 最大最小的限制-->
                    <a-input-number v-model:value="createReplicas" :min="1" :max="30"></a-input-number>
                    <!--提示-->
                    <a-popover>
                        <template #content>
                            <span>Deployment副本数最小1，最大30</span>
                        </template>
                        <!--信息圈概述  提示-->
                        <info-circle-outlined style="margin-left:10px;color:rgb(84, 138, 238);" />
                    </a-popover>
                </a-form-item>
                <a-form-item
                    label="镜像"
                    name="createImage"
                    :rules="[{ required: true, message: '请输入镜像名' }]">
                    <a-input v-model:value="createImage" />
                </a-form-item>
                <a-form-item
                    label="标签"
                    name="createLabelStr"
                    :rules="[{ required: true, message: '请输入标签' }]">
                    <!--占位符 案例-->
                    <a-input v-model:value="createLabelStr" placeholder="project=ms,app=gateway" />
                </a-form-item>
                <a-form-item
                    label="资源配额"
                    name="createResource"
                    :rules="[{ required: true, message: '请选择资源规格' }]">
                    <a-select show-search style="width:140px;" v-model:value="createResource" placeholder="请选择">
                        <a-select-option value="0.5/1">0.5核/1G</a-select-option>
                        <a-select-option value="1/2">1核/2G</a-select-option>
                        <a-select-option value="2/4">2核/4G</a-select-option>
                        <a-select-option value="4/8">4核/8G</a-select-option>
                        <a-select-option value="8/16">8核/16G</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item
                    label="容器端口"
                    name="createContainerPort"
                    :rules="[{ required: true, message: '请输入端口号' }]">
                    <a-input v-model:value="createContainerPort" />
                </a-form-item>
                <a-form-item
                    label="健康检查"
                    name="createHealthCheck">
                    <a-switch v-model:checked="createHealthCheck" />
                </a-form-item>
                <!--默认简单的路径 ping检测-->
                <a-form-item
                    v-if="createHealthCheck"
                    label="检测路径"
                    name="createHealthPath"
                    :rules="[{ required: true, message: '请输入健康检测路径' }]">
                    <a-input v-model:value="createHealthPath" />
                </a-form-item>
            </a-form>
            <!--抽屉底部-->
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
                title: 'Deployment名',
                dataIndex: 'name'
            },
            {
                title: '标签',
                dataIndex: 'labels'
            },
            {
                title: '容器组',
                dataIndex: 'containers',
            },
            {
                title: '镜像',
                dataIndex: 'image'
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
        const deploymentList = ref([])
        const deploymentListData = reactive({
            url : common.k8sDeploymentList,
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
        const deploymentDetail =  reactive({
            metadata: {}
        })
        const deploymentDetailData =  reactive({
            url: common.k8sDeploymentDetail,
            params: {
                deployment_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //yaml更新
        const updateDeploymentData = reactive({
            url: common.k8sDeploymentUpdate,
            params: {
                namespace: '',
                content: '',
                cluster: ''
            }
        })
        //扩缩容
        const scaleNum = ref(0)
        const scaleModal = ref(false)
        const scaleDeploymentData = reactive({
            url: common.k8sDeploymentScale,
            params: {
                deployment_name: '',
                namespace: '',
                scale_num: '',
                cluster: ''
            }
        })
        //重启
        const restartDeploymentData = reactive({
            url: common.k8sDeploymentRestart,
            params: {
                deployment_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //删除
        const delDeploymentData = reactive({
            url: common.k8sDeploymentDel,
            params: {
                deployment_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //创建
        const formRef = ref()
        const createDrawer = ref(false)
        const createDeployment = reactive({
            createName: '',
            createNamespace: '',
            createReplicas: 1,
            createImage: '',
            createResource: '',
            createHealthCheck: false,  //默认关闭探针
            createHealthPath: '',
            createLabelStr: '',
            createContainerPort: ''
        })
        const createDeploymentData = reactive({
            url: common.k8sDeploymentCreate,
            params: {
                name: '',
                namespace: '',
                replicas: 1,
                image: '',
                cpu: '',
                memory: '',
                health_check: false,
                health_path: '',
                label: {},
                container_port: '',
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
            getDeploymentList()
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
        function getDeploymentList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            deploymentListData.params.filter_name = searchValue.value
            deploymentListData.params.namespace = namespaceValue.value
            deploymentListData.params.cluster = localStorage.getItem('k8s_cluster')
            deploymentListData.params.page = pagination.currentPage
            deploymentListData.params.limit = pagination.pagesize
            httpClient.get(deploymentListData.url, {params: deploymentListData.params})
            .then(res => {
                //响应成功，获取deployment列表和total
                deploymentList.value = res.data.items
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
        function getDeploymentDetail(e) {
            appLoading.value = true
            deploymentDetailData.params.deployment_name = e.metadata.name
            deploymentDetailData.params.namespace = namespaceValue.value
            deploymentDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(deploymentDetailData.url, {params: deploymentDetailData.params})
            .then(res => {
                //deploymentDetail = Object.assign(deploymentDetail, res.data)
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
        //更新deployment
        function updateDeployment() {
            appLoading.value = true
            //将yaml格式的deployment对象转为json
            let content = JSON.stringify(transObj(contentYaml.value))
            updateDeploymentData.params.namespace = namespaceValue.value
            updateDeploymentData.params.content = content
            updateDeploymentData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(updateDeploymentData.url, updateDeploymentData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getDeploymentList()
                yamlModal.value = false
            })
        }
        //扩缩容的中间方法，用于赋值及打开弹出框
        function handleScale(e) {
            scaleModal.value = true
            deploymentDetail.metadata = e.metadata
            scaleNum.value = e.spec.replicas
        }
        //扩缩容
        function scaleDeployment() {
            appLoading.value = true
            scaleDeploymentData.params.deployment_name = deploymentDetail.metadata.name
            scaleDeploymentData.params.namespace = namespaceValue.value
            scaleDeploymentData.params.scale_num = scaleNum.value
            scaleDeploymentData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(scaleDeploymentData.url, scaleDeploymentData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getDeploymentList()
                scaleModal.value = false
            })
        }
        //重启deployment
        function restartDeployment(name) {
            appLoading.value = true
            restartDeploymentData.params.deployment_name = name
            restartDeploymentData.params.namespace = namespaceValue.value
            restartDeploymentData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(restartDeploymentData.url, restartDeploymentData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getDeploymentList()
            })
        }
        //删除deployment
        function delDeployment(name) {
            appLoading.value = true
            delDeploymentData.params.deployment_name = name
            delDeploymentData.params.namespace = namespaceValue.value
            delDeploymentData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delDeploymentData.url, {data: delDeploymentData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getDeploymentList()
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
                createDeploymentFunc()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        function resetForm() {
            formRef.value.resetFields();
        }
        //创建deployment
        function createDeploymentFunc() {
            //正则匹配，验证label的合法性
            let reg = new RegExp("(^[A-Za-z]+=[A-Za-z0-9]+).*")
            if (!reg.test(createDeployment.createLabelStr)) {
                message.warning("标签填写异常，请确认后重新填写")
                return
            }
            //加载loading动画
            appLoading.value = true
            //定义label、cpu和memory变量
            let label = new Map()
            let cpu, memory
            //将label字符串转成数组
            let a = (createDeployment.createLabelStr).split(",")
            //将数组转成map
            a.forEach(item => {
                let b = item.split("=")
                label[b[0]] = b[1]
            })
            //将deployment的规格转成cpu和memory
            let resourceList = createDeployment.createResource.split("/")
            cpu = resourceList[0]
            memory = resourceList[1] + "Gi"
            //赋值
            createDeploymentData.params.label = label
            createDeploymentData.params.cpu = cpu
            createDeploymentData.params.memory = memory
            createDeploymentData.params.name = createDeployment.createName
            createDeploymentData.params.namespace = createDeployment.createNamespace
            createDeploymentData.params.replicas = createDeployment.createReplicas
            createDeploymentData.params.image = createDeployment.createImage
            createDeploymentData.params.health_check = createDeployment.createHealthCheck
            createDeploymentData.params.health_path = createDeployment.createHealthPath
            createDeploymentData.params.container_port = parseInt(createDeployment.createContainerPort)
            createDeploymentData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.post(createDeploymentData.url, createDeploymentData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                //重置表单
                resetForm()
                getDeploymentList()
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
                    resetForm()  //重置表单
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
            deploymentList,
            deploymentDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            scaleModal,
            scaleNum,
            createDrawer,
            createDeployment,
            formRef,
            ...toRefs(createDeployment),
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getNamespaceValue,
            getNamespaceList,
            getDeploymentList,
            getDeploymentDetail,
            onChange,
            updateDeployment,
            handleScale,
            scaleDeployment,
            showConfirm,
            restartDeployment,
            delDeployment,
            handleAdd,
            onClose,
            formSubmit
        }
    },
})
</script>

<!--一般是在template的class 或者scripts的setup-->
<style scoped>
    .deployment-button {
        margin-right: 5px;
    }
    .ant-form-item {
        margin-bottom: 20px;
    }
</style>