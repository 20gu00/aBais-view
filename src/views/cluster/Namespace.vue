<template>
    <div>
        <!--main的头部-->
        <MainHead
            searchDescribe="关键词"
            @searchChange="getSearchValue"
            @dataList="getNamespaceList"/>
        <!--通用卡片容器，可承载文字、列表、图片、段落-->
        <!--bodyStyle 内容区域自定义样式 css-->
       <a-card :bodyStyle="{padding: '10px'}">
        <!--表格 用于展示多条结构类似的数据，可对数据进行排序、筛选、对比或 其他自定义操作-->
            <a-table
                style="font-size:15px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="namespaceList"
                :pagination="pagination"
                @change="handleTableChange">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'name'">
                        <span style="font-weight: bold;color:coral;font-size:medium">{{ record.metadata.name }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'labels'">
                        <div v-for="(val, key) in record.metadata.labels" :key="key">
                            <a-popover>
                                <template #content>
                                    <span>{{ key + ":" +val }}</span>
                                </template>
                                <a-tag style="width:310px; margin-bottom:5px;cursor:pointer;font-size:medium" color="blue">{{ ellipsis(key + ":" +val, 40) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'status'">
                        <span :class="[record.status.phase === 'Active' ? 'success-status' : 'error-status']">{{ record.status.phase }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag style="color:linen;font-size:medium">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;color:aqua" class="namespace-button" type="primary" icon="form-outlined" @click="getNamespaceDetail(record)">YAML</c-button>
                        <c-button satyle="color:crimson" class="namespace-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delNamespace)">删除</c-button>
                    </template>
                </template>
            </a-table>
        </a-card>
        <!-- 展示YAML信息的弹框 -->
        <a-modal
            v-model:visible="yamlModal"
            title="YAML信息"
            :confirm-loading="appLoading"
            cancelText="取消"
            okText="更新"
            :ok-button-props="{ disabled: true }">
            <!-- codemirror编辑器 -->
            <!-- border 带边框 -->
            <!-- options  编辑器配置 -->
            <!-- change 编辑器中的内容变化时触发 -->
            <codemirror
                :value="contentYaml"
                border
                :options="cmOptions"
                height="500"
                style="font-size:14px;"
                @change="onChange"
            ></codemirror>
        </a-modal>
    </div>
</template>

<script>
import { createVNode, reactive, ref } from 'vue';
import MainHead from '@/components/MainHead';
import httpClient from '@/request';
import common from "@/config";
import { message } from 'ant-design-vue';
//import yaml2obj from 'js-yaml';
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
                title: 'Namespace',
                dataIndex: 'name'
            },
            {
                title: 'label',
                dataIndex: 'labels',
                width:350
            },
            {
                title: 'status',
                dataIndex: 'status',
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
        const namespaceList = ref([])
        const namespaceListData = reactive({
            url : common.k8sNamespaceList,
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
        const namespaceDetail =  reactive({
            metadata: {}
        })
        const namespaceDetailData =  reactive({
            url: common.k8sNamespaceDetail,
            params: {
                namespace_name: '',
                cluster: ''
            }
        })
        //删除
        const delNamespaceData = reactive({
            url: common.k8sNamespaceDel,
            params: {
                namespace_name: '',
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
        // function transObj(content) {
        //     return yaml2obj.load(content)
        // }
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
            getNamespaceList()
        }
        function getSearchValue(val) {
            searchValue.value = val
        }
        //编辑器内容变化时触发的方式,用于将更新的内容复制到变量中
        function onChange(val) {
            contentYaml.value = val
        }
        //列表
        function getNamespaceList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            namespaceListData.params.filter_name = searchValue.value
            namespaceListData.params.cluster = localStorage.getItem('k8s_cluster')
            namespaceListData.params.page = pagination.currentPage
            namespaceListData.params.limit = pagination.pagesize
            httpClient.get(namespaceListData.url, {params: namespaceListData.params})
            .then(res => {
                //响应成功，获取namespace列表和total
                namespaceList.value = res.data.items
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
        function getNamespaceDetail(e) {
            appLoading.value = true
            namespaceDetailData.params.namespace_name = e.metadata.name
            namespaceDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(namespaceDetailData.url, {params: namespaceDetailData.params})
            .then(res => {
                //namespaceDetail = Object.assign(namespaceDetail, res.data)
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
        //删除namespace
        function delNamespace(name) {
            appLoading.value = true
            delNamespaceData.params.namespace_name = name
            delNamespaceData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delNamespaceData.url, {data: delNamespaceData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getNamespaceList()
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

        return {
            appLoading,
            pagination,
            columns,
            namespaceList,
            namespaceDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getNamespaceList,
            getNamespaceDetail,
            onChange,
            delNamespace,
            showConfirm
        }
    },
})
</script>

<style scoped>
    .namespace-button {
        margin-right: 5px;
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