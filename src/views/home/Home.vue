<template>
    <div>
        <a-spin :spinning="appLoading">
            <a-collapse v-model:activeKey="activeKey" ghost>
                <a-collapse-panel style="font-size:18px;" key="1" header="概览">
                    <a-row class="home-row1">
                        <a-col :span="7">
                            <div style="font-size:13px;">名称</div>
                            <div style="text-align:center;font-size:30px;font-weight:bold;">KubeA</div>
                        </a-col>
                        <a-divider type="vertical" style="height: 70px; background-color: rgb(89, 104, 173)" />
                        <a-col :span="7">
                            <div style="font-size:13px;">集群数</div>
                            <div style="text-align:center;font-size:30px;font-weight:bold;">{{ clusterNum }}</div>
                        </a-col>
                        <a-divider type="vertical" style="height: 70px; background-color: rgb(89, 104, 173)" />
                        <a-col :span="7">
                            <div style="font-size:13px;">版本</div>
                            <div style="text-align:center;font-size:30px;font-weight:bold;">v1.0.0</div>
                        </a-col>
                    </a-row>
                    <a-row :gutter="10"> 
                        <template v-for="val,key in resourceList" :key="key">
                            <a-col :span="4" style="margin-bottom:10px;">
                                <a-card :bordered="false" style="background-color:rgb(33, 46, 64)" :bodyStyle="{padding: '10px'}">
                                    <div style="float:left;margin:15px 10px 0px">
                                        <a-progress
                                        :width="40"
                                        :strokeWidth="18"
                                        :stroke-color="color"
                                        :percent="100"
                                        :showInfo="false"
                                        type="circle"
                                        />
                                    </div>
                                    <div style="text-align:center;">
                                        <span style="font-size:14px;">{{ key }}</span>
                                        <br/>
                                        <span style="font-size:30px;font-weight:bold;">{{ resourceList[key] }}</span>
                                    </div>
                                </a-card>
                            </a-col>
                        </template>
                    </a-row>
                </a-collapse-panel>
                <a-collapse-panel style="font-size:18px;" key="2" header="事件">
                    <div style="text-align:right;margin-bottom:10px;">
                        <a-input-search
                        allow-clear
                        v-model:value="searchValue"
                        placeholder="请输入资源名"
                        style="width: 200px"
                        @search="getEventList"
                        />
                    </div>
                    <a-card :bodyStyle="{padding: '10px'}">
                        <a-table 
                            style="font-size:12px;" 
                            :loading="appLoading" 
                            :columns="columns" 
                            :data-source="eventList"
                            :pagination="pagination"
                            @change="handleTableChange">
                            <template #bodyCell="{ column, record }">
                                <template v-if="column.dataIndex === 'name'">
                                    <a style="color: rgb(84, 138, 238);font-weight: bold;">{{ record.name }}</a>
                                </template>
                                <template v-if="column.dataIndex === 'event_time'">
                                    <span>{{ timeTrans(record.event_time) }}</span>
                                </template>
                            </template>
                        </a-table>
                    </a-card>
                </a-collapse-panel>
            </a-collapse>
        </a-spin>
    </div>
</template>

<script>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import httpClient from '@/request';
import common from "@/config";
import { message } from 'ant-design-vue';
export default ({
    setup() {
        const appLoading = ref(false)
        const searchValue = ref()
        const activeKey = ref(['1', '2'])
        const columns = ref([
            {
                title: '资源名',
                dataIndex: 'name',
            },
            {
                title: '资源类型',
                dataIndex: 'kind',
                width: 150,
            },
            {
                title: '命名空间',
                dataIndex: 'namespace',
            },
            {
                title: '状态',
                dataIndex: 'rtype',
            },
            {
                title: '原因',
                dataIndex: 'reason',
            },
            {
                title: '描述',
                dataIndex: 'message',
                width: 500,
            },
            {
                title: '事件时间',
                dataIndex: 'event_time',
            },
            {
                title: '集群',
                dataIndex: 'cluster',
            },
        ])
        const color = reactive({
            '0%': '#73b9bc',
            '100%': '#109ee9',
        })
        const clusterNum = ref()
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
        //定时器
        let timer = null
        //事件列表
        const eventList = ref([])
        const eventListData = reactive({
            url : common.k8sEventList,
            params: {
                name: '',
                cluster: '',
                page: 1,
                limit: 10
            }
        })
        //资源数据
        const resourceList = ref()
        const resourceListData = reactive({
            url: common.k8sAllRes,
            params: {
                cluster: ''
            }
        })
        //【方法】
        function handleTableChange(val) {
            pagination.currentPage = val.current
            pagination.pagesize = val.pageSize
            getEventList()
        }
        function timeTrans(date) {
            date = date.substring(0, 19).replace('T', ' ')
            date = date.substring(0, 19).replace('+08:00', '')
            return date 
        }
        function getEventList () {
            //关闭定时器
            clearInterval(timer)
            timer = null
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            eventListData.params.name = searchValue.value
            eventListData.params.cluster = localStorage.getItem('k8s_cluster')
            eventListData.params.page = pagination.currentPage
            eventListData.params.limit = pagination.pagesize
            httpClient.get(eventListData.url, {params: eventListData.params})
            .then(res => {
                eventList.value = res.data.items
                pagination.total = res.data.total
            })
            .catch(res => {
                message.error(res.msg)
            })
        }
        function getAllRes() {
            appLoading.value = true
            resourceListData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(resourceListData.url, {params: resourceListData.params})
            .then(res => {
                resourceList.value = res.data
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally (() => {
                appLoading.value = false
            })
        }
        //声明周期钩子
        onMounted(() => {
            timer = setInterval(() => {
                if (localStorage.getItem('cluster_num') && localStorage.getItem('k8s_cluster')) {
                    clusterNum.value = localStorage.getItem('cluster_num')
                    getEventList()
                    getAllRes()
                }
            }, 100)
        })
        onBeforeUnmount(() => {
            if (timer) {
                clearInterval(timer)
                timer = null
            }
        })

        return {
            appLoading,
            searchValue,
            activeKey,
            eventList,
            clusterNum,
            columns,
            pagination,
            color,
            resourceList,
            handleTableChange,
            timeTrans,
            getEventList
        }
    },
})
</script>

<style scoped>
    .home-row1 {
        background-color: rgb(40, 46, 58) !important;
        padding: 20px;
        margin-bottom: 15px;
    }
</style>