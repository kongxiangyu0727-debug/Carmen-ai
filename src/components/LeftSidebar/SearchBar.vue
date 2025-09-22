<template>
  <div class="search-bar">
    <el-input
      v-model="searchQuery"
      placeholder="搜索笔记内容..."
      prefix-icon="Search"
      size="small"
      @input="handleSearch"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElInput } from 'element-plus'
import { useNoteStore } from '../../stores/note'

const noteStore = useNoteStore()
const searchQuery = ref('')

const handleSearch = () => {
  noteStore.searchNotes(searchQuery.value)
}
</script>

<style scoped>
.search-bar {
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
}
</style>