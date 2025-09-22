<template>
  <div class="main-editor">
    <!-- 编辑器顶部工具栏 -->
    <div class="editor-header">
      <input
        v-model="currentNoteTitle"
        class="note-title-input"
        placeholder="请输入笔记标题..."
        @input="updateNoteTitle"
        :disabled="!currentNote"
      />
      <div class="header-actions">
        <ModelSelector />
        <AIToolbar />
        <el-button
          type="primary"
          size="small"
          @click="beautifyCurrentNote"
          :loading="isBeautifying"
          :disabled="!currentNote"
          v-if="currentNote"
          class="beautify-btn"
        >
          <el-icon><Plus /></el-icon>
          {{ isBeautifying ? 'AI美化中...' : 'AI美化' }}
        </el-button>
        <el-button
          type="success"
          size="small"
          @click="saveNote"
          :loading="isSaving"
          :disabled="!currentNote"
          class="save-btn"
        >
          <el-icon><Save /></el-icon>
          {{ isSaving ? '保存中...' : '保存' }}
        </el-button>
      </div>
    </div>
    
    <!-- 笔记信息概览 -->
    <div class="note-info-bar" v-if="currentNote">
      <div class="note-meta">
        <span class="meta-item">
          <el-icon><Calendar /></el-icon>
          创建于: {{ formatDate(currentNote.created_at) }}
        </span>
        <span class="meta-item" v-if="currentNote.updated_at !== currentNote.created_at">
            <el-icon><Edit /></el-icon>
            更新于: {{ formatDate(currentNote.updated_at) }}
          </span>
      </div>
    </div>
    
    <!-- 笔记编辑器 - 增强版 -->
    <div class="editor-container">
      <NoteEditor />
    </div>
    
    <!-- 标签选择区域 - 优化版 -->
    <div class="note-tags-editor" v-if="currentNote">
      <div class="tags-section-header">
        <h3>标签</h3>
        <el-button type="text" size="small" @click="showTagManager" class="manage-tags-btn">
          <el-icon><Edit /></el-icon>
          管理标签
        </el-button>
      </div>
      <el-select
        v-model="selectedTags"
        multiple
        collapse-tags
        placeholder="选择标签"
        @change="updateNoteTags"
        class="tags-select"
      >
        <el-option
          v-for="tag in tags"
          :key="tag.id"
          :label="tag.name"
          :value="tag.id"
          :style="{ backgroundColor: tag.color || '#f0f0f0' }"
        />
      </el-select>
    </div>
    
    <!-- AI 摘要显示区域 - 优化版 -->
    <div class="ai-summary" v-if="currentNote && currentNote.ai_summary">
      <div class="summary-header">
        <el-icon><Document /></el-icon>
        <span>AI 摘要</span>
        <el-button 
          type="text" 
          size="small" 
          @click="copySummary"
          class="copy-btn"
          title="复制摘要"
        >
          <el-icon><Copy /></el-icon>
        </el-button>
      </div>
      <div class="summary-content">{{ currentNote.ai_summary }}</div>
    </div>
    
    <!-- 空状态提示 -->
    <div class="empty-state" v-if="!currentNote">
      <div class="empty-icon">
        <el-icon><Document /></el-icon>
      </div>
      <h3>选择或创建笔记</h3>
      <p>从左侧列表选择一个笔记，或创建一个新的笔记开始编辑</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElButton, ElInput, ElSelect, ElOption, ElIcon, ElMessage } from 'element-plus'
import { Document, Calendar, Edit, Save, Plus, Copy } from '@element-plus/icons-vue'
import NoteEditor from './MainEditor/NoteEditor.vue'
import AIToolbar from './MainEditor/AIToolbar.vue'
import ModelSelector from './MainEditor/ModelSelector.vue'
import { useNoteStore } from '../stores/note'
import { useTagStore } from '../stores/tag'
import { useAIService } from '../services/ai'

const noteStore = useNoteStore()
const tagStore = useTagStore()
const aiService = useAIService()

const currentNote = computed(() => noteStore.currentNote)
const currentNoteTitle = ref('')
const tags = computed(() => tagStore.tags)
const isSaving = ref(false)
const isBeautifying = ref(false)
const selectedTags = ref([])

