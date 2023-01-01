<template>
    <div>
        <!--main的头部-->
        <MainHead
            searchDescribe="关键词"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @namespaceList="getNamespaceList"
            @dataList="getPodList"
            add
            @addFunc="handleAdd"/>
        <!--card 通用卡片容器，可承载文字、列表、图片、段落-->
        <!--bodyStyle 内容区域自定义样式 css padding上下左右内边距-->
        <a-card :bodyStyle="{padding: '10px'}">
             <!--表格 用于展示多条结构类似的数据，可对数据进行排序、筛选、对比或 其他自定义操作-->
            <!--bodyCell 个性化单元格 bordered 是否展示外边框和列边框 loading 页面是否加载中 columns 表格列的配置描述 dataSource 数据数组 pagination 分页器 size 表格大小 change事件 分页、排序、筛选变化时
触发-->
             <a-table
                style="font-size:15px" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="podList"
                :pagination="pagination"
                @change="handleTableChange">
                <!--column 定义的columns数据 record 定义的dataSource数据 ""*-->
                <template #bodyCell="{ column, record }">
                    <!--自定义每一列的数据-->
                    <template v-if="column.dataIndex === 'name'">
                        <!--行内标签 字体 color-->
                        <span style="font-weight: bold;color:coral;font-size:medium">{{ record.metadata.name }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'node'">
                        <span style="color:dodgerblue;font-size:medium">{{ record.spec.nodeName }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'state'">
                        <!--块 进行排版 align left 居左，默认 right 居右 center 居中 justify-->
                        <!--class类 亮点和描述-->
                        <div :class="{'succ-dot':record.status.phase == 'Running', 'warn-dot':record.status.phase == 'Pending', 'err-dot':record.status.phase != 'Running' && record.status.phase != 'Pending'}"></div>
                        <div v-for="(val,key) in record.status.containerStatuses" :key="key">
                               <span v-if="val.ready !==true">{{readyToFalse()}}</span>
                               <span v-else>{{ readyToTrue() }}</span>
                        </div>
                        <div v-if="allContainerReady===false" style="font-size:medium;color:gainsboro">not all container ready</div>
                        <div v-else :class="{'succ-state':record.status.phase == 'Running', 'warn-state':record.status.phase == 'Pending', 'err-status':record.status.phase != 'Running' && record.status.phase != 'Pending'}">{{ record.status.phase }} </div>
                    </template>
                    <template v-if="column.dataIndex === 'restarts'">
                         <span style="color:cadetblue;font-size:medium">{{ restartTotal(record) }} </span>
                    </template>
                    <!--vue的组件的模板-->
                    <template v-if="column.dataIndex === 'labels'">
                        <!--循环标签-->
                        <!--块,自动排版-->
                        <div v-for="(val, key) in record.metadata.labels" :key="key">
                            <!--强度校验-->
                            <a-popover>
                                <template #content>
                                    <span>{{ key + ":" +val }}</span>
                                </template>
                                <!--标签 margin-bottom元素的下边距  cursor:pointer|hand 炫富光标变成手形 color整体颜色 ellipsis自动处理文本的省略-->
                                <a-tag style="margin-bottom:5px;cursor:pointer;font-size:medium" color="blue">{{ ellipsis(key + ":" +val, 15) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'image'">
                        <div v-for="(val, key) in record.spec.containers" :key="key">
                            <a-popover>
                                <template #content>
                                    <span>{{ val.image }}</span>
                                </template>
                                <a-tag style="margin-bottom:10px;cursor:pointer;font-size:medium;color:gold" color="geekblue">{{ ellipsis(val.image.split('/').pop() ? val.image.split('/').pop() : val.image, 15 ) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <!--2022-12-20 09:09:09-->
                        <a-tag style="color:linen;font-size:medium">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <!--按钮-->
                        <c-button class="pod-button" style="color:aqua" type="primary" icon="form-outlined" @click="getPodDetail(record)">YAML</c-button>
                        <c-button style="margin-bottom:5px;color:crimson" class="pod-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delPod)">删除</c-button>
                        <c-button class="pod-button" style="color:chartreuse" type="warning" icon="file-search-outlined" @click="gotoLog(record)">日志</c-button>
                        <c-button class="pod-button" style="color:cyan" type="warning" icon="code-outlined" @click="gotoTerminal(record)">终端</c-button>
                    </template>
                </template>
            </a-table>
        </a-card>
        <!-- 展示YAML信息的弹框 card方式 -->
        <!--对话框 需要用户处理事务，又不希望跳转页面以致打断工作流程时，可以使用 Modal 在当前页面正中打开一个浮层，承载相
应的操作-->
        <!--
            bodyStyle Modal body 样式
            cancelText 取消按钮文字
            okText 确认按钮文字
            v-model:visible 控制隐藏与展示
            事件:
            ok 点击确定回调
            cancel 点击遮罩层或右上角叉或取消按钮的回调(如果只是关闭那么v-model:visible就也可以实现了)
        -->
        <a-modal
            v-model:visible="yamlModal"
            title="YAML信息"
            :confirm-loading="appLoading"
            cancelText="取消"
            okText="更新"
            @ok="updatePod">
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
        <a-drawer
            v-model:visible="createDrawer"
            style="color:blue;font-size:large"
            width:5000
            title="创建Pod"
            :footer-style="{ textAlign: 'right' }"
            @close="onClose">
            <br>
            <a-form ref="formRef" :model="createPod" :labelCol="{style: {width: '30%'}}">
                <a-form-item
                    label="name"
                    name="createName"
                    :rules="[{ required: true, message: '请输入Pod名称' }]">
                    <a-input v-model:value="createName" />
                </a-form-item>
                <a-form-item
                    label="namespace"
                    name="createNamespace"
                    :rules="[{ required: true, message: '请选择namespace' }]">
                    <a-select show-search style="width:140px;" v-model:value="createNamespace" placeholder="请选择">
                        <a-select-option
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
                    <a-input-number v-model:value="createReplicas" :min="1" :max="50"></a-input-number>
                    <a-popover>
                        <template #content>
                            <span style="color:aquamarine">副本数Min1，Max50</span>
                        </template>
                        <info-circle-outlined style="margin-left:10px;color:greenyellow" />
                    </a-popover>
                </a-form-item>
                <a-form-item
                    label="image"
                    name="createImage"
                    :rules="[{ required: true, message: '请输入image' }]">
                    <a-input v-model:value="createImage" />
                </a-form-item>
                <a-form-item
                    label="label"
                    name="createLabelStr"
                    :rules="[{ required: true, message: '请输入label' }]">
                    <a-input v-model:value="createLabelStr" placeholder="project=test,app=gateway" />
                </a-form-item>
                <a-form-item
                    label="resource"
                    name="createResource"
                    :rules="[{ required: true, message: '请选择资源规格' }]">
                    <a-select show-search style="width:140px;" v-model:value="createResource" placeholder="请选择">
                        <a-select-option value="0.5/0.2">0.5核/200M</a-select-option>
                        <a-select-option value="1/0.2">0.5核/200M</a-select-option>
                        <a-select-option value="0.5/0.5">0.5核/500M</a-select-option>
                        <a-select-option value="1/0.5">1核/500M</a-select-option>
                        <a-select-option value="0.5/1">0.5核/1G</a-select-option>
                        <a-select-option value="1/1">1核/1G</a-select-option>
                        <a-select-option value="1/2">1核/2G</a-select-option>
                        <a-select-option value="2/4">2核/4G</a-select-option>
                        <a-select-option value="4/8">4核/8G</a-select-option>
                        <a-select-option value="8/16">8核/16G</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item
                    label="container port"
                    name="createContainerPort"
                    :rules="[{ required: true, message: '请输入端口号' }]">
                    <a-input v-model:value="createContainerPort" />
                </a-form-item>
                <a-form-item
                    label="health check"
                    name="createHealthCheck">
                    <a-switch v-model:checked="createHealthCheck" />
                </a-form-item>
                <a-form-item
                    v-if="createHealthCheck"
                    label="检测路径"
                    name="createHealthPath"
                    :rules="[{ required: true, message: '请输入要进行健康检测的路径' }]">
                    <a-input v-model:value="createHealthPath" />
                </a-form-item>
            </a-form>
            <template #footer>
                <a-button style="margin-right: 8px" @click="onClose()">取消</a-button>
                <a-button type="primary" @click="formSubmit()">确定</a-button>
            </template>
        </a-drawer>
    </div>
</template>
<!--标准的 JavaScript 模块。它应该导出一个 Vue 组件定义作为其默认导出。-->
<script>
//vue方法
import { createVNode, reactive, ref,toRefs } from 'vue';
//使用vue0router官方的路由管理器,useRouter方便获取路由信息
import { useRouter } from 'vue-router'
//src 子组件
import MainHead from '@/components/MainHead';
import httpClient from '@/request';
import common from "@/config";
import { message } from 'ant-design-vue';
import yaml2obj from 'js-yaml';
import json2yaml from 'json2yaml';
//感叹号圆圈轮廓
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
//对话框
import { Modal } from 'ant-design-vue';
//对外暴露,供使用
export default({
    //组件
    components: {
        MainHead,
    },
    //setup函数
    setup() {
        //定column
        const columns = ref([
            {
                title: 'Pod',
                //索引
                dataIndex: 'name',
                width:350
            },
            {
                title: 'node',
                dataIndex: 'node',
                width:200
            },
            {
                title: 'status',
                dataIndex: 'state',
                width: 200
            },
            {
                title: '重启次数',
                dataIndex: 'restarts',
                width:100
            },
            {
                title: 'image',
                dataIndex: 'image',
                width:150
            },
            {
                title: '创建时间',
                dataIndex: 'creationTimestamp',
                width:190
            },
            {
                title: 'action',
                key: 'action',
                //靠右满 宽度
                fixed: 'right',
                width: 190
            }
        ])
        //常用项
        //加载中
        const appLoading = ref(false)
        //关键字查询
        const searchValue = ref('')
        //指定的namespace
        const namespaceValue = ref('')
        //ref的参数一般是基本数据类型，也可以是对象类型
        //如果参数是对象类型，其实底层的本质还是reactive，系统会自动将ref转换为reactive，例如
        //ref(1) ===> reactive({value:1})
        //在模板中访问ref中的数据，系统会自动帮我们添加.value,在JS中访问ref中的数据，需要手动添加.value
        //ref的底层原理同reactive一样，都是Proxy
        //reactive的参数一般是对象或者数组,他能够将复杂数据类型变为响应式数据。
        //reactive的响应式是深层次的，底层本质是将传入的数据转换为Proxy对象
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
        //数组
        const podList = ref([])
        const podListData = reactive({
            url : common.k8sPodList,
            params: {
                //过滤 关键字
                filter_name: '',
                namespace: '',
                cluster: '',
                page: 1,
                limit: 10
            }
        })

        //详情
        //yaml
        const contentYaml = ref('')
        //对话框
        const allContainerReady=ref(true)
        const yamlModal = ref(false)
        const cmOptions = common.cmOptions
        //pod metadata
        const podDetail =  reactive({
            metadata: {}
        })
        //pod 详情
        const podDetailData =  reactive({
            url: common.k8sPodDetail,
            params: {
                pod_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //yaml更新(类似默认值,详细的看用户填写的)
        const updatePodData = reactive({
            url: common.k8sPodUpdate,
            params: {
                namespace: '',
                content: '',
                cluster: ''
            }
        })
        //删除
        const delPodData = reactive({
            url: common.k8sPodDel,
            params: {
                pod_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //router实例
        const router = useRouter()
        //容器
        //日志


        //创建
        const formRef = ref()
        const createDrawer = ref(false)
        const createPod = reactive({
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
        const createPodData = reactive({
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
        //时间卓转成相应格式的时间
        function timeTrans(timestamp) {
            let date = new Date(new Date(timestamp).getTime() + 8 * 3600 * 1000)
            date = date.toJSON();
            //2022-12-02 09:09:09 19
            date = date.substring(0, 19).replace('T', ' ')
            return date 
        }
        //文本省略
        //处理标签
        function ellipsis(val, len) {
            //substring() 方法用于提取字符串中介于两个指定下标之间的字符。
            return val.length > len ? val.substring(0,len) + '...' : val
        }
        //pod重启的总次数
        function restartTotal(e) {
            let index, sum = 0
            let containerStatuses = e.status.containerStatuses
            for ( index in containerStatuses) {
                sum = sum + containerStatuses[index].restartCount 
            }
            return sum
        }
        //页面改变 当前页码和也大小->获取pod列表
        function handleTableChange(val) {
            pagination.currentPage = val.current
            pagination.pagesize = val.pageSize
            getPodList()
        }
        //获取查询的值
        function getSearchValue(val) {
            searchValue.value = val
        }
        //获取namespace
        function getNamespaceValue(val) {
            namespaceValue.value = val
        }
        //列表
        function getPodList() {
            //已经加载完成
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
                //可以改一下的podListData.params.limit
            }
            //常规的全部列出
            podListData.params.filter_name = searchValue.value
            podListData.params.namespace = namespaceValue.value
            podListData.params.cluster = localStorage.getItem('k8s_cluster')
            podListData.params.page = pagination.currentPage
            podListData.params.limit = pagination.pagesize
            httpClient.get(podListData.url, {params: podListData.params})
            //接口成功返回的数据,包含请求头,请求体,等信息
            .then(res => {
                //响应成功，获取pod列表和total
                podList.value = res.data.items
                pagination.total = res.data.total
            })
            //防止因为错误而造成系统崩溃 捕获错误
            .catch(res => {
                message.error(res.msg)
            })
            //最大程度避免影响主数据呈现问题
            .finally(() => {
                appLoading.value = false
            })
        }
        //详情
        function getPodDetail(e) {
            appLoading.value = true
            //name namespace cluster
            podDetailData.params.pod_name = e.metadata.name
            podDetailData.params.namespace = namespaceValue.value
            podDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(podDetailData.url, {params: podDetailData.params})
            .then(res => {
                //json转成yaml contentyaml
                contentYaml.value = transYaml(res.data)
                //yaml的modal对话框
                yamlModal.value = true
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                appLoading.value = false
            })
        }
        function getNamespaceList(val) {
            namespaceList.value = val
        }
        //编辑器内容变化时触发的方式,用于将更新的内容复制到变量中
        function onChange(val) {
            contentYaml.value = val
        }

        //更新
        function updatePod() {
            appLoading.value = true
            //将yaml格式的pod对象转为json web(http) restful 底层http 接送编码居多
            //JSON.stringify序列化 json编码 transObj:yaml转成obj
            let content = JSON.stringify(transObj(contentYaml.value))
            updatePodData.params.namespace = namespaceValue.value
            updatePodData.params.content = content
            updatePodData.params.cluster = localStorage.getItem('k8s_cluster')
            //httpclient 发起请求 修改put (restful patch部分更新 update全量更新)
            httpClient.put(updatePodData.url, updatePodData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getPodList()
                yamlModal.value = false
            })
        }
        //删除
        function delPod(name) {
            appLoading.value = true
            delPodData.params.pod_name = name
            delPodData.params.namespace = namespaceValue.value
            delPodData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delPodData.url, {data: delPodData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getPodList()
            })
        }
        //跳转终端页
        function gotoTerminal(record) {
            let routeUrl = router.resolve({
                path: "/workload/pod/terminal",
                //需要的参数
                query: {
                    pod_name: record.metadata.name,
                    namespace: record.metadata.namespace,
                    cluster: localStorage.getItem('k8s_cluster')
                }
            })
            //跳转页面 url _blank标准浏览器
            window.open(routeUrl.href, '_blank')
        }
        //跳转日志页
        function gotoLog(record) {
            let routeUrl = router.resolve({
                path: "/workload/pod/log",
                query: {
                    pod_name: record.metadata.name,
                    namespace: record.metadata.namespace,
                    cluster: localStorage.getItem('k8s_cluster')
                }
            })
            window.open(routeUrl.href, '_blank')
        }
        //确认框
        function showConfirm(action, res, fn) {
            //对话框的确认
            Modal.confirm({
                title: '是否继续' + action + "操作? 操作对象：",
                //"#createVNode用于创建虚拟节点，里面可以定义图标或者html
                icon: createVNode(ExclamationCircleOutlined),
                content: createVNode('div', {
                    //style: 'color:red;',
                }, res),
                cancelText: '取消',
                okText: '确认',
                //点击ok时
                onOk() {
                    fn(res)
                },
                // onCancel() {
                //     console.log('Cancel');
                // }
            })
        }
        function readyToFalse(){
            allContainerReady.value=false
        }
        function readyToTrue(){
            allContainerReady.value=true
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
                createPodFunc()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        function resetForm() {
            formRef.value.resetFields();
        }
        //创建deployment
        function createPodFunc() {
            //正则匹配，验证label的合法性
            let reg = new RegExp("(^[A-Za-z]+=[A-Za-z0-9]+).*")
            if (!reg.test(createPod.createLabelStr)) {
                message.warning("标签填写异常，请确认后重新填写")
                return
            }
            //加载loading动画
            appLoading.value = true
            //定义label、cpu和memory变量
            let label = new Map()
            let cpu, memory
            //将label字符串转成数组
            let a = (createPod.createLabelStr).split(",")
            //将数组转成map
            a.forEach(item => {
                let b = item.split("=")
                label[b[0]] = b[1]
            })
            //将deployment的规格转成cpu和memory
            let resourceList = createPod.createResource.split("/")
            cpu = resourceList[0]
            memory = resourceList[1] + "Gi"
            //赋值
            createPodData.params.label = label
            createPodData.params.cpu = cpu
            createPodData.params.memory = memory
            createPodData.params.name = createPodData.createName
            createPodData.params.namespace = createPodData.createNamespace
            createPodData.params.replicas = createPodData.createReplicas
            createPodData.params.image = createPodData.createImage
            createPodData.params.health_check = createPodData.createHealthCheck
            createPodData.params.health_path = createPodData.createHealthPath
            createPodData.params.container_port = parseInt(createPodData.createContainerPort)
            createPodData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.post(createPodData.url, createPodData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                //重置表单
                resetForm()
                getPodList()
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
        //return出去才能使用
        return {
            appLoading,
            pagination,
            columns,
            podList,
            podDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            allContainerReady,
            createDrawer,
            createPod,
            namespaceList,
            formRef,
            timeTrans,
            ellipsis,
            restartTotal,
            handleTableChange,
            getSearchValue,
            getNamespaceValue,
            getPodList,
            getPodDetail,
            onChange,
            updatePod,
            delPod,
            gotoTerminal,
            gotoLog,
            showConfirm,
            readyToFalse,
            readyToTrue,
            handleAdd,
            onClose,
            formSubmit,
            ...toRefs(createPod),
            getNamespaceList
        }
    },
})
</script>

<!--
    定义了与此组件关联的 CSS   .当前的
    margin-right:auto 靠右 内边距
    display 为元素生成的一个或多个框的类型 inline-block内联块
    border-radius 边界半径
    border 边界 solid固体
-->
<style scoped>
    .pod-button {
        margin-right: 5px;
        width:77px;
    }
    .succ-dot{
        display:inline-block;
        width: 7px;
        height:7px;
        background:#86c169;
        border-radius:50%;
        border:1px solid #88c06c;
        margin-right: 10px;
    }
    .warn-dot{
        display:inline-block;
        width: 7px;
        height:7px;
        background: rgb(233, 200, 16);
        border-radius:50%;
        border:1px solid rgb(233, 200, 16);
        margin-right: 10px;
    }
    .err-dot{
        display:inline-block;
        width: 7px;
        height:7px;
        background:rgb(199, 85, 85);
        border-radius:50%;
        border:1px solid rgb(207, 94, 94);
        margin-right: 10px;
    }
    .succ-state {
        color: rgb(27, 202, 21);
    }
    .warn-state {
        color: rgb(233, 200, 16);
    }
    .err-state {
        color: rgb(226, 23, 23);
    }
</style>