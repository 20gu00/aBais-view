const baseHost = 'http://localhost:9090'
export default {
    //登录
    //所有资源数据
    k8sAllRes: baseHost + '/api/v1/k8s/allresource',
    loginAuth: baseHost + '/api/v1/login',
    //cluster
    k8sClusterList: baseHost + '/api/v1/k8s/clusters',
    //event
    k8sEventList: baseHost + '/api/v1/k8s/events',
    //namespace
    k8sNamespaceList: baseHost + '/api/v1/k8s/namespaces',
    k8sNamespaceDetail: baseHost + '/api/v1/k8s/namespace/detail',
    k8sNamespaceDel: baseHost + '/api/v1/k8s/namespace/del',
    //deployment
    k8sDeploymentList: baseHost + '/api/v1/k8s/deployments',
    k8sDeploymentDetail: baseHost + '/api/v1/k8s/deployment/detail',
    k8sDeploymentUpdate: baseHost + '/api/v1/k8s/deployment/update',
    k8sDeploymentScale: baseHost + '/api/v1/k8s/deployment/scale',
    k8sDeploymentRestart: baseHost + '/api/v1/k8s/deployment/restart',
    k8sDeploymentDel: baseHost + '/api/v1/k8s/deployment/delete',
    k8sDeploymentCreate: baseHost + '/api/v1/k8s/deployment/create',
    k8sDeploymentNumNp: baseHost + '/api/v1/k8s/deployment/numns',
    //pod
    k8sPodList: baseHost + '/api/v1/k8s/pods',
    k8sPodDetail: baseHost + '/api/v1/k8s/pod/detail',
    k8sPodUpdate: baseHost + '/api/v1/k8s/pod/update',
    k8sPodDel: baseHost + '/api/v1/k8s/pod/delete',
    k8sPodContainer: baseHost + '/api/v1/k8s/pod/container',
    k8sPodLog: baseHost + '/api/v1/k8s/pod/log',
    k8sPodNumNp: baseHost + '/api/v1/k8s/pod/numnp',
    k8sTerminalWs: 'ws://localhost:9091/ws',
    //ingress
    k8sIngressList: baseHost + '/api/v1/k8s/ingresses',
    k8sIngressDetail: baseHost + '/api/v1/k8s/ingress/detail',
    k8sIngressUpdate: baseHost + '/api/v1/k8s/ingress/update',
    k8sIngressDel: baseHost + '/api/v1/k8s/ingress/delete',
    k8sIngressCreate: baseHost + '/api/v1/k8s/ingress/create',
    //service
    k8sSvcList: baseHost + '/api/v1/k8s/services',
    k8sSvcDetail: baseHost + '/api/v1/k8s/service/detail',
    k8sSvcUpdate: baseHost + '/api/v1/k8s/service/update',
    k8sSvcDel: baseHost + '/api/v1/k8s/service/del',
    k8sSvcCreate: baseHost + '/api/v1/k8s/service/create',
    //daemonset
    k8sDaemonSetList: baseHost + '/api/v1/k8s/daemonsets',
    k8sDaemonSetDetail: baseHost + '/api/v1/k8s/daemonset/detail',
    k8sDaemonSetUpdate: baseHost + '/api/v1/k8s/daemonset/update',
    k8sDaemonSetDel: baseHost + '/api/k8s/v1/daemonset/delete',
    //statefulset
    k8sStatefulSetList: baseHost + '/api/v1/k8s/statefulsets',
    k8sStatefulSetDetail: baseHost + '/api/v1/k8s/statefulset/detail',
    k8sStatefulSetUpdate: baseHost + '/api/v1/k8s/statefulset/update',
    k8sStatefulSetDel: baseHost + '/api/v1/k8s/statefulset/del',
    //node
    k8sNodeList: baseHost + '/api/v1/k8s/nodes',
    k8sNodeDetail: baseHost + '/api/v1/k8s/node/detail',
    //pv
    k8sPvList: baseHost + '/api/v1/k8s/pvs',
    k8sPvDetail: baseHost + '/api/v1/k8s/pv/detail',
    k8sPvDel: baseHost + '/api/v1/k8s/pv/delete',
    //configmap
    k8sConfigmapList: baseHost + '/api/v1/k8s/configmaps',
    k8sConfigmapDetail: baseHost + '/api/v1/k8s/configmap/detail',
    k8sConfigmapUpdate: baseHost + '/api/v1/k8s/configmap/update',
    k8sConfigmapDel: baseHost + '/api/v1/k8s/configmap/delete',
    //secret
    k8sSecretList: baseHost + '/api/v1/k8s/secrets',
    k8sSecretDetail: baseHost + '/api/v1/k8s/secret/detail',
    k8sSecretUpdate: baseHost + '/api/v1/k8s/secret/update',
    k8sSecretDel: baseHost + '/api/v1/k8s/secret/delete',
    //pvc
    k8sPvcList: baseHost + '/api/v1/k8s/pvcs',
    k8sPvcDetail: baseHost + '/api/v1/k8s/pvc/detail',
    k8sPvcUpdate: baseHost + '/api/v1/k8s/pvc/update',
    k8sPvcDel: baseHost + '/api/v1/k8s/pvc/delete',
    //release
    helmReleaseList: baseHost + '/api/v1/helmstore/releases',
    helmReleaseDetail: baseHost + '/api/v1/helmstore/release/detail',
    helmReleaseInstall: baseHost + '/api/v1/helmstore/release/install',
    helmReleaseUninstall: baseHost + '/api/v1/helmstore/release/uninstall',
    //chart
    helmChartList: baseHost + '/api/v1/helmstore/charts',
    helmChartAdd: baseHost + '/api/v1/helmstore/chart/add',
    helmChartUpdate: baseHost + '/api/v1/helmstore/chart/update',
    helmChartDel: baseHost + '/api/v1/helmstore/chart/del',
    helmChartFileUpload: baseHost + '/api/v1/helmstore/chartfile/upload',
    helmChartFileDel: baseHost + '/api/v1/helmstore/chartfile/del',
    //编辑器配置
    cmOptions: {
        // 语言及语法模式
        mode: 'text/yaml',
        // 主题
        theme: 'dracula',
        // 显示行数
        lineNumbers: true,
        smartIndent: true, //智能缩进
        indentUnit: 4, // 智能缩进单元长度为 4 个空格
        styleActiveLine: true, // 显示选中行的样式
        matchBrackets: true, //每当光标位于匹配的方括号旁边时，都会使其高亮显示
        readOnly: false,
        lineWrapping: true //自动换行
    },
    //xterm终端配置
    termOptions: {
        rendererType: 'canvas', //渲染类型
        rows: 40, //行数
        cols: 100,
        convertEol: false, //启用时，光标将设置为下一行的开头
        scrollback: 10, //终端中的回滚量
        disableStdin: false, //是否应禁用输入
        cursorStyle: 'underline', //光标样式
        cursorBlink: true, //光标闪烁
        theme: {
            foreground: 'white', //字体
            background: '#060101', //背景色
            cursor: 'help' //设置光标
        }
    }
}