<template>
    <div>
        <!--块高度-->
        <div style="height:10px;"></div>
        <a-card :bodyStyle="{padding: '10px', height: '45px'}">
             <span style="font-size:14px;">容器: </span>
             <!--改变的时候-->
             <a-select @change="getContainerLog()" style="width:140px;" size="small" v-model:value="containerValue" placeholder="请选择">
                <a-select-option
                    v-for="(item, index) in containerList"
                    :key="index"
                    :value="item">
                    {{ item }}
                </a-select-option>
            </a-select>
            <!--按钮-->
            <a-button style="margin-left: 20px;" size="small" type="primary" ghost @click="getContainerLog()">
                <!--设置个图标-->
                <template #icon><UndoOutlined/></template>
                刷新
            </a-button>
        </a-card>
        <a-card 
            class="log-card"
            :loading="appLoading"
            :bodyStyle="{padding: '10px'}">
            {{ logContent }}
        </a-card>
    </div>
</template>

<script>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router'
import httpClient from '@/request';
import common from "@/config";
import { message } from 'ant-design-vue';
export default ({
    setup() {
        const appLoading = ref(false)
        const router = useRouter()
        //容器列表
        const containerValue = ref()
        const containerList = ref([])
        const containerListData = reactive({
            url: common.k8sPodContainer,
            params: {
                pod_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //容器日志
        const logContent = ref()
        const containerLogData = reactive({
            url: common.k8sPodLog,
            params: {
                container_name: '',
                pod_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //【方法】
        //容器列表
        const getContainerList = () => {
            let query = router.currentRoute.value.query
            containerListData.params.pod_name = query.pod_name
            containerListData.params.namespace = query.namespace
            containerListData.params.cluster = query.cluster
            httpClient.get(containerListData.url, {params: containerListData.params})
            .then(res => {
                containerList.value = res.data
                containerValue.value = res.data[0]
                getContainerLog()
            })
            .catch(res => {
                message.error(res.msg)
            })
        }
        //日志
        const getContainerLog = () => {
            //已经加载完成
            appLoading.value = true
            let query = router.currentRoute.value.query
            containerLogData.params.container_name = containerValue
            containerLogData.params.pod_name = query.pod_name
            containerLogData.params.namespace = query.namespace
            containerLogData.params.cluster = query.cluster
            httpClient.get(containerLogData.url, {params: containerLogData.params})
            .then(res => {
                logContent.value = res.data
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                appLoading.value = false
            })
        }
        //生命周期钩子
        //组件挂在时调用 setup新 几旧版的create等的集合 再到mount
        onMounted( () => {
            getContainerList()
        })

        //返回出去
        return {
            appLoading,
            containerValue,
            containerList,
            logContent,
            getContainerLog
        }
    }
})
</script>

<style scoped>
    .log-card {
        margin-top: 10px;
        height: calc(100vh - 67px);
        white-space: pre-wrap;
        overflow-y: auto;
    }
    .log-card::-webkit-scrollbar {
        width: 10px;
    }
    .log-card::-webkit-scrollbar-thumb {
        background-color: #666;
    }
    .log-card::-webkit-scrollbar-track {
        background-color: rgb(164, 162, 162);
    }
</style>