<template>
    <div>
        <MainHead
            searchDescribe="请输入"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @dataList="getConfigmapList"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:12px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="configmapList"
                :pagination="pagination"
                @change="handleTableChange">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'name'">
                        <span style="font-weight: bold;">{{ record.metadata.name }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'labels'">
                        <div v-for="(val, key) in record.metadata.labels" :key="key">
                            <a-popover>
                                <template #content>
                                    <span>{{ key + ":" +val }}</span>
                                </template>
                                <a-tag style="margin-bottom:5px;cursor:pointer;" color="blue">{{ ellipsis(key + ":" +val, 15) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'data'">
                        <a-popover
                            :overlayStyle="{width:'520px'}">
                            <template #content>
                                <div style="width:500px;height:300px;word-break:break-all;overflow-y:auto;">{{ record.data }}</div>
                            </template>
                            <file-text-outlined style="font-size: 15px;" />
                        </a-popover>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag color="gray">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;" class="configmap-button" type="primary" icon="form-outlined" @click="getConfigmapDetail(record)">YML</c-button>
                        <c-button class="configmap-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delConfigmap)">删除</c-button>
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
            @ok="updateConfigmap">
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
                title: 'Configmap名',
                dataIndex: 'name'
            },
            {
                title: '标签',
                dataIndex: 'labels'
            },
            {
                title: 'DATA',
                dataIndex: 'data',
            },
            {
                title: '创建时间',
                dataIndex: 'creationTimestamp'
            },
            {
                title: '操作',
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
            pageSizeOptions: ["10", "20", "50", "100"],
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

        return {
            appLoading,
            pagination,
            columns,
            configmapList,
            configmapDetail,
            contentYaml,
            yamlModal,
            cmOptions,
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
            delConfigmap
        }
    },
})
</script>

<style scoped>
    .configmap-button {
        margin-right: 5px;
    }
    .ant-form-item {
        margin-bottom: 20px;
    }
</style>