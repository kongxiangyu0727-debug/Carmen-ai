<template>
  <div class="tag-filter">
    <div class="tag-filter-header" @click="toggleCollapse">
      <span>标签</span>
      <div class="header-actions">
        <el-button type="text" size="small" @click.stop="showTagManager">管理</el-button>
        <el-icon :class="{ 'rotate': isCollapsed }"><ArrowRight /></el-icon>
      </div>
    </div>
    <div class="tag-list" v-show="!isCollapsed">
      <el-tag
        v-for="tag in tags"
        :key="tag.id"
        :type="selectedTags.includes(tag.id) ? 'primary' : ''"
        :style="{ backgroundColor: tag.color || '#f0f0f0', color: getTextColor(tag.color) }"
        @click="toggleTag(tag.id)"
        closable
        @close="handleTagClose(tag.id)"
      >
        {{ tag.name }}
      </el-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElButton, ElTag, ElIcon } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { useTagStore } from '../../stores/tag'
import { useNoteStore } from '../../stores/note'

const tagStore = useTagStore()
const noteStore = useNoteStore()
const selectedTags = ref([])
const isCollapsed = ref(false)

const tags = computed(() => tagStore.tags)

// 切换折叠状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 计算标签文字颜色（基于背景色）
const getTextColor = (bgColor) => {
  if (!bgColor || bgColor === '#f0f0f0') return '#303133'
  
  // 简单的颜色亮度计算
  const hex = bgColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  
  return brightness > 128 ? '#303133' : '#ffffff'
}

const toggleTag = (tagId) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagId)
  }
  
  noteStore.filterNotesByTags(selectedTags.value)
}

const handleTagClose = (tagId) => {
  tagStore.deleteTag(tagId)
}

const showTagManager = () => {
  tagStore.showManager = true
}
</script>

<style scoped>
.tag-filter {
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  max-height: 120px;
  overflow-y: auto;
}

.tag-filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.tag-filter-header:hover {
  background-color: #f5f7fa;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.el-icon {
  transition: transform 0.2s;
  font-size: 12px;
}

.el-icon.rotate {
  transform: rotate(90deg);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.el-tag {
  cursor: pointer;
}
</style>