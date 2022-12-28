import axios from 'axios';

//新建个axios对象
const httpClient = axios.create({
    validateStatus(status) {
        return status >= 200 && status < 504 // 设置默认的合法的状态
    },
    timeout: 20000   //超时时间10秒
});


httpClient.defaults.retry = 3 // 请求重试次数
httpClient.defaults.retryDelay = 1000 // 请求重试时间间隔
httpClient.defaults.shouldRetry = true // 是否重试

//添加请求拦截器
httpClient.interceptors.request.use(
    config => {
        //添加header
        //config.headers['Content-Type'] = 'application/json'
        config.headers['Accept-Language'] = 'zh-CN'
        config.headers['Authorization'] = localStorage.getItem('token') // 可以全局设置接口请求header中带token

        if (config.method === 'post') {
            if (!config.data) { // 没有参数时，config.data为null，需要转下类型
                config.data = {}
            }
            // config.data = JSON.stringify(config.data) // qs序列化参数
        }
        return config
    },
    err => {
        //Promise.reject()方法返回一个带有拒绝原因的Promise对象，在F12的console中显示报错
        Promise.reject(err)
    }
);

//添加响应拦截器
httpClient.interceptors.response.use(
    response => {
        if (response.status !== 200) {
            if (!response.data.msg) {
                console.log(response)
                let res = {
                    data: response.data,
                    msg: "服务端异常: " + response.status + " " + response.statusText
                }
                return Promise.reject(res)
            } else {
                return Promise.reject(response.data)
            }
        } else {
            return response.data
        }
    },
    err => {
        return Promise.reject(err)
    }
);

export default httpClient;