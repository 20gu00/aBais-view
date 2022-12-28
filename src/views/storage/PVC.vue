<template>
    <div>
        <MainHead
            searchDescribe="请输入"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @dataList="getPvcList"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:12px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="pvcList"
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
                    <template v-if="column.dataIndex === 'status'">
                        <span :class="[record.status.phase === 'Bound' ? 'success-status' : 'error-status']">{{ record.status.phase }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'storage'">
                        <span>{{ record.status.capacity.storage }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'accessMode'">
                        <span style="color: rgb(84, 138, 238);font-weight:bold;">{{ record.status.accessModes[0] }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'storageclass'">
                        <span>{{ record.spec.storageClassName }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag color="gray">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;" class="pvc-button" type="primary" icon="form-outlined" @click="getPvcDetail(record)">YML</c-button>
                        <c-button class="pvc-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delPvc)">删除</c-button>
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
            @ok="updatePvc">
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
                title: 'Pvc名',
                dataIndex: 'name'
            },
            {
                title: '标签',
                dataIndex: 'labels'
            },
            {
                title: '状态',
                dataIndex: 'status'
            },
            {
                title: '容量',
                dataIndex: 'storage',
            },
            {
                title: '访问模式',
                dataIndex: 'accessMode',
            },
            {
                title: 'StorageClass',
                dataIndex: 'storageclass',
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
        const pvcList = ref([])
        const pvcListData = reactive({
            url : common.k8sPvcList,
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
        const pvcDetail =  reactive({
            metadata: {}
        })
        const pvcDetailData =  reactive({
            url: common.k8sPvcDetail,
            params: {
                pvc_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //yaml更新
        const updatePvcData = reactive({
            url: common.k8sPvcUpdate,
            params: {
                namespace: '',
                content: '',
                cluster: ''
            }
        })
        //删除
        const delPvcData = reactive({
            url: common.k8sPvcDel,
            params: {
                pvc_name: '',
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
            getPvcList()
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
        function getPvcList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            pvcListData.params.filter_name = searchValue.value
            pvcListData.params.namespace = namespaceValue.value
            pvcListData.params.cluster = localStorage.getItem('k8s_cluster')
            pvcListData.params.page = pagination.currentPage
            pvcListData.params.limit = pagination.pagesize
            httpClient.get(pvcListData.url, {params: pvcListData.params})
            .then(res => {
                //响应成功，获取pvc列表和total
                pvcList.value = res.data.items
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
        function getPvcDetail(e) {
            appLoading.value = true
            pvcDetailData.params.pvc_name = e.metadata.name
            pvcDetailData.params.namespace = namespaceValue.value
            pvcDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(pvcDetailData.url, {params: pvcDetailData.params})
            .then(res => {
                //pvcDetail = Object.assign(pvcDetail, res.data)
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
        //更新pvc
        function updatePvc() {
            appLoading.value = true
            //将yaml格式的pvc对象转为json
            let content = JSON.stringify(transObj(contentYaml.value))
            updatePvcData.params.namespace = namespaceValue.value
            updatePvcData.params.content = content
            updatePvcData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(updatePvcData.url, updatePvcData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getPvcList()
                yamlModal.value = false
            })
        }
        //删除pvc
        function delPvc(name) {
            appLoading.value = true
            delPvcData.params.pvc_name = name
            delPvcData.params.namespace = namespaceValue.value
            delPvcData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delPvcData.url, {data: delPvcData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getPvcList()
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
            pvcList,
            pvcDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getNamespaceValue,
            getPvcList,
            getPvcDetail,
            onChange,
            updatePvc,
            showConfirm,
            delPvc
        }
    },
})
</script>

<style scoped>
    .pvc-button {
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