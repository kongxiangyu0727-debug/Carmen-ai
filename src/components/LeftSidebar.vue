<template>
  <div class="left-sidebar">
    <!-- 顶部操作区域 -->
    <div class="sidebar-header">
      <h2>我的笔记</h2>
      <el-button type="primary" size="small" @click="createNewNote">
        <el-icon><Plus /></el-icon> 新建笔记
      </el-button>
    </div>
    
    <!-- 搜索框 -->
    <SearchBar />
    
    <!-- 标签筛选 -->
    <TagFilter />
    
    <!-- 笔记列表 -->
    <NoteList />
  </div>
</template>

<script setup>
import { ElButton, ElIcon } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from './LeftSidebar/SearchBar.vue'
import TagFilter from './LeftSidebar/TagFilter.vue'
import NoteList from './LeftSidebar/NoteList.vue'
import { useNoteStore } from '../stores/note'

const noteStore = useNoteStore()

const createNewNote = () => {
  noteStore.createNote()
}
</script>

<style scoped>
.left-sidebar {
  width: 320px;
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
</style>