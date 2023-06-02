<template>
    <a-layout>
        <a-affix>
            <!-- 布局头部 -->
            <a-layout-header> 
                <!-- 平台名 -->
                <div style="float:left;">
                    <img style="height:40px;margin-bottom:10px;" :src="kubeLogo" />
                    <span style="padding:0 50px 0 15px;font-size:35px;font-weight:bold;color:aqua">aBais</span>
                </div>
                <!-- 集群 -->
                <a-menu
                style="float:left;width:250px;"
                v-model:selectedKeys="selectedKeys1"
                theme="dark"
                mode="horizontal"
                :style="{ lineHeight: '64px' }">
                    <a-menu-item v-for="(item) in clusterList" :key="item" @click="clusterChange(item)">{{ item }}</a-menu-item>
                </a-menu>
                <!-- 用户信息 -->
                <div style="float:right;">
                    <img style="height:40px;border-radius:50%;margin-right:5px;" :src="avator"/>
                    <a-dropdown style="margin-top: 10px;" :overlayStyle="{paddingTop: '20px'}">
                        <a class="ant-dropdown-link" style="color:bisque" @click.prevent>
                            <!--Admin-->
                            <!-- localStorage.getItem('namespace') -->
                            {{username}}
                            <down-outlined />
                        </a>
                        <template #overlay>
                            <a-menu>
                                <a-menu-item>
                                <a @click="logout()">退出登录</a>
                                </a-menu-item>
                                <!-- <a-menu-item>
                                <a href="javascript:;">修改密码</a>
                                </a-menu-item> -->
                            </a-menu>
                        </template>
                    </a-dropdown>
                </div>
            </a-layout-header>
        </a-affix>
        <a-layout style="height:calc(100vh - 68px);">
            <!-- 侧边栏，核心 -->
            <!-- collapsed处理展开和收缩 -->
            <a-layout-sider width="200" style="background:cornflowerblue" v-model:collapsed="collapsed" collapsible>
                <!-- selectedKeys表示点击选中的栏目,用于a-menu-item -->
                <!-- openKeys表示展开的栏目，用于a-sub-menu -->
                <!-- openChange事件监听 SubMenu 展开/关闭的回调 -->
                <a-menu
                :selectedKeys="selectedKeys2"
                :openKeys="openKeys"
                @openChange="onOpenChange"
                mode="inline"
                :style="{ height: '100%', borderRight: 0 }">
                    <!-- routers是router/index.js中的路由信息 -->
                    <template v-for="menu in routers" :key="menu">
                        <!-- 处理无子路由的情况，也就是单个栏目 -->
                        <!-- routeChange用于路由跳转 -->
                        <a-menu-item 
                        v-if="menu.children && menu.children.length == 1" 
                        :index="menu.children[0].path" 
                        :key="menu.children[0].path"
                        @click="routeChange('item', menu.children[0].path)">
                            <template #icon>
                                <component :is="menu.children[0].icon" />
                            </template>
                            <span style="font-size:large">{{ menu.children[0].name }}</span>
                        </a-menu-item>
                        <!-- 处理有子路由的情况，也就是父栏目 -->
                        <a-sub-menu
                        v-else-if="menu.children && menu.children.length > 1"
                        :index="menu.path"
                        :key="menu.path">
                            <template #icon>
                                <component :is="menu.icon" />
                            </template>
                            <template #title>
                                <span>
                                    <span :class="[collapsed ? 'is-collapse' : '']" style="font-size:large">{{ menu.name }}</span>
                                </span>
                            </template>
                            <!-- 子栏目（子路由）的处理 -->
                            <a-menu-item
                            v-for="child in menu.children" 
                            :key="child.path" 
                            :index="child.path"
                            @click="routeChange('sub', child.path)">
                                <span style="font-size:medium">{{ child.name }}</span>
                            </a-menu-item>
                        </a-sub-menu>
                    </template>
                </a-menu>
            </a-layout-sider>
            <a-layout style="padding: 0 24px">
                <!-- 面包屑 -->
                <a-breadcrumb style="margin: 5px 0;color:deepskyblue">
                    <a-breadcrumb-item style="color:darkgrey">console</a-breadcrumb-item>
                    <!-- router.currentRoute.value.matched表示路由的match信息，能拿到父路由和子路由的信息 -->
                    <template v-for="(matched,index) in router.currentRoute.value.matched" :key="index">
                        <a-breadcrumb-item v-if="matched.name" style="color:deepskyblue">
                            {{ matched.name }}
                        </a-breadcrumb-item>
                    </template>
                </a-breadcrumb>
                <!-- main的部分 -->
                <a-layout-content
                :style="{
                    background: 'rgb(50, 50, 50)',
                    padding: '15px', 
                    margin: 0, 
                    minHeight: '280px', 
                    overflowY: 'auto'}">
                    <!-- 路由占位符 -->
                    <router-view></router-view>
                </a-layout-content>
                <!-- footer部分 -->
                <a-layout-footer style="text-align: center;color:mediumspringgreen">
                    ©2023 Created by 20gu00
                </a-layout-footer>
            </a-layout>
        </a-layout>
    </a-layout>
