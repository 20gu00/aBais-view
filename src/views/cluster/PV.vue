<template>
    <div>
        <MainHead
            searchDescribe="关键词"
            @searchChange="getSearchValue"
            @dataList="getPvList"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:12px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="pvList"
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
                        <span>{{ record.spec.capacity.storage }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'accessMode'">
                        <span style="color: rgb(84, 138, 238);font-weight:bold;">{{ record.spec.accessModes[0] }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'pvc'">
                        <span>{{ record.spec.claimRef.name }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'creationTimestamp'">
                        <a-tag color="gray">{{ timeTrans(record.metadata.creationTimestamp) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;" class="pv-button" type="primary" icon="form-outlined" @click="getPvDetail(record)">YML</c-button>
                        <c-button class="pv-button" type="error" icon="delete-outlined" @click="showConfirm('删除', record.metadata.name, delPv)">删除</c-button>
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
                title: 'Pv名',
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
                title: 'PVC',
                dataIndex: 'pvc',
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
        const pvList = ref([])
        const pvListData = reactive({
            url : common.k8sPvList,
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
        const pvDetail =  reactive({
            metadata: {}
        })
        const pvDetailData =  reactive({
            url: common.k8sPvDetail,
            params: {
                pv_name: '',
                cluster: ''
            }
        })
        //删除
        const delPvData = reactive({
            url: common.k8sPvDel,
            params: {
                pv_name: '',
                pv: '',
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
            getPvList()
        }
        function getSearchValue(val) {
            searchValue.value = val
        }
        //编辑器内容变化时触发的方式,用于将更新的内容复制到变量中
        function onChange(val) {
            contentYaml.value = val
        }
        //列表
        function getPvList() {
            appLoading.value = true
            if (searchValue.value) {
                pagination.currentPage = 1
            }
            pvListData.params.filter_name = searchValue.value
            pvListData.params.cluster = localStorage.getItem('k8s_cluster')
            pvListData.params.page = pagination.currentPage
            pvListData.params.limit = pagination.pagesize
            httpClient.get(pvListData.url, {params: pvListData.params})
            .then(res => {
                //响应成功，获取pv列表和total
                pvList.value = res.data.items
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
        function getPvDetail(e) {
            appLoading.value = true
            pvDetailData.params.pv_name = e.metadata.name
            pvDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(pvDetailData.url, {params: pvDetailData.params})
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
        function delPv(name) {
            appLoading.value = true
            delPvData.params.pv_name = name
            delPvData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delPvData.url, {data: delPvData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getPvList()
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
            pvList,
            pvDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getPvList,
            getPvDetail,
            onChange,
            delPv,
            showConfirm
        }
    },
})
</script>

<style scoped>
    .pv-button {
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