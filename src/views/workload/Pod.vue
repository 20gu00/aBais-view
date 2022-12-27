<template>
    <div>
        <!--main的头部-->
        <MainHead
            searchDescribe="关键词"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @dataList="getPodList"/>
        <!--card 通用卡片容器，可承载文字、列表、图片、段落-->
        <!--bodyStyle 内容区域自定义样式 css-->
        <a-card :bodyStyle="{padding: '10px'}">
             <!--表格 用于展示多条结构类似的数据，可对数据进行排序、筛选、对比或 其他自定义操作-->
            <!--bodyCell 个性化单元格 bordered 是否展示外边框和列边框 loading 页面是否加载中 columns 表格列的配置描述 dataSource 数据数组 pagination 分页器 size 表格大小 change事件 分页、排序、筛选变化时
触发-->
             <a-table
                style="font-size:12px;" 
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
                        <span style="font-weight: bold;">{{ record.metadata.name }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'node'">
                        <span style="color: rgb(84, 138, 238);">{{ record.spec.nodeName }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'state'">
                        <!--块 进行排版 align left 居左，默认 right 居右 center 居中 justify-->
                        <!--class类 亮点和描述-->
                        <div :class="{'succ-dot':record.status.phase == 'Running', 'warn-dot':record.status.phase == 'Pending', 'err-dot':record.status.phase != 'Running' && record.status.phase != 'Pending'}"></div>
                        <span :class="{'succ-state':record.status.phase == 'Running', 'warn-state':record.status.phase == 'Pending', 'err-status':record.status.phase != 'Running' && record.status.phase != 'Pending'}">{{ record.status.phase }} </span>
                    </template>
                    <template v-if="column.dataIndex === 'restarts'">
                         <span>{{ restartTotal(record) }} </span>
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
                                <a-tag style="margin-bottom:5px;cursor:pointer;" color="blue">{{ ellipsis(key + ":" +val, 15) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'image'">
                        <div v-for="(val, key) in record.spec.containers" :key="key">
                            <a-popover>
                                <template #content>
                                    <span>{{ val.image }}</span>
                                </template>
                                <a-tag style="margin-bottom:5px;cursor:pointer;" color="geekblue">{{ ellipsis(val.image.split('/').pop() ? val.image.split('/').pop() : val.image, 15 ) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <!--2022-12-20 09:09:09-->
                        <a-tag color="chartreuse">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <!--按钮-->
                        <c-button class="pod-button" type="primary" icon="form-outlined" @click="getPodDetail(record)">yaml</c-button>
                        <c-button style="margin-bottom:5px;" class="pod-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delPod)">删除</c-button>
                        <c-button class="pod-button" type="warning" icon="file-search-outlined" @click="gotoLog(record)">log</c-button>
                        <c-button class="pod-button" type="warning" icon="code-outlined" @click="gotoTerminal(record)">TTY</c-button>
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
            cancel 点击遮罩层或右上角叉或取消按钮的回调(如果只是关闭那么v-model:visible就可以了)
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
    </div>
</template>

<script>
import { createVNode, reactive, ref } from 'vue';
import { useRouter } from 'vue-router'
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
        const columns = ref([
            {
                title: 'Pod名',
                dataIndex: 'name'
            },
            {
                title: '节点',
                dataIndex: 'node'
            },
            {
                title: '状态',
                dataIndex: 'state',
                width: 120
            },
            {
                title: '重启数',
                dataIndex: 'restarts'
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
        const podList = ref([])
        const podListData = reactive({
            url : common.k8sPodList,
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
        const podDetail =  reactive({
            metadata: {}
        })
        const podDetailData =  reactive({
            url: common.k8sPodDetail,
            params: {
                pod_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //yaml更新
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
        function ellipsis(val, len) {
            return val.length > len ? val.substring(0,len) + '...' : val
        }
        function restartTotal(e) {
            let index, sum = 0
            let containerStatuses = e.status.containerStatuses
            for ( index in containerStatuses) {
                sum = sum + containerStatuses[index].restartCount 
            }
            return sum
        }
        function handleTableChange(val) {
            pagination.currentPage = val.current
            pagination.pagesize = val.pageSize
            getPodList()
        }
        function getSearchValue(val) {
            searchValue.value = val
        }
        function getNamespaceValue(val) {
            namespaceValue.value = val
        }
        //列表
        function getPodList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            podListData.params.filter_name = searchValue.value
            podListData.params.namespace = namespaceValue.value
            podListData.params.cluster = localStorage.getItem('k8s_cluster')
            podListData.params.page = pagination.currentPage
            podListData.params.limit = pagination.pagesize
            httpClient.get(podListData.url, {params: podListData.params})
            .then(res => {
                //响应成功，获取pod列表和total
                podList.value = res.data.items
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
        function getPodDetail(e) {
            appLoading.value = true
            podDetailData.params.pod_name = e.metadata.name
            podDetailData.params.namespace = namespaceValue.value
            podDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(podDetailData.url, {params: podDetailData.params})
            .then(res => {
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
        //编辑器内容变化时触发的方式,用于将更新的内容复制到变量中
        function onChange(val) {
            contentYaml.value = val
        }
        //更新
        function updatePod() {
            appLoading.value = true
            //将yaml格式的pod对象转为json
            let content = JSON.stringify(transObj(contentYaml.value))
            updatePodData.params.namespace = namespaceValue.value
            updatePodData.params.content = content
            updatePodData.params.cluster = localStorage.getItem('k8s_cluster')
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
                query: {
                    pod_name: record.metadata.name,
                    namespace: record.metadata.namespace,
                    cluster: localStorage.getItem('k8s_cluster')
                }
            })
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
        return {
            appLoading,
            pagination,
            columns,
            podList,
            podDetail,
            contentYaml,
            yamlModal,
            cmOptions,
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
            showConfirm
        }
    },
})
</script>

<style scoped>
    .pod-button {
        margin-right: 5px;
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