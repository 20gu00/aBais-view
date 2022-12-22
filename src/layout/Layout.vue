<template>
    <!-- 配置Layout -->
    <a-layout>
            <!-- 固钉，以及头部 -->
             <!--固钉-->
        <a-affix>
            <!-- 布局头部 -->
            <!-- 布局头部  固定 一直存在 -->
            <a-layout-header> 
                <!-- 平台名 -->
                <!-- 平台信息 -->
                <!-- float:left居左的同时，会把其他元素也放在同一行 -->
                <div style="float:left;">
                                        <!--图片直接调整高度即可上下左右 在设置下外间距,布局盒子之间的距离-->
                    <img style="height:40px;margin-bottom:10px;" :src="kubeLogo" />
                    <!--平台名称-->
                    <span style="padding:0 50px 0 20px;font-size:25px;font-weight:bold;color:#fff">aBais</span>
                </div>
                <!-- 集群信息 -->
                <!--菜单,设置宽度,超出这个宽度就显示...,可以下拉查看集群-->
                <!--selectedKeys 当前选中的是哪一个 水平  line-height行高-->
                <!--for循环获取-->
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
                    <img style="height:40px;border-radius:50%;margin-right:10px;" :src="avator"/>
                    <a-dropdown style="margin-top: 10px;" :overlayStyle="{paddingTop: '20px'}">
                        <a class="ant-dropdown-link" @click.prevent>
                            Admin
                            <down-outlined />
                        </a>
                        <template #overlay>
                            <a-menu>
                                <a-menu-item>
                                <a @click="logout()">退出登录</a>
                                </a-menu-item>
                                <a-menu-item>
                                <a href="javascript:;">修改密码</a>
                                </a-menu-item>
                            </a-menu>
                        </template>
                    </a-dropdown>
                </div>
            </a-layout-header>
        </a-affix>
                <!-- 中部，header下边,高度永远是窗口最大高度减去68px，因为68是header的高度 header永远在最高层  px是常用的像素单位，一般多用于PC端网页开发，直接使用书写  vw宽,vh高是相对视口尺寸的计算结果  中部的滚动不会影响header  calc动态计算长度值-->
        <a-layout style="height:calc(100vh - 68px);">
            <!-- 侧边栏，核心   collapsed收缩  collapsible开启伸缩功能-->
            <!--数据和视图双向绑定,v-model=v-bind+v-on-->
            <!--侧边栏颜色-->
            <!-- 侧边栏，核心 -->
            <!-- collapsed处理展开和收缩  -->
            <a-layout-sider width="240" style="background: #fff" v-model:collapsed="collapsed" collapsible>
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
                            <span>{{ menu.children[0].name }}</span>
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
                                    <span :class="[collapsed ? 'is-collapse' : '']">{{ menu.name }}</span>
                                </span>
                            </template>
                            <!-- 子栏目（子路由）的处理 -->
                            <a-menu-item
                            v-for="child in menu.children" 
                            :key="child.path" 
                            :index="child.path"
                            @click="routeChange('sub', child.path)">
                                <span>{{ child.name }}</span>
                            </a-menu-item>
                        </a-sub-menu>
                    </template>
                </a-menu>
            </a-layout-sider>
            <!--中部存放main的部分 24px左右的main部分间距 补料padding 也可以padding-left等配置-->
           <!--顺时针上右下左 上下 左右-->
            <a-layout style="padding: 0 24px">
                <!-- 面包屑 -->
                <a-breadcrumb style="margin: 16px 0">
                    <a-breadcrumb-item>工作台</a-breadcrumb-item>
                    <!-- router.currentRoute.value.matched表示路由的match信息，能拿到父路由和子路由的信息 -->
                    <template v-for="(matched,index) in router.currentRoute.value.matched" :key="index">
                        <a-breadcrumb-item v-if="matched.name">
                            {{ matched.name }}
                        </a-breadcrumb-item>
                    </template>
                </a-breadcrumb>
                <!-- main的部分 -->
                <!-- overflowY表示默认高度超出后，显示滚轴 -->
                <a-layout-content
                :style="{
                    background: 'rgb(31, 30, 30)',
                    // 外边距 margin和padding的区别 margin是盒子的外边距,即盒子与盒子之间的距离,而padding是内边距,是盒子的边与盒子内部元素的距离
                    padding: '24px', 
                    margin: 0, 
                    //最低高度,拉伸的时候(main部分)
                    minHeight: '280px', 
                    //内容放不下的时候
                    overflowY: 'auto'}">
                    <!-- 路由占位符 -->
                    <!-- Layout这里在做一次路由占位符,加载Layout组件时也加载views内容 router-view=view 点击侧边栏时路由改变 main内容改变,但布局侧边栏顶部底部不变-->
                    <router-view></router-view>
                </a-layout-content>
                <!-- footer部分 底部 -->
                <!--居中-->
                <a-layout-footer style="text-align: center">
                    ©2022 Created by 20gu00(github同名)
                </a-layout-footer>
            </a-layout>
        </a-layout>
    </a-layout>
</template>

<script>
//导入方法 {}
import { onBeforeMount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router'
//类似别名
//导入图片
import kubeLogo from '@/assets/k8s.png';
import avator from '@/assets/ava.png';
import httpClient from '@/request';
import common from "@/config";
import { message } from 'ant-design-vue';
export default ({
    //setup开始 vue3的全新配置项,值是一个函数,组合api的基础,组件中使用的数据方法都要在这里配置
    setup() {
        //默认值就是false,不收缩
        const appLoading = ref(false)
        const routers = ref([])
        const openKeys = ref([])
        const collapsed = ref(false)
        //数组 集群的列表
        const selectedKeys1 = ref([])
        const selectedKeys2 = ref([])
        //集群列表
        const clusterList = ref([])
        const clusterListData = reactive({
            url: common.k8sClusterList,
        })
        //通过useRouter方法获取路由配置以及当前页面的路由信息
        
        const router = useRouter()
        //【方法】
        //列表
        const getClusterList = () => {
            appLoading.value = true
            httpClient.get(clusterListData.url)
            .then(res => {
                //响应成功，获取deployment列表和total
                clusterList.value = res.data
                localStorage.setItem('cluster_num', clusterList.value.length)
                if (!selectedKeys1.value.length) {
                    selectedKeys1.value[0] = clusterList.value[0]
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
        padding: 0 30px !important;
    }
    .ant-layout-content::-webkit-scrollbar {
        width:6px;
    }
    .ant-layout-content::-webkit-scrollbar-track {
        background-color:rgb(164, 162, 162);
    }
    .ant-layout-content::-webkit-scrollbar-thumb {
        background-color:#666;
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