</template>
<script>
import { onBeforeMount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router'
import kubeLogo from '@/assets/k8s.png';
//import login from '@/views/common/Login';
import avator from '@/assets/ava.png';
import httpClient from '@/request';
import common from "@/config";
import { message } from 'ant-design-vue';
export default ({
    setup() {
        const username=localStorage.getItem("username")
        const appLoading = ref(false)
        const routers = ref([])
        const openKeys = ref([])
        const collapsed = ref(false)
        const selectedKeys1 = ref([])
        const selectedKeys2 = ref([])
        //集群列表
        const clusterList = ref([])
        const clusterListData = reactive({
            url: common.k8sClusterList,
        })
        //使用useRouter方法获取路由配置以及当前路由信息
        const router = useRouter()
        //【方法】
        //列表
        const getClusterList = () => {
            appLoading.value = true
            httpClient.get(clusterListData.url)
            .then(res => {
                //响应成功，获取cluster列表和total
                clusterList.value = res.data
                localStorage.setItem('cluster_num', clusterList.value.length)
                if (!selectedKeys1.value.length) {
                    selectedKeys1.value[0] = clusterList.value[0]
                    //setItem
                    localStorage.setItem('k8s_cluster', clusterList.value[0])
                }
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                appLoading.value = false
            })
        }
        const clusterChange = (val) => {
            if (selectedKeys1.value[0] == val) {
                return
            } else {
                selectedKeys1.value[0] = val
                localStorage.setItem('k8s_cluster', val)
                //router.push(router.currentRoute.value.path)
                location.replace(router.currentRoute.value.path)
            }
        }
        //导航栏点击切换页面
        const routeChange =  (type, path) => {
            //判断点击的栏目是否为父栏目，如果不是，则关闭其他父栏目
            if (type !== 'sub') {
                openKeys.value = []
            }
            //表示选中当前path对应的栏目
            selectedKeys2.value = [path]
            if(router.currentRoute.value.path !== path){
                //获取路由对象并切换
                router.push(path)
            }
        }
        //根据url自动导航栏目高亮
        const getRouter = (val) => {
            selectedKeys2.value = [val[1].path]
            openKeys.value = [val[0].path]
        }
        //处理菜单栏展开与关闭
        const onOpenChange = (val) => {
            const latestOpenKey = val.find(key => openKeys.value.indexOf(key) === -1);
            openKeys.value = latestOpenKey ? [latestOpenKey] : [];
        }
        //退出登录
        const logout = () => {
            //移除用户名
            localStorage.removeItem('username');
            //移除token
            localStorage.removeItem('token');
            //跳转至/login页面
            router.push('/login');
        }
        //生命周期钩子
        onBeforeMount(() => {
            getClusterList()
            if (localStorage.getItem('k8s_cluster')) {
                selectedKeys1.value[0] = localStorage.getItem('k8s_cluster')
            }
        })
        onMounted(() => {
            routers.value = router.options.routes
            getRouter(router.currentRoute.value.matched)
        })
        //将变量和方法返回出去才能使用
        return {
            username,
            kubeLogo,
            avator,
            collapsed,
            selectedKeys1,
            selectedKeys2,
            openKeys,
            router,
            routers,
            clusterList,
            routeChange,
            onOpenChange,
            logout,
            clusterChange
        };
    },
});
</script>
<style scoped>
    .ant-layout-header {
        background-color:rgb(50, 50, 50);
        padding: 0 30px !important;
    }
    .ant-layout-content::-webkit-scrollbar {
        width:6px;
    }
    .ant-layout-content::-webkit-scrollbar-track {
        background-color:rgb(176, 173, 173);
    }
    .ant-layout-content::-webkit-scrollbar-thumb {
        background-color:rgb(60, 59, 59);
    }
    .ant-layout-footer {
        padding: 5px 50px !important;
        color: rgb(239, 239, 239);
    }
    .is-collapse {
        display: none;
    }
    .ant-layout-sider {
        background: #141414 !important;
        overflow-y: auto;
    }
    .ant-layout-sider::-webkit-scrollbar {
        display: none;
    }
    .ant-menu-item {
        margin: 0 !important;
    }
</style>