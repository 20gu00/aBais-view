<template>
    <div>
        <MainHead
            searchDescribe="关键词"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @dataList="getConfigmapList"
            @namespaceList="getNamespaceList"
            add
            @addFunc="handleAdd"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:15px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="configmapList"
                :pagination="pagination"
                @change="handleTableChange">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'name'">
                        <span style="font-weight: bold;color:coral;font-size:medium">{{ record.metadata.name }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'data'">
                        <a-popover
                            :overlayStyle="{width:'530px'}">
                            <template #content>
                                <div style="color:aquamarine; width:500px;height:500px;word-break:break-all;overflow-y:auto;">{{ record.data }}</div>
                            </template>
                            <file-text-outlined style="font-size: 15px;" />
                        </a-popover>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag style="color:linen;font-size:medium">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;color:aqua" class="configmap-button" type="primary" icon="form-outlined" @click="getConfigmapDetail(record)">YAML</c-button>
                        <c-button style="margin-bottom:5px;color:crimson" class="configmap-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delConfigmap)">删除</c-button>
                    </template>
                </template>
            </a-table>
        </a-card>
        <!-- 展示YAML信息的弹框 -->
        <a-modal
            width="900px"
            v-model:visible="yamlModal"
            title="YAML信息"
            :confirm-loading="appLoading"
            cancelText="取消"
            okText="更新"
            @ok="updateConfigmap">
            <!-- codemirror编辑器 -->
            <!-- border 带边框 -->
            <!-- options  编辑器配置 -->
            <!-- change 编辑器中的内容变化时触发 -->
            <codemirror
                :value="contentYaml"
                border
                :options="cmOptions"
                height="600"
                style="font-size:19px;"
                @change="onChange"
            ></codemirror>
        </a-modal>
        <a-drawer
            v-model:visible="createDrawer"
            title="创建configmap"
            width="800px"
            :footer-style="{ textAlign: 'right' }"
            @close="onClose">
            <br>
            <a-form ref="formRef" :model="createConfigmap" :labelCol="{style: {width: '30%'}}">
                <a-form-item
                    label="name"
                    name="createName"
                    :rules="[{ required: true, message: '请输入configmap名称' }]">
                    <a-input style="color:khaki" v-model:value="createName" />
                </a-form-item>
                <a-form-item
                    style="color:khaki"
                    label="namespace"
                    name="createNamespace"
                    :rules="[{ required: true, message: '请选择namespace' }]">
                    <!--下拉选择框 placeholder占位符-->
                    <a-select show-search  style="width:140px;color:khaki" v-model:value="createNamespace" placeholder="请选择">
                        <!--可选项 遍历-->
                        <a-select-option
                            style="color:khaki"
                            v-for="(item, index) in namespaceList"
                            :key="index"
                            :value="item.metadata.name">
                            {{ item.metadata.name }}
                        </a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item
                    label="label"
                    name="createLabel"
                    :rules="[{ required: false, message: '请输入data' }]">
                    <!--占位符 案例-->
                    <a-input style="color:khaki" v-model:value="createLabel" placeholder="a=b,t=1" />
                </a-form-item>
            </a-form>
            <!--抽屉底部-->
            <template #footer>
                <a-button style="margin-right: 8px" @click="onClose()">取消</a-button>
                <a-button type="primary" @click="formSubmit()">确定</a-button>
            </template>
        </a-drawer>
    </div>
</template>

<script>
import { createVNode, reactive, ref, toRefs} from 'vue';
import MainHead from '@/components/MainHead';
import httpClient from '@/request';
import common from "@/config";
import { message } from 'ant-design-vue';
import yaml2obj from 'js-yaml';
import json2yaml from 'json2yaml';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';
export default({
    components: {
        MainHead,
    },
    setup() {
        //表结构
        const columns = ref([
            {
                title: 'Configmap',
                dataIndex: 'name',
                width:300
            },
            {
                title: 'DATA',
                dataIndex: 'data',
                width:100
            },
            {
                title: '创建时间',
                dataIndex: 'creationTimestamp',
                width:200
            },
            {
                title: 'action',
                key: 'action',
                fixed: 'right',
                width: 200
            }
        ])
        //常用项
        const appLoading = ref(false)
        const searchValue = ref('')
        const namespaceValue = ref('')
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
        //列表
        const configmapList = ref([])
        const configmapListData = reactive({
            url : common.k8sConfigmapList,
            params: {
                filter_name: '',
                namespace: '',
                cluster: '',
                page: 1,
                limit: 10
            }
        })
        //详情
        const contentYaml = ref('')
        const yamlModal = ref(false)
        const cmOptions = common.cmOptions
        const configmapDetail =  reactive({
            metadata: {}
        })
        const configmapDetailData =  reactive({
            url: common.k8sConfigmapDetail,
            params: {
                configmap_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //yaml更新
        const updateConfigmapData = reactive({
            url: common.k8sConfigmapUpdate,
            params: {
                namespace: '',
                content: '',
                cluster: ''
            }
        })
        //删除
        const delConfigmapData = reactive({
            url: common.k8sConfigmapDel,
            params: {
                configmap_name: '',
                namespace: '',
                cluster: ''
            }
        })

        //【方法】
        //json转yaml方法
        function transYaml(content) {
            return json2yaml.stringify(content)
        }
        //yaml转对象
        function transObj(content) {
            return yaml2obj.load(content)
        }
        function timeTrans(timestamp) {
            let date = new Date(new Date(timestamp).getTime() + 8 * 3600 * 1000)
            date = date.toJSON();
            date = date.substring(0, 19).replace('T', ' ')
            return date 
        }
        function ellipsis (val, len) {
            return val.length > len ? val.substring(0,len) + '...' : val
        }
        function handleTableChange(val) {
            pagination.currentPage = val.current
            pagination.pagesize = val.pageSize
            getConfigmapList()
        }
        function getSearchValue(val) {
            searchValue.value = val
        }
        function getNamespaceValue(val) {
            namespaceValue.value = val
        }
        //编辑器内容变化时触发的方式,用于将更新的内容复制到变量中
        function onChange(val) {
            contentYaml.value = val
        }
        //列表
        function getConfigmapList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            configmapListData.params.filter_name = searchValue.value
            configmapListData.params.namespace = namespaceValue.value
            configmapListData.params.cluster = localStorage.getItem('k8s_cluster')
            configmapListData.params.page = pagination.currentPage
            configmapListData.params.limit = pagination.pagesize
            httpClient.get(configmapListData.url, {params: configmapListData.params})
            .then(res => {
                //响应成功，获取configmap列表和total
                configmapList.value = res.data.items
                pagination.total = res.data.total
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                appLoading.value = false
            })
        }
        //详情
        function getConfigmapDetail(e) {
            appLoading.value = true
            configmapDetailData.params.configmap_name = e.metadata.name
            configmapDetailData.params.namespace = namespaceValue.value
            configmapDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(configmapDetailData.url, {params: configmapDetailData.params})
            .then(res => {
                //configmapDetail = Object.assign(configmapDetail, res.data)
                contentYaml.value = transYaml(res.data)
                yamlModal.value = true
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                appLoading.value = false
            })
        }
        //更新configmap
        function updateConfigmap() {
            appLoading.value = true
            //将yaml格式的configmap对象转为json
            let content = JSON.stringify(transObj(contentYaml.value))
            updateConfigmapData.params.namespace = namespaceValue.value
            updateConfigmapData.params.content = content
            updateConfigmapData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(updateConfigmapData.url, updateConfigmapData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getConfigmapList()
                yamlModal.value = false
            })
        }
        //删除configmap
        function delConfigmap(name) {
            appLoading.value = true
            delConfigmapData.params.configmap_name = name
            delConfigmapData.params.namespace = namespaceValue.value
            delConfigmapData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delConfigmapData.url, {data: delConfigmapData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getConfigmapList()
            })
        }
        //确认框
        function showConfirm(action, res, fn) {
            Modal.confirm({
                title: '是否继续' + action + "操作? 操作对象：",
                icon: createVNode(ExclamationCircleOutlined),
                content: createVNode('div', {
                    //style: 'color:red;',
                }, res),
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

        //创建
        const formRef = ref()
        const createDrawer = ref(false)
        const createConfigmap = reactive({
            createName: '',
            createNamespace: 'default',
            createData:'',
        })
        const createConfigmapData = reactive({
            url: common.k8sConfigmapCreate,
            params: {
                name: '',
                cluster: '',
                namespace:'',
                data:{},
            }
        })

        //处理新增
        function handleAdd() {
            createDrawer.value = true
        }
        function resetForm() {
            formRef.value.resetFields();
        }
        //验证表单
        async function formSubmit() {
            try {
                await formRef.value.validateFields();
                //console.log('Success:', values);
                createConfigmapFunc()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        //创建deployment
        function createConfigmapFunc() {
            let reg = new RegExp("(^[A-Za-z]+=[A-Za-z0-9]+).*")
            if (!reg.test(createConfigmap.createData) && createConfigmap.createData!=='') {
                message.warning("data填写异常，请确认后重新填写")
                return
            }
            // if (!reg.test(createConfigmap.createLabel) && createConfigmap.createLabel!=='') {
            //     message.warning("label填写异常，请确认后重新填写")
            //     return
            // }
            appLoading.value = true
            let data = new Map()
            //let label=new Map()
            let a = (createConfigmap.createData).split(",")
            //let l = (createConfigmap.createLabel).split(",")
            a.forEach(item => {
                let b = item.split("=")
                data[b[0]] = b[1]
            })
            // l.forEach(item => {
            //     let ll = item.split("=")
            //     label[ll[0]] = ll[1]
            // })
            //加载loading动画
            createConfigmapData.params.name = createConfigmap.createName
            createConfigmapData.params.namespace = createConfigmap.createNamespace
            createConfigmapData.params.data=data
            //createConfigmapData.params.label=label
            createConfigmapData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.post(createConfigmapData.url, createConfigmapData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                //重置表单
                resetForm()
                getConfigmapList()
                //关闭抽屉
                createDrawer.value = false
            })
        }
        const namespaceList = ref([])
        function getNamespaceList(val) {
            namespaceList.value = val
        }
        //关闭抽屉
        function onClose () {
            Modal.confirm({
                title: "是否确认关闭? ",
                icon: createVNode(ExclamationCircleOutlined),
                content: createVNode('div', {
                    //style: 'color:red;',
                }),
                cancelText: '取消',
                okText: '确认',
                onOk() {
                    createDrawer.value = false
                    resetForm()  //重置表单
                },
                onCancel() {
                    createDrawer.value = true
                }
            })
        }
        return {
            appLoading,
            pagination,
            columns,
            configmapList,
            configmapDetail,
            contentYaml,
            yamlModal,
            createDrawer,
            cmOptions,
            createConfigmap,
            namespaceList,
            formRef,
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getNamespaceValue,
            getConfigmapList,
            getConfigmapDetail,
            onChange,
            updateConfigmap,
            showConfirm,
            delConfigmap,
            ...toRefs(createConfigmap),
            handleAdd,
            onClose,
            formSubmit,
            getNamespaceList,
        }
    },
})
</script>

<style scoped>
    .configmap-button {
        margin-right: 5px;
        width:77px;
    }
    .ant-form-item {
        margin-bottom: 20px;
    }
</style>