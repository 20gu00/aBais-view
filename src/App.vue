<template>
  <!-- 路由占位符 -->
  <!--当前路由 比如xxx:port/home home 就去找path为home 然后匹配到组件是Layout 引入Layout Layout还会再写一个router-view就是展示在main部分,真正的view页面   把匹配到的vue页面潜逃到这个位置-->
  <!--也就是两层路由嵌套 router-view-->
  <router-view></router-view>
</template>

<style>
  html, body {
    /* 屏幕浏览器最大的宽和高 */
    width: 100vw;
    height: 100vh;
    /* 最小宽度  拉伸  像素*/
    min-width: 1425px;
    /*html和body的y轴滚轴隐藏,但是不影响main和侧边栏的滚轴*/
    overflow-y: hidden;
  }
  #nprogress .bar {
    /* 自定义进度条颜色 */
    background: #2186c0 !important;
  }
</style>
