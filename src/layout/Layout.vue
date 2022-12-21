<template>
    <!-- 配置Layout -->
    <a-layout>
        <!-- 固钉，以及头部 -->
        <a-affix>
            <!-- 布局头部 -->
            <a-layout-header>
                <!-- 平台信息 -->
                <!-- float:left居左的同时，会把其他元素也放在同一行 -->
                <div style="float:left;">
                    <img style="height:40px;margin-bottom:10px;" :src="kubeLogo"/>
                    <span style="font-size:25px;padding:0 50px 0 20px;font-weight:bold;color:#fff;">kubeA</span>
                </div>
                <!-- 集群信息 -->
                <a-menu
                    style="float:left;width:250px;line-height:64px;"
                    v-model:selectedKeys="selectedKeys1"
                    theme="dark"
                    mode="horizontal">
                    <a-menu-item v-for="item in clusterList" :key="item">
                        {{ item }}
                    </a-menu-item>
                </a-menu>
                <!-- 用户信息 -->
                <div style="float:right;">
                    <img style="height:40px;border-radius:50%;margin-right:10px;" :src="avator"/>
                    <a-dropdown :overlayStyle="{paddingTop: '20px'}">
                        <a>
                            Admin
                            <down-outlined />
                        </a>
                        <template #overlay>
                            <a-menu>
                                <a-menu-item>
                                    <a @click="logout()">退出登录</a>
                                </a-menu-item>
                                <a-menu-item>
                                    <a>修改密码</a>
                                </a-menu-item>
                            </a-menu>
                        </template>
                    </a-dropdown>
                </div>
            </a-layout-header>
        </a-affix>
        <!-- 中部，高度永远是窗口最大高度减去68px，因为68是header的高度-->
        <a-layout style="height:calc(100vh - 68px)">
            <!-- 侧边栏，核心 -->
            <a-layout-sider width="240" v-model:collapsed="collapsed" collapsible>
                <!-- selectedKeys表示点击选中的栏目,用于a-menu-item -->
                <!-- openKeys表示展开的栏目，用于a-sub-menu -->
                <!-- openChange事件监听 SubMenu 展开/关闭的回调 -->
                <a-menu
                    :selectedKeys="selectedKeys2"
                    :openKeys="openKeys"
                    @openChange="onOpenChange"
                    mode="inline"
                    :style="{height:'100%', boderRight: 0}">
                    <!-- routers是router/index.js的路由信息 -->
                    <template v-for="menu in routers" :key="menu">
                        <!-- 处理无子路由的情况 -->
                        <!-- routeChange用于处理跳转和选中 -->
                        <a-menu-item
                            v-if="menu.children && menu.children.length ==1"
                            :index="menu.children[0].path"
                            :key="menu.children[0].path"
                            @click="routeChange('item', menu.children[0].path)">
                            <template #icon>
                                <component :is="menu.children[0].icon" />
                            </template>
                            <span>{{ menu.children[0].name }}</span>
                        </a-menu-item>
                        <!-- 处理有子路由的情况,也就是父栏目 -->
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
                            <!-- 子栏目（子路由） -->
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
            <a-layout style="padding: 0 24px">
                <!-- main的部分 -->
                <!-- overflowY表示默认高度超出后，显示滚轴 -->
                <a-layout-content
                :style="{
                    background: 'rgb(31, 30, 30)',
                    margin: 0,
                    minHeight: '280px',
                    overflowY: 'auto'}">
                    <!-- Layout这里在做一次路由占位符,加载Layout组件也加载views内容 router-view=view 点击侧边栏时路由改变 main内容改变,但布局侧边栏顶部底部不变-->
                    <router-view></router-view>
                </a-layout-content>
                <!-- footer部分 -->
                <a-layout-footer style="text-align:center">
                    ©2022 Created by adoo Devops
                </a-layout-footer>
            </a-layout>
        </a-layout>
    </a-layout>
</template>

<script>
import { ref, onMounted } from 'vue'
import kubeLogo from '@/assets/k8s-metrics.png'
import avator from '@/assets/avator.png'
import { useRouter } from 'vue-router'
export default ({
    setup() {
        const collapsed = ref(false)
        const selectedKeys1 = ref([])
        const clusterList = ref([
            'TST-1',
            'TST-2'
        ])
        //侧边栏的属性
        //路由信息
        const routers = ref([])
        const selectedKeys2 = ref([])
        const openKeys = ref([])
        //通过useRouter方法获取路由配置以及当前页面的路由信息
        const router = useRouter()
        //
        
        //【这里开始是方法】
        function logout() {
            //移除用户名
            localStorage.removeItem('username')
            //移除token
            localStorage.removeItem('token')
            //跳转至/login页面
            //router.push('/login')
        }
        //导航栏点击切换页面，以及处理选中的情况
        function routeChange(type, path) {
            //判断点击是否为sub栏目(也就是单独item)，如果不是，则关闭其他父栏目
            if (type != 'sub') {
                openKeys.value = []
            }
            //选中当前path对应的栏目,单独item或者子item
            selectedKeys2.value = [path]
            //页面跳转
            //router.currentRoute.value.path用于获取当前的页面路径
            if (router.currentRoute.value.path !== path) {
                router.push(path)
            }
            console.log(selectedKeys2.value,123)
        }
        //专门用于sub的打开和关闭
        function onOpenChange(val) {
            //匹配这个val（path）是否已经打开，如果没有，则打开他，关闭其他
            const latestOpenKey = val.find(key => openKeys.value.indexOf(key) == -1)
            openKeys.value = latestOpenKey? [latestOpenKey]:[]
        }
        //用于从浏览器地址直接打开后的选中
        const getRouter = ((val) => {
            selectedKeys2.value = [val[1].path]
            openKeys.value = [val[0].path]
            console.log(selectedKeys2.value)
        })
        //生命周期钩子
        onMounted(() => {
            routers.value = router.options.routes
            //router.currentRoute.value.matched用来获取当前路由层级信息
            getRouter(router.currentRoute.value.matched)
        })
        return {
            collapsed,
            kubeLogo,
            avator,
            selectedKeys1,
            clusterList,
            routers,
            selectedKeys2,
            openKeys,
            router,
            logout,
            routeChange,
            onOpenChange
        }
    },
})
</script>

<style scoped>
    .ant-layout-header {
        padding: 0 30px !important;
    }
    .ant-layout-footer {
        padding: 5px 50px !important;
        color: rgb(239, 239, 239);
    }
    .is-collapse {
        display: none;
    }
</style>