<template>
    <div>
        <MainHead
            searchDescribe="请输入"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @dataList="getSecretList"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:12px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="secretList"
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
                    <template v-if="column.dataIndex === 'type'">
                        <span style="color: rgb(84, 138, 238);font-weight:bold;">{{ record.type }} </span>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag color="gray">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;" class="secret-button" type="primary" icon="form-outlined" @click="getSecretDetail(record)">YML</c-button>
                        <c-button class="secret-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delSecret)">删除</c-button>
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
            @ok="updateSecret">
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
                title: 'Secret名',
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
                title: '类型',
                dataIndex: 'type'
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
        const secretList = ref([])
        const secretListData = reactive({
            url : common.k8sSecretList,
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
        const secretDetail =  reactive({
            metadata: {}
        })
        const secretDetailData =  reactive({
            url: common.k8sSecretDetail,
            params: {
                secret_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //yaml更新
        const updateSecretData = reactive({
            url: common.k8sSecretUpdate,
            params: {
                namespace: '',
                content: '',
                cluster: ''
            }
        })
        //删除
        const delSecretData = reactive({
            url: common.k8sSecretDel,
            params: {
                secret_name: '',
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
            getSecretList()
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
        function getSecretList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            secretListData.params.filter_name = searchValue.value
            secretListData.params.namespace = namespaceValue.value
            secretListData.params.cluster = localStorage.getItem('k8s_cluster')
            secretListData.params.page = pagination.currentPage
            secretListData.params.limit = pagination.pagesize
            httpClient.get(secretListData.url, {params: secretListData.params})
            .then(res => {
                //响应成功，获取secret列表和total
                secretList.value = res.data.items
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
        function getSecretDetail(e) {
            appLoading.value = true
            secretDetailData.params.secret_name = e.metadata.name
            secretDetailData.params.namespace = namespaceValue.value
            secretDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(secretDetailData.url, {params: secretDetailData.params})
            .then(res => {
                //secretDetail = Object.assign(secretDetail, res.data)
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
        //更新secret
        function updateSecret() {
            appLoading.value = true
            //将yaml格式的secret对象转为json
            let content = JSON.stringify(transObj(contentYaml.value))
            updateSecretData.params.namespace = namespaceValue.value
            updateSecretData.params.content = content
            updateSecretData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(updateSecretData.url, updateSecretData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getSecretList()
                yamlModal.value = false
            })
        }
        //删除secret
        function delSecret(name) {
            appLoading.value = true
            delSecretData.params.secret_name = name
            delSecretData.params.namespace = namespaceValue.value
            delSecretData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delSecretData.url, {data: delSecretData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getSecretList()
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
            secretList,
            secretDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getNamespaceValue,
            getSecretList,
            getSecretDetail,
            onChange,
            updateSecret,
            showConfirm,
            delSecret
        }
    },
})
</script>

<style scoped>
    .secret-button {
        margin-right: 5px;
    }
    .ant-form-item {
        margin-bottom: 20px;
    }
</style>