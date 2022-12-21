import { createApp } from 'vue'
//也就是加载vue
import App from './App.vue'
//引入router
import router from './router'
//引入ant
import Antd from 'ant-design-vue'
//引入ant暗黑风格主题以及图标
import 'ant-design-vue/dist/antd.dark.css'
import * as Icons from '@ant-design/icons-vue'

//定义app
const app = createApp(App)
//图标注册全局组件
for (const i in Icons) {
    app.component(i, Icons[i])
}
//引入antd
app.use(Antd)
//引入router
app.use(router)
//对于每个应用实例,mount()只能调用一次
//挂在到dom 渲染 双向绑定
//App.vue主组件的style
app.mount('#app')
