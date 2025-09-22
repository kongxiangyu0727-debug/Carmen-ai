<template>
  <div class="test-button-container">
    <h3>测试按钮组件</h3>
    <el-button type="primary" @click="handleClick">点击测试</el-button>
  </div>
</template>

<script setup>
import { ElButton } from 'element-plus'

const handleClick = () => {
  console.log('测试按钮被点击了！');
  alert('测试按钮被点击了！');
}
</script>

<style scoped>
.test-button-container {
  padding: 20px;
  text-align: center;
}
</style>