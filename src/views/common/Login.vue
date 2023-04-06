<template>
    <div class="login">
        <a-card class="login-card" :headStyle="{padding:'0px'}" :bodyStyle="{padding:'20px'}">
            <template #title>
                <div class="login-card-header">
                    <img style="height:25px;margin:0 8px 5px 0;" :src="kubeLogo" />
                    <span>aBais</span>
                </div>
            </template>
            <a-form ref="formRef" :model="loginData" :label-col="{ span: 5 }">
                <a-form-item
                label="用户名"
                name="username"
                :rules="[{ required: true, message: '请输入账号' }]">
                    <a-input v-model:value="loginData.username" />
                </a-form-item>
                <a-form-item
                label="密码"
                name="password"
                :rules="[{ required: true, message: '请输入密码' }]">
                    <a-input-password v-model:value="loginData.password" />
                </a-form-item>
                <a-form-item style="text-align:center;margin-bottom:10px;">
                    <c-button style="width:100%;" type="primary" size="normal" icon="LoginOutlined" @click="onCheck()">登录</c-button>
                </a-form-item>
                <a-form-item style="text-align:center;margin-bottom:10px;">
                    <c-button style="width:100%;" type="primary" size="normal" icon="UserAddOutlined" @click="onCheckRegister()">注册</c-button>
                </a-form-item>
            </a-form>
        </a-card>
    </div>
</template>

<script>
import kubeLogo from '@/assets/k8s.png';
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router'
import httpClient from '@/request';
import common from "@/config";
import jwt from 'jsonwebtoken';
import moment from 'moment';
export default({
    setup() {
        const formRef = ref()
        const loginData = reactive({
            username: '',
            password: ''
        })
        const loginUrl = common.loginAuth

        const router = useRouter()

        const onCheck = async () => {
            try {
                await formRef.value.validateFields();
                //console.log('Success:', values);
                handleLogin()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        const handleLogin = () => {
            httpClient.post(loginUrl, loginData)
            .then(res => {
                localStorage.setItem('username', loginData.username);
                localStorage.setItem('loginDate', moment().format('YYYY-MM-DD HH:mm:ss'));
                let token = jwt.sign(loginData, 'abaisjwt', { expiresIn: '10h' });
                localStorage.setItem('token', token);
                router.push('/');
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
        }
        const onCheckRegister = () =>{
            try {
                //message.info("a");
                router.push('/register');
                //message.info("aa");
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        return {
            router,
            kubeLogo,
            loginData,
            formRef,
            handleLogin,
            onCheck,
            onCheckRegister,
        }
    },
})
</script>


<style scoped>
    .login {
        height: 100vh;
        background-image: url(../../assets/login3.webp);
        background-size: 100%;
        display: grid;
        place-items: center;
    }
    .login-card {
        width: 350px;
    }
    .login-card-header {
        font-size: 18px;
        font-weight: bold;
        text-align: center;
    }
</style>