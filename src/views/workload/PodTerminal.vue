<template>
    <div>
        <div style="height:10px;"></div>
        <a-card :bodyStyle="{padding: '10px', height: '45px'}">
             <span style="font-size:14px;">容器: </span>
             <a-select style="width:140px;" size="small" v-model:value="containerValue" placeholder="请选择">
                <a-select-option
                    v-for="(item, index) in containerList"
                    :key="index"
                    :value="item">
                    {{ item }}
                </a-select-option>
            </a-select>
            <a-button style="margin-left: 20px;" size="small" type="primary" ghost @click="initSocket()">
                <template #icon><LoginOutlined /></template>
                连接
            </a-button>
            <a-button style="margin-left: 10px;" size="small" type="danger" ghost @click="closeSocket()">
                <template #icon><DisconnectOutlined /></template>
                关闭
            </a-button>
        </a-card>
        <a-card 
            class="term-card"
            :loading="appLoading"
            :bodyStyle="{padding: '0px', height: '100%'}">
            <div class="xterm-div" id="xterm"></div>
        </a-card>
    </div>
</template>

<script>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router'
import httpClient from '@/request';
import common from "@/config";
import { message } from 'ant-design-vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import 'xterm/lib/xterm.js';
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
        //终端
        const termOptions = common.termOptions
        var term = null
        var socket = null
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
                //getContainerLog()
            })
            .catch(res => {
                message.error(res.msg)
            })
        }
        //初始化虚拟终端
        const initTerm = () => {
            //新建一个终端
            term = new Terminal(termOptions)
            //开启一个终端 通过xterm获取终端
            term.open(document.getElementById('xterm'))
            const fitAddon = new FitAddon()
            //加载的插件
            term.loadAddon(fitAddon)
            fitAddon.fit()
            term.focus();
            term.onData(function (key) {
                let msgOrder = {
                    operation: 'stdin',
                    data: key,
                }
                socket.send(JSON.stringify(msgOrder))
            })
            let msgOrder2 = {
                operation: 'resize',
                cols: term.cols,
                rows: term.rows,
            };
            socket.send(JSON.stringify(msgOrder2))
        }
        //初始化websocket
        const initSocket = () => {
            if (term) {
                term.dispose()
            }
            if (socket) {
                socket.close()
            }
            let query = router.currentRoute.value.query
            let terminalWsUrl = common.k8sTerminalWs + "?pod_name=" + query.pod_name + "&container_name=" + containerValue.value + "&namespace=" + query.namespace + "&cluster=" + query.cluster
            socket = new WebSocket(terminalWsUrl)
            socket.onopen = () => {
                // 链接成功后 初始化终端
                initTerm()
            }
            socket.onmessage = (msg) => {
                let content = JSON.parse(msg.data)
                term.write(content.data)
            }
            socket.onsend = (msgOrder) => {
                let order = []
                order.push(msgOrder)
                socket.send(JSON.stringify(order));
            }
            socket.onclose = () => {
                console.log('close socket')
            }
            socket.onerror = () => {
                console.log('socket 连接失败')
            }
        }
        const closeSocket = () => {
            if (!socket) {
                return
            }
            term.write("连接关闭")
            socket.close()
        }
        //生命周期钩子
        onMounted( () => {
            getContainerList()
        })
        onBeforeUnmount( () => {
            if (socket) {
                socket.close()
            }
        })
        //返回出去
        return {
            appLoading,
            containerValue,
            containerList,
            initSocket,
            closeSocket
        }
    }
})
</script>

<!--
    自定义滚动条颜色，并且一直显示
    /deep/::-webkit-scrollbar 定义滚动条高宽及背景 高宽分别对应横竖滚动条的尺寸
    /deep/::-webkit-scrollbar-track 定义滚动条轨道 内阴影+圆角
    /deep/::-webkit-scrollbar-thumb 定义滑块 内阴影+圆角
    有deep的是页面单独定义,没有的就是全局定义
-->
<style scoped>
    .term-card {
        margin-top: 10px;
        height: calc(100vh - 67px);
    }
    .term-card::-webkit-scrollbar {
        width: 10px;
    }
    .term-card::-webkit-scrollbar-thumb {
        background-color: #666;
    }
    .term-card::-webkit-scrollbar-track {
        background-color: rgb(164, 162, 162);
    }
    .xterm-div {
        height: 100%;
        background-color: black;
    }
    /deep/.xterm-viewport::-webkit-scrollbar {
        width: 10px;
    }
    /deep/.xterm-viewport::-webkit-scrollbar-thumb {
        background-color: #666;
    }
    /deep/.xterm-viewport::-webkit-scrollbar-track {
        background-color: rgb(164, 162, 162);
    }
</style>