<template>
    <div>
        <MainHead
            searchDescribe="关键词"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @namespaceList="getNamespaceList"
            @dataList="getSaList"
            add
            @addFunc="handleAdd"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:15px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="saList"
                :pagination="pagination"
                @change="handleTableChange">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'name'">
                        <span style="font-weight: bold;color:coral;font-size:medium">{{ record.metadata.name }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'secret'">
                        <div v-for="(val, key) in record.secrets " :key="key">
                            <a-popover>
                                <template #content>
                                    <span>{{ val.name }}</span>
                                </template>
                                <a-tag style="margin-bottom:5px;cursor:pointer;font-size:medium" color="blue">{{ ellipsis(val.name, 15) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag style="color:linen;font-size:medium">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;color:aqua" class="sa-button" type="primary" icon="form-outlined" @click="getSaDetail(record)">YAML</c-button>
                        <c-button style="color:crimson" class="sa-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delSa)">删除</c-button>
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
            @ok="updateSa">
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
            title="创建Sa"
            width="800px"
            :footer-style="{ textAlign: 'right' }"
            @close="onClose">
            <br>
            <a-form ref="formRef" :model="createSa" :labelCol="{style: {width: '30%'}}">
                <a-form-item
                    label="name"
                    name="createName"
                    :rules="[{ required: true, message: '请输入Service Account名称' }]">
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
                title: 'service account',
                dataIndex: 'name'
            },
            {
                title: 'secret',
                dataIndex: 'secret'
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
        const saList = ref([])
        const saListData = reactive({
            url : common.k8sSaList,
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
        const saDetail =  reactive({
            metadata: {}
        })
        const saDetailData =  reactive({
            url: common.k8sSaDetail,
            params: {
                sa_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //yaml更新
        const updateSaData = reactive({
            url: common.k8sSaUpdate,
            params: {
                namespace: '',
                content: '',
                cluster: ''
            }
        })
        //删除
        const delSaData = reactive({
            url: common.k8sSaDel,
            params: {
                sa_name: '',
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
            getSaList()
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
        function getSaList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            saListData.params.filter_name = searchValue.value
            saListData.params.namespace = namespaceValue.value
            saListData.params.cluster = localStorage.getItem('k8s_cluster')
            saListData.params.page = pagination.currentPage
            saListData.params.limit = pagination.pagesize
            httpClient.get(saListData.url, {params: saListData.params})
            .then(res => {
                //响应成功，获取daemonSet列表和total
                saList.value = res.data.items
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
        function getSaDetail(e) {
            appLoading.value = true
            saDetailData.params.sa_name = e.metadata.name
            saDetailData.params.namespace = namespaceValue.value
            saDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(saDetailData.url, {params: saDetailData.params})
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
        function updateSa() {
            appLoading.value = true
            //将yaml格式的daemonSet对象转为json
            let content = JSON.stringify(transObj(contentYaml.value))
            updateSaData.params.namespace = namespaceValue.value
            updateSaData.params.content = content
            updateSaData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(updateSaData.url, updateSaData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getSaList()
                yamlModal.value = false
            })
        }
        //删除daemonSet
        function delSa(name) {
            appLoading.value = true
            delSaData.params.sa_name = name
            delSaData.params.namespace = namespaceValue.value
            delSaData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delSaData.url, {data: delSaData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getSaList()
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
        const createSa = reactive({
            createName: '',
            createNamespace: 'default',
        })
        const createSaData = reactive({
            url: common.k8sSaCreate,
            params: {
                name: '',
                cluster: '',
                namespace:'',
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
                createSaFunc()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        //创建deployment
        function createSaFunc() {
            appLoading.value = true
            //加载loading动画

            createSaData.params.name = createSa.createName
            createSaData.params.namespace = createSa.createNamespace
            createSaData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.post(createSaData.url, createSaData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                //重置表单
                resetForm()
                getSaList()
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
            saList,
            saDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            createDrawer,
            createSa,
            namespaceList,
            formRef,
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getNamespaceValue,
            getSaList,
            getSaDetail,
            onChange,
            updateSa,
            showConfirm,
            delSa,
            ...toRefs(createSa),
            handleAdd,
            onClose,
            formSubmit,
            getNamespaceList,
        }
    },
})
</script>

<style scoped>
    .sa-button {
        margin-right: 5px;
        width:77px;
    }
    .ant-form-item {
        margin-bottom: 20px;
    }
</style>