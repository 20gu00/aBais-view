<template>
    <div class="register">
        <a-card class="register-card" :headStyle="{padding:'0px'}" :bodyStyle="{padding:'20px'}">
            <template #title>
                <div class="register-card-header">
                    <img style="height:25px;margin:0 8px 5px 0;" :src="kubeLogo" />
                    <span>aBais</span>
                </div>
            </template>
            <a-form ref="formRef" :model="registerData" :label-col="{ span: 5 }">
                <a-form-item
                label="用户名"
                name="username"
                :rules="[{ required: true, message: '请输入账号' }]">
                    <a-input v-model:value="registerData.username" />
                </a-form-item>
                <a-form-item
                label="密码"
                name="password"
                :rules="[{ required: true, message: '请输入密码' }]">
                    <a-input-password v-model:value="registerData.password" />
                </a-form-item>
                <a-form-item style="text-align:center;margin-bottom:10px;">
                    <c-button style="width:100%;" type="primary" size="normal" icon="UserAddOutlined" @click="onCheck()">注册</c-button>
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
export default({
    setup() {
        const formRef = ref()
        const registerData = reactive({
            username: '',
            password: ''
        })
        const registerUrl = common.registerUser

        const router = useRouter()

        const onCheck = async () => {
            try {
                await formRef.value.validateFields();
                //console.log('Success:', values);
                handleRegister()
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
        }
        const handleRegister = () => {
            httpClient.post(registerUrl, registerData)
            .then(res => {
                //localStorage.setItem('username', registerData.username);
                //localStorage.setItem('loginDate', moment().format('YYYY-MM-DD HH:mm:ss'));
                //let token = jwt.sign(registerData, 'abaisjwt', { expiresIn: '10h' });
                //localStorage.setItem('token', token);
                router.push('/login');
                message.success(res.msg)
            })
            .catch(res => {
                message.error(res.msg)
            })
        }
        return {
            kubeLogo,
            registerData,
            formRef,
            handleRegister,
            onCheck
        }
    },
})
</script>


<style scoped>
    .register {
        height: 100vh;
        background-image: url(../../assets/login5.webp);
        background-size: 100%;
        display: grid;
        place-items: center;
    }
    .register-card {
        width: 350px;
    }
    .register-card-header {
        font-size: 18px;
        font-weight: bold;
        text-align: center;
    }
</style>