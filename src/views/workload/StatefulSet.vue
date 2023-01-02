<template>
    <div>
        <MainHead
            searchDescribe="关键词"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @dataList="getStatefulSetList"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:15px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="statefulSetList"
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
                                <a-tag style="margin-bottom:5px;cursor:pointer;font-size:medium;color:greenyellow" color="blue">{{ ellipsis(key + ":" +val, 15) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'containers'">
                        <span>{{ record.status.currentReplicas>0?record.status.currentReplicas:0  }} / {{ record.spec.replicas>0?record.spec.replicas:0 }} </span>
                    </template>
                    <template v-if="column.dataIndex === 'image'">
                        <div v-for="(val, key) in record.spec.template.spec.containers" :key="key">
                            <a-popover>
                                <template #content>
                                    <span>{{ val.image }}</span>
                                </template>
                                <a-tag style="margin-bottom:5px;cursor:pointer;font-size:medium;color:gold" color="geekblue">{{ ellipsis(val.image.split('/').pop() ? val.image.split('/').pop() : val.image, 15 ) }}</a-tag>
                            </a-popover>
                        </div>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag style="color:linen;font-size:medium">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;color:aqua" class="statefulSet-button" type="primary" icon="form-outlined" @click="getStatefulSetDetail(record)">YAML</c-button>
                        <c-button style="color:crimson" class="statefulSet-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delStatefulSet)">删除</c-button>
                    </template>
                </template>
            </a-table>
        </a-card>
        <!-- 展示YAML信息的弹框 visible显示 设置了默认值false-->
        <a-modal
            v-model:visible="yamlModal"
            title="YAML信息"
            :confirm-loading="appLoading"
            cancelText="取消"
            width="900px"
            okText="更新"
            @ok="updateStatefulSet">
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
                title: 'StatefulSet',
                dataIndex: 'name'
            },
            {
                title: 'label',
                dataIndex: 'labels'
            },
            {
                title: 'pod组',
                dataIndex: 'containers',
            },
            {
                title: 'image',
                dataIndex: 'image'
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
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: total => `共 ${total} 条`
        })
        //列表
        const statefulSetList = ref([])
        const statefulSetListData = reactive({
            url : common.k8sStatefulSetList,
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
        const statefulSetDetail =  reactive({
            metadata: {}
        })
        const statefulSetDetailData =  reactive({
            url: common.k8sStatefulSetDetail,
            params: {
                statefulset_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //yaml更新
        const updateStatefulSetData = reactive({
            url: common.k8sStatefulSetUpdate,
            params: {
                namespace: '',
                content: '',
                cluster: ''
            }
        })
        //删除
        const delStatefulSetData = reactive({
            url: common.k8sStatefulSetDel,
            params: {
                statefulset_name: '',
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
            getStatefulSetList()
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
        function getStatefulSetList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            statefulSetListData.params.filter_name = searchValue.value
            statefulSetListData.params.namespace = namespaceValue.value
            statefulSetListData.params.cluster = localStorage.getItem('k8s_cluster')
            statefulSetListData.params.page = pagination.currentPage
            statefulSetListData.params.limit = pagination.pagesize
            httpClient.get(statefulSetListData.url, {params: statefulSetListData.params})
            .then(res => {
                //响应成功，获取statefulSet列表和total
                statefulSetList.value = res.data.items
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
        function getStatefulSetDetail(e) {
            appLoading.value = true
            statefulSetDetailData.params.statefulset_name = e.metadata.name
            statefulSetDetailData.params.namespace = namespaceValue.value
            statefulSetDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(statefulSetDetailData.url, {params: statefulSetDetailData.params})
            .then(res => {
                //statefulSetDetail = Object.assign(statefulSetDetail, res.data)
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
        //更新statefulSet
        function updateStatefulSet() {
            appLoading.value = true
            //将yaml格式的statefulSet对象转为json
            let content = JSON.stringify(transObj(contentYaml.value))
            updateStatefulSetData.params.namespace = namespaceValue.value
            updateStatefulSetData.params.content = content
            updateStatefulSetData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.put(updateStatefulSetData.url, updateStatefulSetData.params)
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getStatefulSetList()
                yamlModal.value = false
            })
        }
        //删除statefulSet
        function delStatefulSet(name) {
            appLoading.value = true
            delStatefulSetData.params.statefulSet_name = name
            delStatefulSetData.params.namespace = namespaceValue.value
            delStatefulSetData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delStatefulSetData.url, {data: delStatefulSetData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getStatefulSetList()
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
                //关闭
                cancelText: '取消',
                okText: '确认',
                onOk() {
                    fn(res)
                },
                // onCancel() {
                //     console.log('Cancel'); f12
                // }
            })
        }

        return {
            appLoading,
            pagination,
            columns,
            statefulSetList,
            statefulSetDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getNamespaceValue,
            getStatefulSetList,
            getStatefulSetDetail,
            onChange,
            updateStatefulSet,
            showConfirm,
            delStatefulSet
        }
    },
})
</script>


<style scoped>
    .statefulSet-button {
        margin-right: 5px;
        width:77px;

    }
    .ant-form-item {
        margin-bottom: 20px;
    }
</style>