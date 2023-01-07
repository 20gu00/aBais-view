<template>
    <div>
        <MainHead
            searchDescribe="关键词"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @namespaceList="getNamespaceList"
            @dataList="getRoleBindingList"
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
                    <template v-if="column.dataIndex === 'saname'">
                        <div v-for="(val, key) in record.subjects " :key="key">
                            <a-popover>
                                <template #content>
                                    <span>{{ val.name }}</span>
                                </template>
                                <a-tag style="margin-bottom:5px;cursor:pointer;font-size:medium" color="blue">{{ ellipsis(key + ":" +val, 15) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag style="color:linen;font-size:medium">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;color:aqua" class="job-button" type="primary" icon="form-outlined" @click="getJobDetail(record)">YAML</c-button>
                        <c-button style="color:crimson" class="job-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delJob)">删除</c-button>
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
            @ok="updateRoleBinding">
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
            title="创建RoleBinding"
            width="800px"
            :footer-style="{ textAlign: 'right' }"
            @close="onClose">
            <br>
            <a-form ref="formRef" :model="createRoleBinding" :labelCol="{style: {width: '30%'}}">
                <a-form-item
                    label="name"
                    name="createName"
                    :rules="[{ required: true, message: '请输入RoleBinding名称' }]">
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
                    name="createApiGroup"
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
                title: 'Job',
                dataIndex: 'name'
            },
            {
                title: 'sa',
                dataIndex: 'saname'
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
        const rolebindingList = ref([])
        const rolebindingListData = reactive({
            url : common.k8sRoleBindingList,
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
        const rolebindingDetailData =  reactive({
            url: common.k8sRoleBindingDetail,
            params: {
                rolebinding_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //yaml更新
        const updateRoleBindingData = reactive({
            url: common.k8sRoleBindingUpdate,
            params: {
                namespace: '',
                content: '',
                cluster: ''
            }
        })
        //删除
        const delRoleBindingData = reactive({
            url: common.k8sRoleBindingDel,
            params: {
                rolebinding_name: '',
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
            getRoleBindingList()
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
        function getRoleBindingList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            rolebindingListData.params.filter_name = searchValue.value
            rolebindingListData.params.namespace = namespaceValue.value
            rolebindingListData.params.cluster = localStorage.getItem('k8s_cluster')
            rolebindingListData.params.page = pagination.currentPage
            rolebindingListData.params.limit = pagination.pagesize
            httpClient.get(rolebindingListData.url, {params: rolebindingListData.params})
            .then(res => {
                //响应成功，获取daemonSet列表和total
                rolebindingList.value = res.data.items
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
        function getRoleBindingDetail(e) {
            appLoading.value = true
            rolebindingDetailData.params.job_name = e.metadata.name
            rolebindingDetailData.params.namespace = namespaceValue.value
            rolebindingDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(rolebindingDetailData.url, {params: rolebindingDetailData.params})
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
        function updateRoleBinding() {
            appLoading.value = true
            //将yaml格式的daemonSet对象转为json
            let content = JSON.stringify(transObj(contentYaml.value))
            updateRoleBindingData.params.namespace = namespaceValue.value
            updateRoleBindingData.params.content = content
            updateRoleBindingData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(updateRoleBindingData.url, updateRoleBindingData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getRoleBindingList()
                yamlModal.value = false
            })
        }
        //删除daemonSet
        function delRoleBinding(name) {
            appLoading.value = true
            delRoleBindingData.params.job_name = name
            delRoleBindingData.params.namespace = namespaceValue.value
            delRoleBindingData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delRoleBindingData.url, {data: delRoleBindingData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getRoleBindingList()
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
        const createRoleBinding = reactive({
            createName: '',
            createNamespace: 'default',
            createRoleName:'',
            createSaName:'',
            createSaNamespace:'',
        })
        const createRoleBindingData = reactive({
            url: common.k8sRoleBindingCreate,
            params: {
                name: '',
                cluster: '',
                namespace:'',
                role_name:'',
                sa_name:'',
                sa_namespace:'',
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
        function createRoleBindingFunc() {
            appLoading.value = true
            //加载loading动画

            createRoleBindingData.params.name = createRoleBinding.createName
            createRoleBindingData.params.namespace = createRoleBinding.createNamespace
            createRoleBindingData.params.role_name = createRoleBinding.createRoleName
            createRoleBindingData.params.sa_name = createRoleBinding.createSaName
            createRoleBindingData.params.sa_namespace = createRoleBinding.sa_namespace
            createRoleBindingData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.post(createRoleBindingData.url, createRoleBindingData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                //重置表单
                resetForm()
                getRoleBindingList()
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
            rolebindingList,
            roleDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            createDrawer,
            createRoleBinding,
            namespaceList,
            formRef,
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getNamespaceValue,
            getRoleBindingList,
            getRoleBindingDetail,
            onChange,
            updateRoleBinding,
            showConfirm,
            delRoleBinding,
            ...toRefs(createRoleBinding),
            handleAdd,
            onClose,
            formSubmit,
            getNamespaceList,
        }
    },
})
</script>

<style scoped>
    .rolebinding-button {
        margin-right: 5px;
        width:77px;
    }
    .ant-form-item {
        margin-bottom: 20px;
    }
</style>