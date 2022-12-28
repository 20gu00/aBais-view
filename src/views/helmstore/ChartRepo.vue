<template>
    <div>
        <div style="text-align:right;margin-bottom:15px;">
            <a-space>
                <a-input-search
                allow-clear
                v-model:value="searchValue"
                placeholder="请输入"
                style="width: 200px"
                @search="getChartList"
                />
                <a-button size="small" type="primary" ghost @click="handleAdd()">
                    <template #icon><PlusOutlined /></template>
                    新增
                </a-button>
                <a-button size="small" @click="getChartList()">
                    <template #icon><UndoOutlined /></template>
                    刷新
                </a-button>
            </a-space>
        </div>
        <a-spin :spinning="appLoading">
            <a-row :gutter="10"> 
                <template v-for="item, index in chartList" :key="index">
                    <a-col :span="6" style="margin-bottom:10px;">
                        <a-card :bordered="false" class="chart-card">
                            <div style="float:left;margin-right:20px;padding: 20px 0;">
                                <img style="width:60px;" :src="'http://' + item.icon_url"/>
                            </div>
                            <div>
                                <a style="font-size:16px;font-weight:bold;">{{ item.name }}</a><br><br>
                                <template v-if="item.describe.length >= 20">
                                    <a-popover>
                                        <template #content>
                                            <div style="width:200px;">{{ item.describe }}</div>
                                        </template>
                                        <p class="chart-describe">简介: {{ item.describe }}</p>
                                    </a-popover>
                                </template>
                                <p v-else>简介: {{ item.describe }}</p>
                            </div>
                            <div>
                                <span>版本: {{ item.version }}</span>
                                <a-dropdown :overlayStyle="{paddingTop: '10px'}">
                                    <a style="float:right;" @click.prevent>
                                        操作
                                        <DownOutlined />
                                    </a>
                                    <template #overlay>
                                        <a-menu>
                                            <a-menu-item>
                                            <a @click="handleInstall(item)">安装</a>
                                            </a-menu-item>
                                            <a-menu-item>
                                            <a @click="handleUpdate(item)">编辑</a>
                                            </a-menu-item>
                                            <a-menu-item>
                                            <a @click="showConfirm('删除', item, delChartFunc)">删除</a>
                                            </a-menu-item>
                                        </a-menu>
                                    </template>
                                </a-dropdown>
                            </div>
                        </a-card>
                    </a-col>
                </template>
            </a-row>
        </a-spin>
        <a-pagination
            style="text-align:right;margin-top:20px;"
            v-model:current="pagination.currentPage"
            v-model:page-size="pagination.pagesize"
            :page-size-options="pagination.pageSizeOptions"
            :total="pagination.total"
            :show-total="pagination.showTotal"
            show-quick-jumper
            show-less-items
            show-size-changer
            @change="handleTableChange"
        />
        <!-- 安装release -->
        <a-modal
            v-model:visible="installModal"
            title="安装Release"
            :confirm-loading="appLoading"
            cancelText="取消"
            okText="安装"
            @ok="installSubmit">
            <a-form ref="installRef" :model="installRelease" :labelCol="{style: {width: '35%'}}">
                <a-form-item
                    label="Rlease名"
                    name="release"
                    :rules="[{ required: true, message: '请输入Release名' }]">
                    <a-input v-model:value="release" style="width: 200px"/>
                </a-form-item>
                <a-form-item
                    label="命名空间"
                    name="namespace"
                    :rules="[{ required: true, message: '请选择命名空间' }]">
                    <a-select show-search style="width:140px;" v-model:value="namespace" placeholder="请选择">
                        <a-select-option
                            v-for="(item, index) in namespaceList"
                            :key="index"
                            :value="item.metadata.name">
                            {{ item.metadata.name }}
                        </a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item
                    label="Chart"
                    name="chartName">
                    <a-input disabled v-model:value="chartName" style="width: 200px"/>
                </a-form-item>
                <a-form-item
                    label="Chart文件"
                    name="chartFile">
                    <a-input disabled v-model:value="chartFile" style="width: 200px"/>
                </a-form-item>
                <a-form-item
                    label="集群"
                    name="cluster">
                    <a-input disabled v-model:value="cluster" style="width: 200px"/>
                </a-form-item>
            </a-form>
        </a-modal>
        <!-- 新增Chart -->
        <a-modal
            v-model:visible="addModal"
            title="新增Chart"
            :confirm-loading="appLoading"
            cancelText="取消"
            okText="新增"
            :afterClose="handleClose"
            @ok="addSubmit">
            <a-form ref="addRef" :model="addChart" :labelCol="{style: {width: '30%'}}">
                <a-form-item
                    label="Chart名"
                    name="name"
                    :rules="[{ required: true, message: '请输入Chart名' }]">
                    <a-input v-model:value="addChart.name" style="width: 200px"/>
                </a-form-item>
                <a-form-item
                    label="版本"
                    name="version"
                    :rules="[{ required: true, message: '请输入版本' }]">
                    <a-input v-model:value="addChart.version" style="width: 200px"/>
                </a-form-item>
                <a-form-item
                    label="Icon图标"
                    name="icon_url"
                    :rules="[{ required: true, message: '请输入图标地址' }]">
                    <a-input v-model:value="addChart.icon_url" addon-before="http://" style="width: 280px"/>
                </a-form-item>
                <a-form-item
                    label="描述"
                    name="describe"
                    :rules="[{ required: true, message: '请填写Chart描述' }]">
                    <a-textarea v-model:value="addChart.describe" style="width: 280px"/>
                </a-form-item>
                <a-form-item
                    label="上传Chart"
                    name="chartFile">
                    <a-upload
                        v-model:file-list="fileList"
                        :max-count="2"
                        name="chart"
                        :customRequest="handleUpload"
                        @remove="handleFileRemove">
                        <a-button>
                            <upload-outlined />
                            Click to Upload
                        </a-button>
                    </a-upload>
                </a-form-item>
            </a-form>
        </a-modal>
        <!-- 编辑Chart -->
        <a-modal
            v-model:visible="updateModal"
            title="编辑Chart"
            :confirm-loading="appLoading"
            cancelText="取消"
            okText="更新"
            :afterClose="handleClose"
            @ok="updateSubmit">
            <a-form ref="updateRef" :model="updateChart" :labelCol="{style: {width: '30%'}}">
                <a-form-item
                    label="Chart名"
                    name="name"
                    :rules="[{ required: true, message: '请输入Chart名' }]">
                    <a-input disabled v-model:value="updateChart.name" style="width: 200px"/>
                </a-form-item>
                <a-form-item
                    label="版本"
                    name="version"
                    :rules="[{ required: true, message: '请输入版本' }]">
                    <a-input v-model:value="updateChart.version" style="width: 200px"/>
                </a-form-item>
                <a-form-item
                    label="Icon图标"
                    name="icon_url"
                    :rules="[{ required: true, message: '请输入图标地址' }]">
                    <a-input v-model:value="updateChart.icon_url" addon-before="http://" style="width: 280px"/>
                </a-form-item>
                <a-form-item
                    label="描述"
                    name="describe"
                    :rules="[{ required: true, message: '请填写Chart描述' }]">
                    <a-textarea v-model:value="updateChart.describe" style="width: 280px"/>
                </a-form-item>
                <a-form-item
                    label="上传Chart"
                    name="chartFile">
                    <a-upload
                        v-model:file-list="fileList"
                        :max-count="2"
                        name="chart"
                        :customRequest="handleUpload"
                        @remove="handleFileRemove">
                        <a-button>
                            <upload-outlined />
                            Click to Upload
                        </a-button>
                    </a-upload>
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>