// 监听当前笔记变化，更新标题和标签输入
watch(currentNote, (newNote) => {
  if (newNote) {
    currentNoteTitle.value = newNote.title || ''
    selectedTags.value = [...(newNote.tags || [])]
  } else {
    currentNoteTitle.value = ''
    selectedTags.value = []
  }
}, { immediate: true })

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 复制AI摘要
const copySummary = async () => {
  if (!currentNote.value?.ai_summary) return
  
  try {
    await navigator.clipboard.writeText(currentNote.value.ai_summary)
    ElMessage.success('摘要已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

// 更新笔记标题
const updateNoteTitle = () => {
  if (currentNote.value) {
    noteStore.updateNoteTitle(currentNote.value.id, currentNoteTitle.value)
  }
}

// 更新笔记标签
const updateNoteTags = () => {
  if (currentNote.value) {
    noteStore.updateNoteTags(currentNote.value.id, selectedTags.value)
  }
}

// 保存笔记
const saveNote = async () => {
  if (currentNote.value) {
    isSaving.value = true
    await noteStore.saveCurrentNote()
    isSaving.value = false
    ElMessage.success('笔记已保存')
  }
}

// AI美化当前笔记
const beautifyCurrentNote = async () => {
  if (!currentNote.value || !currentNote.value.content.trim()) {
    ElMessage.warning('笔记内容为空，无法进行AI美化')
    return
  }
  
  try {
    isBeautifying.value = true
    
    // 移除HTML标签，获取纯文本
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = currentNote.value.content
    const text = tempDiv.textContent || tempDiv.innerText || ''
    
    // 使用AI服务进行文本润色
    const beautifiedText = await aiService.rewriteText(text)
    
    // 更新笔记内容
    await noteStore.updateNoteContent(currentNote.value.id, beautifiedText)
    
    isBeautifying.value = false
    ElMessage.success('笔记已成功美化')
  } catch (error) {
    console.error('AI美化失败:', error)
    isBeautifying.value = false
    ElMessage.error(`美化失败: ${error.message || '未知错误'}`)
  }
}

// 显示标签管理器
const showTagManager = () => {
  tagStore.showManager = true
}
</script>

<style scoped>
.main-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  position: relative;
  overflow: hidden;
}

/* 编辑器顶部工具栏 */
.editor-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.note-title-input {
  flex: 1;
  font-size: 22px;
  font-weight: 600;
  border: none;
  outline: none;
  padding: 8px 16px;
  margin-right: 16px;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.note-title-input:focus {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.note-title-input:disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.beautify-btn,
.save-btn {
  border-radius: 6px;
  transition: all 0.3s ease;
}

.beautify-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 199, 129, 0.3);
}

/* 笔记信息概览 */
.note-info-bar {
  padding: 12px 24px;
  background-color: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.note-meta {
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 编辑器容器 */
.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #fff;
  border-radius: 8px;
  margin: 16px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
}

.editor-container:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 标签选择区域 */
.note-tags-editor {
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.tags-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tags-section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.manage-tags-btn {
  font-size: 12px;
  color: #606266;
}

.manage-tags-btn:hover {
  color: #409eff !important;
}

.tags-select {
  width: 100%;
  max-width: 400px;
}

/* AI 摘要显示区域 */
.ai-summary {
  padding: 20px 24px;
  background-color: #f6ffed;
  border-left: 4px solid #52c41a;
  margin: 16px 24px;
  border-radius: 8px;
  animation: fadeIn 0.3s ease-in;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 500;
  color: #389e0d;
}

.copy-btn {
  margin-left: auto;
  color: #389e0d;
  font-size: 12px;
}

.copy-btn:hover {
  color: #52c41a !important;
  background-color: rgba(82, 196, 26, 0.1) !important;
}

.summary-content {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  background-color: rgba(255, 255, 255, 0.6);
  padding: 12px 16px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 空状态提示 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #c0c4cc;
  opacity: 0.6;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #606266;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-header {
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
  }
  
  .note-title-input {
    width: 100%;
    margin-right: 0;
    font-size: 18px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .editor-container {
    margin: 12px 16px;
  }
  
  .note-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .ai-summary {
    margin: 12px 16px;
    padding: 16px;
  }
}
</style>