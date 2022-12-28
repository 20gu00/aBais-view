<template>
    <div>
        <MainHead
            searchDescribe="请输入"
            @searchChange="getSearchValue"
            namespace
            @namespaceChange="getNamespaceValue"
            @dataList="getReleaseList"/>
       <a-card :bodyStyle="{padding: '10px'}">
            <a-table
                style="font-size:12px;" 
                :loading="appLoading" 
                :columns="columns" 
                :dataSource="releaseList"
                :pagination="pagination"
                @change="handleTableChange">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.dataIndex === 'name'">
                        <span style="font-weight: bold;">{{ record.name }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'status'">
                        <div :class="{'succ-dot':record.status == 'deployed', 'err-dot':record.status == 'failed', 'warn-dot':record.status != 'deployed' && record.status.phase != 'failed'}"></div>
                        <span :class="{'succ-state':record.status == 'deployed', 'err-state':record.status == 'failed', 'warn-status':record.status != 'deployed' && record.status.phase != 'failed'}">{{ record.status }} </span>
                    </template>
                    <template v-if="column.dataIndex === 'chart'">
                        <span style="color: rgb(84, 138, 238);">{{ record.chart }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'chart_version'">
                        <a-tag color="geekblue">{{ record.chart_version }}</a-tag>
                    </template>
                    <template v-if="column.dataIndex === 'updated'">
                        <a-tag color="gray">{{ timeTrans(record.updated) }}</a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                        <c-button style="margin-bottom:5px;" class="release-button" type="primary" icon="form-outlined" @click="getReleaseDetail(record)">Manifest</c-button>
                        <c-button class="release-button" type="error" icon="delete-outlined" @click="showConfirm('卸载', record.name, delRelease)">卸载</c-button>
                    </template>
                </template>
            </a-table>
        </a-card>
        <!-- 展示YAML信息的弹框 -->
        <a-modal
            v-model:visible="yamlModal"
            title="Manifest"
            :confirm-loading="appLoading"
            cancelText="取消"
            okText="更新"
            :ok-button-props="{ disabled: true }">
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
//import json2yaml from 'json2yaml';
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
                title: 'Release名',
                dataIndex: 'name'
            },
            {
                title: '状态',
                dataIndex: 'status'
            },
            {
                title: 'Chart',
                dataIndex: 'chart'
            },
            {
                title: 'Chart版本',
                dataIndex: 'chart_version'
            },
            {
                title: 'Revision',
                dataIndex: 'revision'
            },
            {
                title: '更新时间',
                dataIndex: 'updated'
            },
            {
                title: '操作',
                key: 'action',
                fixed: 'right',
                width: 220
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
        const releaseList = ref([])
        const releaseListData = reactive({
            url : common.helmReleaseList,
            params: {
                filter_name: '',
                namespace: '',
                cluster: ''
            }
        })
        //详情
        const contentYaml = ref('')
        const yamlModal = ref(false)
        const cmOptions = common.cmOptions
        const releaseDetail =  reactive({
            metadata: {}
        })
        const releaseDetailData =  reactive({
            url: common.helmReleaseDetail,
            params: {
                release: '',
                namespace: '',
                cluster: ''
            }
        })
        //卸载
        const delReleaseData = reactive({
            url: common.helmReleaseUninstall,
            params: {
                release: '',
                namespace: '',
                cluster: ''
            }
        })

        //【方法】
        //json转yaml方法
        // function transYaml(content) {
        //     return json2yaml.stringify(content)
        // }
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
        function getReleaseList() {
            appLoading.value = true
            if (searchValue.value) {pagination.currentPage = 1}
            releaseListData.params.filter_name = searchValue.value
            releaseListData.params.namespace = namespaceValue.value
            releaseListData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(releaseListData.url, {params: releaseListData.params})
            .then(res => {
                //响应成功，获取release列表和total
                releaseList.value = res.data.items
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
        function getReleaseDetail(e) {
            appLoading.value = true
            releaseDetailData.params.release = e.name
            releaseDetailData.params.namespace = namespaceValue.value
            releaseDetailData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.get(releaseDetailData.url, {params: releaseDetailData.params})
            .then(res => {
                contentYaml.value = res.data.manifest
                yamlModal.value = true
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                appLoading.value = false
            })
        }
        //卸载release
        function delRelease(name) {
            appLoading.value = true
            delReleaseData.params.release = name
            delReleaseData.params.namespace = namespaceValue.value
            delReleaseData.params.cluster = localStorage.getItem('k8s_cluster')
            httpClient.delete(delReleaseData.url, {data: delReleaseData.params})
            .then(res => {
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
            .finally(() => {
                getReleaseList()
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
            releaseList,
            releaseDetail,
            contentYaml,
            yamlModal,
            cmOptions,
            timeTrans,
            ellipsis,
            handleTableChange,
            getSearchValue,
            getNamespaceValue,
            getReleaseList,
            getReleaseDetail,
            onChange,
            showConfirm,
            delRelease
        }
    },
})
</script>

<style scoped>
    .release-button {
        margin-right: 5px;
    }
    .ant-form-item {
        margin-bottom: 20px;
    }
    .succ-dot{
        display:inline-block;
        width: 7px;
        height:7px;
        background:#86c169;
        border-radius:50%;
        border:1px solid #88c06c;
        margin-right: 10px;
    }
    .warn-dot{
        display:inline-block;
        width: 7px;
        height:7px;
        background: rgb(233, 200, 16);
        border-radius:50%;
        border:1px solid rgb(233, 200, 16);
        margin-right: 10px;
    }
    .err-dot{
        display:inline-block;
        width: 7px;
        height:7px;
        background:rgb(199, 85, 85);
        border-radius:50%;
        border:1px solid rgb(207, 94, 94);
        margin-right: 10px;
    }
    .succ-state {
        color: rgb(27, 202, 21);
    }
    .warn-state {
        color: rgb(233, 200, 16);
    }
    .err-state {
        color: rgb(226, 23, 23);
    }
</style>