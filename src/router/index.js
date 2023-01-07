//导入router的路由模式
import {createRouter, createWebHistory} from 'vue-router'
//导入进度条组件
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
//导入整体布局Layout
import Layout from "@/layout/Layout"
//导入jwt token组件
import jwt from 'jsonwebtoken'

//路由规则
const routes = [
    {
        path: '/',
        redirect: '/home' //重定向
    },
    {
        path: '/login',  //url路径
        component: () => import('@/views/common/Login.vue'),  //视图组件
        meta: {title: "登录", requireAuth: false},  //meta元信息
    },
    {   
        path: "/home",
        component: Layout,
        children: [
            {
                path: "/home",
                name: "大盘",
                icon: "dashboard-twoTone",
                meta: {title: "大盘", requireAuth: true},
                component: () => import('@/views/home/Home.vue'),
            }
        ]
    },
    {
        path: "/cluster",
        name: "集群",
        component: Layout,
        icon: "cloud-twoTone",
        children: [
            {
                path: "/cluster/node",
                name: "Node",
                meta: {title: "Node", requireAuth: true},
                component: () => import('@/views/cluster/Node.vue'),
            },
            {
                path: "/cluster/namespace",
                name: "Namespace",
                meta: {title: "Namespace", requireAuth: true},
                component: () => import('@/views/cluster/Namespace.vue'),
            },
            {
                path: "/cluster/pv",
                name: "PV",
                meta: {title: "PV", requireAuth: true},
                component: () => import('@/views/cluster/PV.vue'),
            }
        ]
    },
    {
        path: "/workload",
        name: "负载",
        component: Layout,
        icon: "switcher-twoTone",
        children: [
            {
                path: "/workload/pod",
                name: "Pod",
                meta: {title: "Pod", requireAuth: true},
                component: () => import('@/views/workload/Pod.vue'),
            },
            {
                path: "/workload/deployment",
                name: "Deployment",
                meta: {title: "Deployment", requireAuth: true},
                component: () => import('@/views/workload/Deployment.vue'),
            },
            {
                path: "/workload/daemonset",
                name: "DaemonSet",
                meta: {title: "DaemonSet", requireAuth: true},
                component: () => import('@/views/workload/DaemonSet.vue'),
            },
            {
                path: "/workload/statefulset",
                name: "StatefulSet",
                meta: {title: "StatefulSet", requireAuth: true},
                component: () => import('@/views/workload/StatefulSet.vue'),
            },
            {
                path: "/workload/job",
                name: "Job",
                meta: {title: "Job", requireAuth: true},
                component: () => import('@/views/workload/Job.vue'),
            },
            {
                path: "/workload/cronjob",
                name: "CronJob",
                meta: {title: "CronJob", requireAuth: true},
                component: () => import('@/views/workload/Cronjob.vue'),
            },
        ]
    },
    {
        path: '/workload/pod/terminal',  //url路径
        component: () => import('@/views/workload/PodTerminal.vue'),  //视图组件
        meta: {title: "终端", requireAuth: false},  //meta元信息
    },
    {
        path: '/workload/pod/log',  //url路径
        component: () => import('@/views/workload/PodLog.vue'),  //视图组件
        meta: {title: "日志", requireAuth: false},  //meta元信息
    },
    {
        path: "/loadbalance",
        name: "服务",
        component: Layout,
        icon: "control-twoTone",
        children: [
            {
                path: "/loadbalance/ingress",
                name: "Ingress",
                meta: {title: "Ingress", requireAuth: true},
                component: () => import('@/views/loadbalance/Ingress.vue'),
            },
            {
                path: "/loadbalance/service",
                name: "Service",
                meta: {title: "Service", requireAuth: true},
                component: () => import('@/views/loadbalance/Service.vue'),
            }
        ]
    },
    {
        path: "/storage",
        name: "存储与配置",
        component: Layout,
        icon: "database-twoTone",
        children: [
            {
                path: "/storage/configmap",
                name: "Configmap",
                meta: {title: "Configmap", requireAuth: true},
                component: () => import('@/views/storage/Configmap.vue'),
            },
            {
                path: "/storage/secret",
                name: "Secret",
                meta: {title: "Secret", requireAuth: true},
                component: () => import('@/views/storage/Secret.vue'),
            },
            {
                path: "/storage/pvc",
                name: "PVC",
                meta: {title: "PVC", requireAuth: true},
                component: () => import('@/views/storage/PVC.vue'),
            },
            {
                path: "/storage/role",
                name: "Role",
                meta: {title: "Role", requireAuth: true},
                component: () => import('@/views/storage/Role.vue'),
            },
            {
                path: "/storage/cluasterrole",
                name: "ClusterRole",
                meta: {title: "ClusterRole", requireAuth: true},
                component: () => import('@/views/storage/Clusterrole.vue'),
            },
            {
                path: "/storage/rolebinding",
                name: "Rolebinding",
                meta: {title: "Rolebinding", requireAuth: true},
                component: () => import('@/views/storage/Rolebinding.vue'),
            },
            {
                path: "/storage/clusterbinding",
                name: "ClusterRoleBinding",
                meta: {title: "ClusterRoleBinding", requireAuth: true},
                component: () => import('@/views/storage/Clusterrolebinding.vue'),
            },
            {
                path: "/storage/sa",
                name: "Service Account",
                meta: {title: "Service Account", requireAuth: true},
                component: () => import('@/views/storage/Serviceaccount.vue'),
            }
        ]
    },
    {
        path: '/helmstore',
        name: "应用商店",
        component: Layout,
        icon: "shop-twoTone",
        children: [
            {
                path: "/helmstore/release",
                name: "Release",
                meta: {title: "Release", requireAuth: true},
                component: () => import('@/views/helmstore/Release.vue'),
            },
            {
                path: "/helmstore/chartrepo",
                name: "Chart Repo",
                meta: {title: "Chart Repo", requireAuth: true},
                component: () => import('@/views/helmstore/ChartRepo.vue'),
            }
        ]
    },
]

// createRouter 创建路由实例
const router = createRouter({
    /**
     * hash模式：createWebHashHistory，
     * history模式：createWebHistory
     */
    history: createWebHistory(),
    routes
})

//递增进度条，这将获取当前状态值并添加0.2直到状态为0.994
NProgress.inc(100)
//easing 动画字符串
//speed 动画速度
//showSpinner 进度环显示隐藏
NProgress.configure({ easing: 'ease', speed: 600, showSpinner: false })

//router.beforeEach（）一般用来做一些进入页面的限制。比如没有登录，就不能进入某些
//页面，只有登录了之后才有权限查看某些页面。。。说白了就是路由拦截。
//to 要去到某个页面的属性
//from 从哪个页面来的属性
//next 处理路由跳转及放行
router.beforeEach((to, from, next) => {
    // 启动进度条
    NProgress.start()

    // 设置头部
    if (to.meta.title) {
        document.title = to.meta.title
    } else {
        document.title = "aBais"  //无关紧要
    }
    //放行
    next()
})

//使用钩子函数对路由进行权限跳转
router.beforeEach((to, from, next) => {
    //验证jwt token是否合法
    jwt.verify(localStorage.getItem('token'), 'adoodevops', function (err) {
        if (to.path === '/login') {
            next()
        } else if (err) {
            next('/login');
        } else {
            next();
        }
    });
});

router.afterEach(() => {
    // 关闭进度条
    NProgress.done()
})

// 抛出路由实例, 在 main.js 中引用
export default router