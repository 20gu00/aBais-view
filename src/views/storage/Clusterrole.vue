<template>
    <div>
        <MainHead
            searchDescribe="关键词"
            @searchChange="getSearchValue"
            @dataList="getClusterRoleList"
            @namespaceList="getNamespaceList"
            add
            @addFunc="handleAdd"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:15px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="clusterroleList"
                :pagination="pagination"
                @change="handleTableChange">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'name'">
                        <span style="font-weight: bold;color:coral;font-size:medium">{{ record.metadata.name }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'rule'">
                        <a-popover
                            :overlayStyle="{width:'520px'}">
                            <template #content>
                                <div style="color:aquamarine; width:500px;height:500px;word-break:break-all;overflow-y:auto;">{{ record.rules }}</div>
                            </template>
                            <file-text-outlined style="font-size: 15px;" />
                        </a-popover>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag style="color:linen;font-size:medium">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;color:aqua" class="clusterrole-button" type="primary" icon="form-outlined" @click="getClusterRoleDetail(record)">YAML</c-button>
                        <c-button style="color:crimson" class="clusterrole-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delClusterRole)">删除</c-button>
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
            @ok="updateClusterRole">
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
            title="创建cluster role"
            width="800px"
            :footer-style="{ textAlign: 'right' }"
            @close="onClose">
            <br>
            <a-form ref="formRef" :model="createClusterRole" :labelCol="{style: {width: '30%'}}">
                <a-form-item
                    label="name"
                    name="createName"
                    :rules="[{ required: true, message: '请输入cluster role名称' }]">
                    <a-input style="color:khaki" v-model:value="createName" />
                </a-form-item>
                <a-form-item
                    label="apiGroup"
                    name="createApiGroup"
                    :rules="[{ required: true, message: '请输入apiGroup' }]">
                    <a-input style="color:khaki" v-model:value="createApiGroup" placeholder="core|apps" />
                </a-form-item>
                <a-form-item
                    label="resources"
                    name="createResources"
                    :rules="[{ required: true, message: '请输入resources' }]">
                    <a-input style="color:khaki" v-model:value="createResources" placeholder="deployments|replicasets|pods" />
                </a-form-item>
                <a-form-item
                    label="verbs"
                    name="createVerbs"
                    :rules="[{ required: true, message: '请输入verbs' }]">
                    <a-input style="color:khaki" v-model:value="createVerbs" placeholder="get|list|watch|create|update|patch|delete或者*"/>
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
import { createVNode, reactive, ref ,toRefs} from 'vue';
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
                title: 'cluster role',
                dataIndex: 'name'
            },
            {
                title: 'rule',
                dataIndex: 'rule'
            },
            {
                title: '创建时间',
                dataIndex: 'creationTimestamp'
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
        //列表
        const clusterroleList = ref([])
        const clusterroleListData = reactive({
            url : common.k8sClusterRoleList,
            params: {
                filter_name: '',
                cluster: '',
                page: 1,
                limit: 10
            }
        })
        //详情
        const contentYaml = ref('')
        const yamlModal = ref(false)
        const cmOptions = common.cmOptions
        const clusterroleDetail =  reactive({
            metadata: {}
        })
        const clusterroleDetailData =  reactive({
            url: common.k8sClusterRoleDetail,
            params: {
                clusterrole_name: '',
                cluster: ''
            }
        })
        //删除
        const delclusterroleData = reactive({
            url: common.k8sClusterRoleDel,
            params: {
                clusterrole_name: '',
                //pv: '',
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
            getClusterRoleList()
        }
        function getSearchValue(val) {
            searchValue.value = val
        }
        //编辑器内容变化时触发的方式,用于将更新的内容复制到变量中
        function onChange(val) {
            contentYaml.value = val
        }
        //列表
        function getClusterRoleList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            clusterroleListData.params.filter_name = searchValue.value
            clusterroleListData.params.cluster = localStorage.getItem('k8s_cluster')
            clusterroleListData.params.page = pagination.currentPage
            clusterroleListData.params.limit = pagination.pagesize
            httpClient.get(clusterroleListData.url, {params: clusterroleListData.params})
            .then(res => {
                //响应成功，获取pv列表和total
                clusterroleList.value = res.data.items
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
        function getClusterRoleDetail(e) {
            appLoading.value = true
            clusterroleDetailData.params.clusterrole_name = e.metadata.name
            clusterroleDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(clusterroleDetailData.url, {params: clusterroleDetailData.params})
            .then(res => {
                //pvDetail = Object.assign(pvDetail, res.data)
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
        //删除pv
        function delClusterRole(name) {
            appLoading.value = true
            delclusterroleData.params.clusterrole_name = name
            delclusterroleData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delclusterroleData.url, {data: delclusterroleData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getClusterRoleList()
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

        const updateClusterRoleData = reactive({
            url: common.k8sClusterRoleUpdate,
            params: {
                //namespace: '',
                content: '',
                cluster: ''
            }
        })
        //更新daemonSet
        function updateClusterRole() {
            appLoading.value = true
            //将yaml格式的daemonSet对象转为json
            let content = JSON.stringify(transObj(contentYaml.value))
            //updateClusterRoleData.params.namespace = namespaceValue.value
            updateClusterRoleData.params.content = content
            updateClusterRoleData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(updateClusterRoleData.url, updateClusterRoleData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getClusterRoleList()
                yamlModal.value = false
            })
        }
        //创建
        const formRef = ref()
        const createDrawer = ref(false)
        const createClusterRole = reactive({
            createName: '',
            createApiGroup:'',
            createResources:'',
            createVerbs:'',
        })
        const createClusterRoleData = reactive({
            url: common.k8sClusterRoleCreate,
            params: {
                name: '',
                cluster: '',
                api_group:'',
                resources:'',
                verbs:'',
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
                createClusterRoleFunc()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        //创建deployment
        function createClusterRoleFunc() {
            //加载loading动画
            appLoading.value = true
            createClusterRoleData.params.name = createClusterRole.createName
            createClusterRoleData.params.api_group = createClusterRole.createApiGroup
            createClusterRoleData.params.resources = createClusterRole.createResources
            createClusterRoleData.params.verbs = createClusterRole.createVerbs
            createClusterRoleData.params.cluster = localStorage.getItem('k8s_cluster')
            //注意类型对应
            httpClient.post(createClusterRoleData.url, createClusterRoleData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                //重置表单
                resetForm()
                getClusterRoleList()
                //关闭抽屉
                createDrawer.value = false
            })
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
            clusterroleList,
            clusterroleDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            createDrawer,
            createClusterRole,
            formRef,
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            updateClusterRole,
            getClusterRoleList,
            getClusterRoleDetail,
            onChange,
            delClusterRole,
            showConfirm,
            ...toRefs(createClusterRole),
            handleAdd,
            onClose,
            formSubmit
        }
    },
})
</script>

<style scoped>
    .clusterrole-button {
        margin-right: 5px;
        width:77px;
    }
    .ant-form-item {
        margin-bottom: 20px;
    }
    .success-status {
        color: rgb(27, 202, 21);
    }
    .warning-status {
        color: rgb(233, 200, 16);
    }
    .error-status {
        color: rgb(226, 23, 23);
    }
</style>