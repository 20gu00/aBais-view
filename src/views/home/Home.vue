<template>
    <div>
        <a-spin :spinning="appLoading">
            <a-collapse v-model:activeKey="activeKey" ghost>
                <a-collapse-panel style="font-size:22px;" key="1" header="Overview">
                    <a-row class="home-row1">
                        <!-- <a-col :span="7">
                            <div style="font-size:19px;">k8s运维平台</div>
                            <div style="text-align:center;font-size:30px;font-weight:bold;">aBais</div>
                        </a-col> -->
                        <!-- <a-divider type="vertical" style="height: 70px; background-color: rgb(89, 104, 173)" /> -->
                        <a-col :span="22">
                            <div style="font-size:19px;">Clusters</div>
                            <div style="text-align:center;font-size:55px;font-weight:bold;">{{ clusterNum }}</div>
                        </a-col>
                        <!-- <a-divider type="vertical" style="height: 70px; background-color: rgb(89, 104, 173)" /> -->
                        <!-- <a-col :span="7">
                            <div style="font-size:19px;">版本</div>
                            <div style="text-align:center;font-size:30px;font-weight:bold;">v1.0.0</div>
                        </a-col> -->
                    </a-row>
                    <a-row :gutter="10"> 
                        <template v-for="val,key in resourceList" :key="key">
                            <a-col :span="4" style="margin-bottom:10px;">
                                <a-card :bordered="false" style="background-color:cornflowerblue" :bodyStyle="{padding: '20px'}">
                                    <!--float:right-->
                                    <div style="float:left;margin:15px 10px 0px">
                                        <a-progress
                                        :width="40"
                                        :strokeWidth="18"
                                        :stroke-color="color"
                                        :percent="100"
                                        :showInfo="true"
                                        type="circle"
                                        />
                                    </div>
                                    <div style="text-align:center;">
                                        <span style="font-size:20px;">{{ key }}</span>
                                        <br/>
                                        <span style="font-size:30px;font-weight:bold;">{{ resourceList[key] }}</span>
                                    </div>
                                </a-card>
                            </a-col>
                        </template>
                    </a-row>
                </a-collapse-panel>
                <a-collapse-panel style="font-size:22px;" key="2" header="Events">
                    <div style="text-align:left;margin-bottom:5px;">
                        <a-input-search
                        allow-clear
                        v-model:value="searchValue"
                        placeholder="关键词"
                        style="width: 200px;margin-bottom:5px;" 
                        @search="getEventList"
                        />
                    </div>
                    <a-card :bodyStyle="{padding: '10px'}">
                        <a-table 
                            style="font-size:15px;" 
                            :loading="appLoading" 
                            :columns="columns" 
                            :data-source="eventList"
                            :pagination="pagination"
                            @change="handleTableChange">
                            <template #bodyCell="{ column, record }">
                                <template v-if="column.dataIndex === 'name'">
                                    <a style="color:aquamarine;font-weight: bold;">{{ record.name }}</a>
                                </template>
                                <template v-if="column.dataIndex === 'kind'">
                                    <a style="color:dodgerblue;font-weight: bold;">{{ record.kind }}</a>
                                </template>
                                <template v-if="column.dataIndex === 'event_time'">
                                    <span style="color:ghostwhite">{{ timeTrans(record.event_time) }}</span>
                                </template>
                                <template v-if="column.dataIndex === 'cluster'">
                                    <span style="color:cornsilk">{{ record.cluster }}</span>
                                </template>
                                <template v-if="column.dataIndex === 'message'">
                                    <span style="color:orange">{{ record.message }}</span>
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
                title: 'resource name',
                dataIndex: 'name',
            },
            {
                title: 'resource kind',
                dataIndex: 'kind',
                width: 130,
            },
            {
                title: 'namespace',
                dataIndex: 'namespace',
            },
            {
                title: 'status',
                dataIndex: 'rtype',
            },
            {
                title: 'reason',
                dataIndex: 'reason',
            },
            {
                title: 'message',
                dataIndex: 'message',
                width: 500,
            },
            {
                title: 'event time',
                dataIndex: 'event_time',
            },
            {
                title: 'cluster',
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
            pageSizeOptions: ["10", "20", "50", "100","200","500","1000"],
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

<!--rgb(40, 46, 58) !important;-->
<style scoped>
    .home-row1 {
        background-color:rgba(117, 213, 141, 0.591);
        padding: 35px;
        margin-bottom: 20px;
        width:220px;
    }
</style>