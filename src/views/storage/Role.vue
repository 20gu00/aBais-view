<template>
    <div>
        <MainHead
            searchDescribe="关键词"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @namespaceList="getNamespaceList"
            @dataList="getRoleList"
            add
            @addFunc="handleAdd"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:15px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="roleList"
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
                        <c-button style="margin-bottom:5px;color:aqua" class="role-button" type="primary" icon="form-outlined" @click="getRoleDetail(record)">YAML</c-button>
                        <c-button style="color:crimson" class="role-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delRole)">删除</c-button>
                    </template>
                </template>
            </a-table>
        </a-card>
        <!-- 展示YAML信息的弹框 modal对话框-->
        <a-modal
            width="900px"
            v-model:visible="yamlModal"
            title="YAML信息"
            :confirm-loading="appLoading"
            cancelText="取消"
            okText="更新"
            @ok="updateRole">
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
            title="创建Role"
            width="800px"
            :footer-style="{ textAlign: 'right' }"
            @close="onClose">
            <br>
            <a-form ref="formRef" :model="createRole" :labelCol="{style: {width: '30%'}}">
                <a-form-item
                    label="name"
                    name="createName"
                    :rules="[{ required: true, message: '请输入Role名称' }]">
                    <a-input style="color:khaki" v-model:value="createName" />
                </a-form-item>
                <a-form-item
                    style="color:khaki"
                    label="namespace"
                    name="createNamespace"
                    :rules="[{ required: true, message: '请选择namespace' }]">
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
                    label="apiGroup"
                    name="createApiGroups"
                    :rules="[{ required: true, message: '请输入apiGroup' }]">
                    <a-input style="color:khaki" v-model:value="createApiGroups" placeholder="core|apps" />
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
            <template #footer>
                <a-button style="margin-right: 8px" @click="onClose()">取消</a-button>
                <a-button type="primary" @click="formSubmit()">确定</a-button>
            </template>
        </a-drawer>
    </div>
</template>

<script>
//导入方法
import { createVNode, reactive, ref,toRefs } from 'vue';
//类似别名
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
        //column
        const columns = ref([
            {
                title: 'Role',
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
        const roleList = ref([])
        const roleListData = reactive({
            url : common.k8sRoleList,
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

        const namespaceList = ref([])
        const roleDetail =  reactive({
            metadata: {}
        })
        const roleDetailData =  reactive({
            url: common.k8sRoleDetail,
            params: {
                role_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //yaml更新
        const updateRoleData = reactive({
            url: common.k8sRoleUpdate,
            params: {
                namespace: '',
                content: '',
                cluster: ''
            }
        })
        //删除
        const delRoleData = reactive({
            url: common.k8sRoleDel,
            params: {
                role_name: '',
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
            getRoleList()
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
        function getNamespaceList(val) {
            namespaceList.value = val
        }
        //列表
        function getRoleList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            roleListData.params.filter_name = searchValue.value
            roleListData.params.namespace = namespaceValue.value
            roleListData.params.cluster = localStorage.getItem('k8s_cluster')
            roleListData.params.page = pagination.currentPage
            roleListData.params.limit = pagination.pagesize
            httpClient.get(roleListData.url, {params: roleListData.params})
            .then(res => {
                //响应成功，获取daemonSet列表和total
                roleList.value = res.data.items
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
        function getRoleDetail(e) {
            appLoading.value = true
            roleDetailData.params.role_name = e.metadata.name
            roleDetailData.params.namespace = namespaceValue.value
            roleDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(roleDetailData.url, {params: roleDetailData.params})
            .then(res => {
                //daemonSetDetail = Object.assign(daemonSetDetail, res.data)
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
        //更新daemonSet
        function updateRole() {
            appLoading.value = true
            //将yaml格式的daemonSet对象转为json
            let content = JSON.stringify(transObj(contentYaml.value))
            updateRoleData.params.namespace = namespaceValue.value
            updateRoleData.params.content = content
            updateRoleData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(updateRoleData.url, updateRoleData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getRoleList()
                yamlModal.value = false
            })
        }
        //删除daemonSet
        function delRole(name) {
            appLoading.value = true
            delRoleData.params.role_name = name
            delRoleData.params.namespace = namespaceValue.value
            delRoleData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delRoleData.url, {data: delRoleData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getRoleList()
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
        const createRole = reactive({
            createName: '',
            createNamespace: 'default',
            createApiGroups:'',
            createResources:'',
            createVerbs:'',
        })
        const createRoleData = reactive({
            url: common.k8sRoleCreate,
            params: {
                name: '',
                cluster: '',
                namespace:'',
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
                createRoleFunc()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        //创建deployment
        function createRoleFunc() {
            appLoading.value = true
            //加载loading动画

            createRoleData.params.name = createRole.createName
            createRoleData.params.namespace = createRole.createNamespace
            createRoleData.params.api_group = createRole.createApiGroups
            createRoleData.params.resources = createRole.createResources
            createRoleData.params.verbs = createRole.createVerbs
            createRoleData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.post(createRoleData.url, createRoleData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                //重置表单
                resetForm()
                getRoleList()
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
            roleList,
            roleDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            createDrawer,
            createRole,
            namespaceList,
            formRef,
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getNamespaceValue,
            getRoleList,
            getRoleDetail,
            onChange,
            updateRole,
            showConfirm,
            delRole,
            ...toRefs(createRole),
            handleAdd,
            onClose,
            formSubmit,
            getNamespaceList,
        }
    },
})
</script>

<style scoped>
    .role-button {
        margin-right: 5px;
        width:77px;
    }
    .ant-form-item {
        margin-bottom: 20px;
    }
</style>