<script>
import { ref, toRefs, reactive, onMounted, createVNode } from 'vue'
import httpClient from '@/request';
import common from "@/config";
import { message } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';
export default({
    setup() {
        const appLoading = ref(false)
        const searchValue = ref('')
        // const appList = ref([
        //     {
        //         name: 'nginx',
        //         icon: require('@/assets/app-icon/nginx.svg'),
        //         describe: 'Chart for the nginx server',
        //         version: '1.21.0'
        //     },
        //     {
        //         name: 'apisix',
        //         icon: require('@/assets/app-icon/apisix.svg'),
        //         describe: 'A Helm chart for Apache APISIX',
        //         version: '2.14.1'
        //     },
        //     {
        //         name: 'consul',
        //         icon: require('@/assets/app-icon/consul.svg'),
        //         describe: 'Highly available and distributed service discovery and key-value store designed with support for the modern data center to make distributed systems and configuration easy. ',
        //         version: '1.10.0'
        //     },
        //     {
        //         name: 'elasticsearch',
        //         icon: require('@/assets/app-icon/elasticsearch.svg'),
        //         describe: 'Official Elastic helm chart for Elasticsearch',
        //         version: '8.1.0'
        //     },
        //     {
        //         name: 'etcd',
        //         icon: require('@/assets/app-icon/etcd.svg'),
        //         describe: 'etcd is a distributed key value store that provides a reliable way to store data across a cluster of machines',
        //         version: '3.5.0'
        //     },
        //     {
        //         name: 'istio-bookinfo',
        //         icon: require('@/assets/app-icon/istio.png'),
        //         describe: 'Istio Bookinfo Helm chart for Kubernetes',
        //         version: '1.3'
        //     },
        //     {
        //         name: 'jenkins',
        //         icon: require('@/assets/app-icon/jenkins.svg'),
        //         describe: 'The leading open source automation server',
        //         version: '2.289.1'
        //     },
        //     {
        //         name: 'kafka',
        //         icon: require('@/assets/app-icon/kafka.svg'),
        //         describe: 'Kafka Cluster,this is a distributed streaming platform.',
        //         version: '2.4.0'
        //     },
        //     {
        //         name: 'nacos',
        //         icon: require('@/assets/app-icon/nacos.jpeg'),
        //         describe: 'Official helm chart for Nacos Server',
        //         version: '2.0.2'
        //     },
        //     {
        //         name: 'kibana',
        //         icon: require('@/assets/app-icon/kibana.svg'),
        //         describe: 'Official Elastic helm chart for Kibana',
        //         version: '7.13.2'
        //     },
        //     {
        //         name: 'logstash',
        //         icon: require('@/assets/app-icon/logstash.svg'),
        //         describe: 'Logstash is an open source, server-side data processing pipeline that ingests data from a multitude of sources simultaneously, transforms it, and then sends it to your favorite "stash".',
        //         version: '7.13.2'
        //     },
        //     {
        //         name: 'rabbitmq',
        //         icon: require('@/assets/app-icon/rabbitmq.svg'),
        //         describe: 'Open source message broker software',
        //         version: '3.7.17'
        //     },
        //     {
        //         name: 'tomcat',
        //         icon: require('@/assets/app-icon/tomcat.svg'),
        //         describe: 'Chart for Apache Tomcat',
        //         version: '10.0.8'
        //     },
        // ])

        //分页
        const pagination = reactive({
            total: 0,
            currentPage: 1,
            pagesize: 20,
            pageSizeOptions: ["20", "40", "60", "100"],
            showTotal: total => `共 ${total} 条`
        })
        //命名空间列表
        const namespaceList = ref([])
        const namespaceListData = reactive({
            url: common.k8sNamespaceList,
            params: {
                cluster: ''
            }
        })
        //列表
        const chartList = ref([])
        const chartListData = reactive({
            url : common.helmChartList,
            params: {
                name: '',
                page: 1,
                limit: 12
            }
        })
        //安装
        const installModal = ref(false)
        const installRef = ref()
        const installRelease = reactive({
            release: '',
            namespace: '',
            cluster: '',
            chartName: '',
            chartFile: ''
        })
        const installReleaseData = reactive({
            url: common.helmReleaseInstall,
            params: {
                release: '',
                namespace: '',
                cluster: '',
                chart: ''
            }
        })
        //新增
        const addModal = ref(false)
        const addRef = ref()
        const addChart = reactive({
            name: '',
            icon_url: '',
            version: '',
            describe: '',
            file_name: ''
        })
        const addChartData = reactive({
            url: common.helmChartAdd,
            params: {
                name: '',
                file_name: '',
                icon_url: '',
                version: '',
                describe: ''
            }
        })
        //上传文件
        const fileList = ref([])
        const fileUploadUrl = common.helmChartFileUpload
        //删除文件
        const fileDelData = reactive({
            url: common.helmChartFileDel,
            params: {
                chart: ''
            }
        })
        //编辑
        const updateModal = ref(false)
        const updateRef = ref()
        const updateChart = reactive({
            id: 0,
            name: '',
            icon_url: '',
            version: '',
            describe: '',
            file_name: ''
        })
        const updateChartData = reactive({
            url: common.helmChartUpdate,
            params: {
                id: 0,
                name: '',
                file_name: '',
                icon_url: '',
                version: '',
                describe: ''
            }
        })
        //删除
        const delChartData = reactive({
            url: common.helmChartDel,
            params: {
                id: 0,
                file_name: ''
            }
        })

        //【方法】
        function handleAdd() {
            addModal.value = true
        }
        function handleUpdate(val) {
            updateChart.id = val.id
            updateChart.name = val.name
            updateChart.icon_url = val.icon_url
            updateChart.version = val.version
            updateChart.describe = val.describe
            updateChart.file_name = val.file_name
            updateModal.value = true
        }
        function handleInstall(val) {
            installRelease.cluster = localStorage.getItem('k8s_cluster')
            installRelease.chartName = val.name
            installRelease.chartFile = val.file_name
            getNamespaceList()
            installModal.value = true
        }
        function getNamespaceList() {
            namespaceListData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(namespaceListData.url, {params: namespaceListData.params})
            .then(res => {
                namespaceList.value = res.data.items
            })
            .catch(res => {
                message.error(res.msg)
            })
        }
        function handleTableChange(current, pageSize) {
            pagination.currentPage = current
            pagination.pagesize = pageSize
            getChartList()
        }
        //列表
        function getChartList() {
            appLoading.value = true
            if (searchValue.value) {pagination.currentPage = 1}
            chartListData.params.name = searchValue.value
            chartListData.params.page = pagination.currentPage
            chartListData.params.limit = pagination.pagesize
            httpClient.get(chartListData.url, {params: chartListData.params})
            .then(res => {
                //响应成功，获取chart列表和total
                chartList.value = res.data.items
                pagination.total = res.data.total
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                appLoading.value = false
            })
        }
        //安装
        function installReleaseFunc() {
            appLoading.value = true
            installReleaseData.params.release = installRelease.release
            installReleaseData.params.chart = installRelease.chartFile
            installReleaseData.params.namespace = installRelease.namespace
            installReleaseData.params.cluster = installRelease.cluster
            httpClient.post(installReleaseData.url, installReleaseData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                //重置表单
                installRef.value.resetFields()
                //关闭抽屉
                installModal.value = false
                appLoading.value = false
            })
        }
        //验证表单
        async function installSubmit() {
            try {
                await installRef.value.validateFields();
                installReleaseFunc()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        //新增
        function addChartFunc() {
            //检查是否有文件上传
            if (!fileList.value.length) {
                message.warning("未上传Chart文件,请上传")
                return
            }
            //添加
            appLoading.value = true
            addChartData.params = addChart
            httpClient.post(addChartData.url, addChartData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getChartList()
                //重置表单
                addRef.value.resetFields()
                //关闭抽屉
                addModal.value = false
                fileList.value.pop()
            })
        }
        async function addSubmit() {
            try {
                await addRef.value.validateFields();
                addChartFunc()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        //编辑
        function updateChartFunc() {
            //更新
            appLoading.value = true
            updateChartData.params = updateChart
            httpClient.put(updateChartData.url, updateChartData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getChartList()
                //重置表单
                updateRef.value.resetFields()
                //关闭抽屉
                updateModal.value = false
                fileList.value.pop()
            })
        }
        async function updateSubmit() {
            try {
                await updateRef.value.validateFields();
                updateChartFunc()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        //上传文件
        function handleUpload(data) {
            if(fileList.value.length > 1) {
                fileList.value.pop()
                message.warning("最大上传文件数为1,请删除后重新上传")
                return
            }
            let formData = new FormData()
            formData.append('chart', data.file)
            httpClient.post(fileUploadUrl, formData)
            .then(res => {
                message.success(res.msg)
                if (addModal.value) {
                    addChart.file_name = data.file.name
                }
                if (updateModal.value) {
                    updateChart.file_name = data.file.name
                }
                data.onSuccess()
            })
            .catch(res => {
                message.error(res.msg)
                data.onError()
                //用于重复上传文件的清空前端展示
                fileList.value.pop()
            })
        }
        //删除文件
        function fileDelFunc(fileName) {
            fileDelData.params.chart = fileName
            httpClient.delete(fileDelData.url, {data: fileDelData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
        }
        //用于所有关闭modal的动作,删除已上传的文件
        function handleClose() {
            //删除文件
            if (fileList.value.length) {
                fileDelFunc(fileList.value[0].name)
                fileList.value.pop()
            }
        }
        //用于前端小删除按钮的文件删除
        function handleFileRemove(file) {
            fileDelFunc(file.name)
        }
        //删除chart
        function delChartFunc(val) {
            appLoading.value = true
            delChartData.params.id = val.id
            delChartData.params.file_name = val.file_name
            httpClient.delete(delChartData.url, {data: delChartData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getChartList()
            })
        }
        //确认框
        function showConfirm(action, res, fn) {
            Modal.confirm({
                title: '是否继续' + action + "操作? 操作对象：",
                icon: createVNode(ExclamationCircleOutlined),
                content: createVNode('div', {
                    //style: 'color:red;',
                }, res.name),
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

        onMounted(() => {
            getChartList()
        })
        return {
            appLoading,
            searchValue,
            chartList,
            pagination,
            namespaceList,
            installModal,
            installRef,
            installRelease,
            ...toRefs(installRelease),
            handleTableChange,
            getChartList,
            installReleaseFunc,
            handleInstall,
            installSubmit,
            addModal,
            addRef,
            addChart,
            fileList,
            updateModal,
            updateRef,
            updateChart,
            handleAdd,
            addSubmit,
            handleUpload,
            handleClose,
            handleFileRemove,
            handleUpdate,
            updateSubmit,
            delChartFunc,
            showConfirm
        }
    },
})
</script>

<style scoped>
    .ant-btn {
        border-radius: 1px;
    }
    .chart-card {
        background-color: rgb(33, 46, 64);
        font-size: 12px;
        height: 148px;
    }
    .chart-describe {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }
</style>