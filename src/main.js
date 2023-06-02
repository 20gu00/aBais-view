import { createApp } from 'vue'
//也就是加载vue App住组件
import App from './App.vue'
//引入router
import router from './router'
//引入ant组件
import Antd from 'ant-design-vue'
//引入ant暗黑风格主题以及图标 本地的~@
//import 'antd/dist/antd.css'
import 'ant-design-vue/dist/antd.dark.css';
//import 'ant-design-vue/dist/antd.css'
// button
// @src(webpack配置)
import CButton from '@/components/CButton'
//图标 @ant-design (package-lock node_modules)
import * as Icons from '@ant-design/icons-vue'
//codemirror编辑器(CodeMirror一个web端代码编辑器组件,实现既定语言的关键词高亮显示、自动完成提示、设定标记、错误提醒等功能)
import { GlobalCmComponent } from "codemirror-editor-vue3";
// 引入主题 可以从 codemirror/theme/ 下引入多个
import 'codemirror/theme/dracula.css'
// 引入语言模式  yaml 可以从 codemirror/mode/ 下引入多个
import 'codemirror/mode/yaml/yaml.js'

//定义app(依据主组件)
const app = createApp(App)
// 全局组件注册,在任何的vue文件的template中都可以使用
//图标组件注册
for (const i in Icons) {
    app.component(i, Icons[i])
  }
  //button组件
app.component('c-button', CButton)
//使用组件
app.use(GlobalCmComponent, { componentName: "codemirror" });
//使用antd
app.use(Antd)
//使用router
app.use(router)
//对于每个应用实例,mount()只能调用一次
//手动挂载到id=app的dom中 渲染 双向绑定即数据视图(<div>)
//App.vue主组件的style
app.mount('#app')