<template>
  <div class="icon-test">
    <h2>图标测试组件</h2>
    <div class="icon-grid">
      <div class="icon-item">
        <el-icon size="32"><Document /></el-icon>
        <span>Document</span>
      </div>
      <div class="icon-item">
        <el-icon size="32"><Save /></el-icon>
        <span>Save</span>
      </div>
      <div class="icon-item">
        <el-icon size="32"><Edit /></el-icon>
        <span>Edit</span>
      </div>
      <div class="icon-item">
        <el-icon size="32"><Plus /></el-icon>
        <span>Plus</span>
      </div>
      <div class="icon-item">
        <el-icon size="32"><Copy /></el-icon>
        <span>Copy</span>
      </div>
      <div class="icon-item">
        <el-icon size="32"><Calendar /></el-icon>
        <span>Calendar</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElIcon } from 'element-plus'
import { Document, Save, Edit, Plus, Copy, Calendar } from '@element-plus/icons-vue'
</script>

<style scoped>
.icon-test {
  padding: 20px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.icon-item:hover {
  background-color: #f5f7fa;
  border-color: #c0c4cc;
  transform: translateY(-2px);
}
</style>