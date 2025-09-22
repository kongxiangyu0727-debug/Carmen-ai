<template>
  <div class="note-list">
    <!-- 批量操作工具栏 -->
    <div v-if="selectedNoteIds.length > 0" class="batch-actions">
      <el-button type="text" size="small" @click="batchDelete">删除所选</el-button>
      <el-dropdown size="small" trigger="click">
        <span class="el-dropdown-link">
          移动到标签 <i class="el-icon-arrow-down el-icon--right"></i>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="tag in tagStore.tags" :key="tag.id" @click="batchMoveToTag(tag.id)">{{ tag.name }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button type="text" size="small" @click="clearSelection">取消选择</el-button>
      <span class="selected-count">{{ selectedNoteIds.length }} 项已选择</span>
    </div>
    
    <div 
      v-for="(note, index) in notes"
      :key="note.id"
      class="note-item"
      draggable="true"
      @dragstart="handleDragStart($event, index)"
      @dragover="handleDragOver($event)"
      @dragenter="handleDragEnter($event, index)"
      @dragleave="handleDragLeave($event)"
      @drop="handleDrop($event, index)"
      :class="{ active: currentNoteId === note.id, selected: selectedNoteIds.includes(note.id) }"
      @click="handleNoteClick(note.id, $event)"
      @contextmenu.prevent="handleNoteContextMenu(note.id, $event)"
    >
      <input 
        type="checkbox" 
        class="note-checkbox" 
        :checked="selectedNoteIds.includes(note.id)" 
        @click.stop="toggleNoteSelection(note.id)"
      >
      <div class="note-content">
        <div class="note-title">{{ note.title || '无标题笔记' }}</div>
        <div class="note-preview">{{ getNotePreview(note.content) }}</div>
        <div class="note-meta">
          <span class="note-time">{{ formatDate(note.updated_at) }}</span>
          <div class="note-tags">
            <el-tag 
              v-for="tagId in note.tags"
              :key="tagId"
              size="small"
              :style="{ backgroundColor: getTagColor(tagId), color: '#fff' }"
            >
              {{ getTagName(tagId) }}
            </el-tag>
          </div>
        </div>
      </div>
      <div v-if="selectedNoteIds.length === 0" class="note-actions">
        <el-button 
          type="text" 
          size="small" 
          class="action-btn" 
          @click.stop="moveNoteUp(note.id)"
          :disabled="notes.indexOf(note) === 0"
          title="上移"
        >
          <i class="el-icon-arrow-up"></i>
        </el-button>
        <el-button 
          type="text" 
          size="small" 
          class="action-btn"
          @click.stop="moveNoteDown(note.id)"
          :disabled="notes.indexOf(note) === notes.length - 1"
          title="下移"
        >
          <i class="el-icon-arrow-down"></i>
        </el-button>
        <el-button 
          type="text" 
          size="small" 
          class="action-btn" 
          @click.stop="editNoteTitle(note.id)"
          title="编辑标题"
        >
          <i class="el-icon-edit"></i>
        </el-button>
        <el-button 
          type="text" 
          size="small" 
          class="action-btn"
          @click.stop="copyNoteContent(note.id)"
          title="复制内容"
        >
          <i class="el-icon-copy-document"></i>
        </el-button>
        <el-button 
          type="text" 
          size="small" 
          class="action-btn"
          @click.stop="beautifyWithAI(note.id)"
          title="AI美化"
        >
          <i class="el-icon-magic-stick"></i>
        </el-button>
        <el-button 
          type="text" 
          size="small" 
          class="action-btn delete-btn"
          @click.stop="deleteSingleNote(note.id)"
          title="删除笔记"
        >
          <i class="el-icon-delete"></i>
        </el-button>
      </div>
    </div>
    
    <div v-if="notes.length === 0" class="empty-state">
      <p>暂无笔记，点击上方"新建笔记"按钮开始记录</p>
    </div>
    
    <!-- 笔记右键菜单 -->
    <div 
      v-if="showNoteContextMenu"
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="deleteSingleNote(contextMenuNoteId)">删除笔记</div>
      <div class="menu-item" @click="editNoteTitle(contextMenuNoteId)">编辑标题</div>
      <!-- 仅保留上移和下移功能在右键菜单 -->
      <div class="menu-item" @click="moveNoteUp()">上移</div>
      <div class="menu-item" @click="moveNoteDown()">下移</div>
      <el-divider></el-divider>
      <div class="menu-item" @click="beautifyWithAI(contextMenuNoteId)">AI美化</div>
      <div class="menu-item" @click="copyNoteContent(contextMenuNoteId)">复制内容</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onUnmounted } from 'vue'
import { ElTag, ElButton, ElDropdown, ElDropdownMenu, ElDropdownItem, ElDivider, ElMessageBox, ElMessage } from 'element-plus'
import { useNoteStore } from '../../stores/note'
import { useTagStore } from '../../stores/tag'
import { useAIService } from '../../services/ai'

const noteStore = useNoteStore()
const tagStore = useTagStore()
const aiService = useAIService()

const notes = computed(() => noteStore.filteredNotes)
const currentNoteId = computed(() => noteStore.currentNote?.id)
const selectedNoteIds = ref([])
const showNoteContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuNoteId = ref(null)
const draggedIndex = ref(-1)
let draggedElement = null

// 选择笔记
const selectNote = (noteId) => {
  noteStore.selectNote(noteId)
}

// 拖动开始
const handleDragStart = (event, index) => {
  draggedIndex.value = index
  draggedElement = event.target
  event.dataTransfer.effectAllowed = 'move'
  // 设置拖动时的视觉反馈
  const dragImage = event.target.cloneNode(true)
  dragImage.style.opacity = '0.5'
  document.body.appendChild(dragImage)
  event.dataTransfer.setDragImage(dragImage, 0, 0)
  setTimeout(() => {
    document.body.removeChild(dragImage)
  }, 0)
}

// 拖动悬停
const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  // 避免添加多次drag-over类
  if (event.target !== draggedElement && event.target.classList.contains('note-item')) {
    event.target.classList.add('drag-over')
  }
}

// 拖动进入
const handleDragEnter = (event, index) => {
  event.preventDefault()
  if (event.target !== draggedElement && event.target.classList.contains('note-item')) {
    event.target.classList.add('drag-over')
  }
}

// 拖动离开
const handleDragLeave = (event) => {
  if (event.target.classList.contains('drag-over')) {
    event.target.classList.remove('drag-over')
  }
}

// 放置
const handleDrop = async (event, dropIndex) => {
  event.preventDefault()
  // 移除所有drag-over类
  document.querySelectorAll('.note-item.drag-over').forEach(el => {
    el.classList.remove('drag-over')
  })
  if (draggedIndex.value !== -1 && draggedIndex.value !== dropIndex) {
    try {
      await noteStore.reorderNotes(draggedIndex.value, dropIndex)
    } catch (error) {
      console.error('调整笔记顺序失败:', error)
    }
  }
  draggedIndex.value = -1
  draggedElement = null
}

// 处理笔记点击
const handleNoteClick = (noteId, event) => {
  // 如果按住Ctrl/Cmd键，添加到选择
  if (event.ctrlKey || event.metaKey) {
    toggleNoteSelection(noteId)
  } else {
    // 否则选择单个笔记
    selectedNoteIds.value = []
    selectNote(noteId)
  }
}

// 切换笔记选择状态
const toggleNoteSelection = (noteId) => {
  const index = selectedNoteIds.value.indexOf(noteId)
  if (index > -1) {
    selectedNoteIds.value.splice(index, 1)
  } else {
    selectedNoteIds.value.push(noteId)
  }
}

// 清除选择
const clearSelection = () => {
  selectedNoteIds.value = []
}

// 批量删除
const batchDelete = async () => {
  const confirmResult = await ElMessageBox.confirm(
    `确定要删除选中的 ${selectedNoteIds.value.length} 条笔记吗？此操作不可撤销。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
  
  if (confirmResult === 'confirm') {
    try {
      for (const noteId of selectedNoteIds.value) {
        await noteStore.deleteNote(noteId)
      }
      clearSelection()
    } catch (error) {
      console.error('批量删除失败:', error)
    }
  }
}

// 单个删除
const deleteSingleNote = async (noteId) => {
  const confirmResult = await ElMessageBox.confirm(
    '确定要删除这条笔记吗？此操作不可撤销。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
  
  if (confirmResult === 'confirm') {
    try {
      await noteStore.deleteNote(noteId)
      closeNoteContextMenu()
      
      // 从选中列表中移除
      const index = selectedNoteIds.value.indexOf(noteId)
      if (index > -1) {
        selectedNoteIds.value.splice(index, 1)
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }
}

// 批量移动到标签
const batchMoveToTag = async (tagId) => {
  try {
    for (const noteId of selectedNoteIds.value) {
      const note = noteStore.notes.find(n => n.id === noteId)
      if (note && !note.tags.includes(tagId)) {
        await noteStore.updateNoteTags(noteId, [...note.tags, tagId])
      }
    }
    clearSelection()
  } catch (error) {
    console.error('批量移动失败:', error)
  }
}

// 处理笔记右键菜单
const handleNoteContextMenu = (noteId, event) => {
  contextMenuNoteId.value = noteId
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  showNoteContextMenu.value = true
}

// 关闭笔记右键菜单
const closeNoteContextMenu = () => {
  showNoteContextMenu.value = false
}

// 编辑笔记标题
const editNoteTitle = async (noteId) => {
  const note = noteStore.notes.find(n => n.id === noteId)
  if (!note) return
  
  closeNoteContextMenu()
  
  const result = await ElMessageBox.prompt(
    '请输入新的笔记标题:',
    '编辑标题',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: note.title
    }
  )
  
  if (result && result.value) {
    try {
      await noteStore.updateNoteTitle(noteId, result.value.trim())
    } catch (error) {
      console.error('更新标题失败:', error)
    }
  }
}

// 复制笔记内容
const copyNoteContent = async (noteId) => {
  const note = noteStore.notes.find(n => n.id === noteId)
  if (!note) return
  
  try {
    // 移除HTML标签，获取纯文本
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = note.content
    const text = tempDiv.textContent || tempDiv.innerText || ''
    
    await navigator.clipboard.writeText(text)
    ElMessage.success('内容已复制到剪贴板')
    closeNoteContextMenu()
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请重试')
  }
}

// 笔记上移
const moveNoteUp = async (noteId) => {
  // 如果没有传入noteId，则使用上下文菜单中的noteId
  const targetNoteId = noteId || contextMenuNoteId.value
  const noteIndex = notes.value.findIndex(note => note.id === targetNoteId)
  if (noteIndex > 0) {
    try {
      await noteStore.reorderNotes(noteIndex, noteIndex - 1)
      closeNoteContextMenu()
    } catch (error) {
      console.error('笔记上移失败:', error)
      ElMessage.error('移动失败，请重试')
    }
  }
}

// 笔记下移
const moveNoteDown = async (noteId) => {
  // 如果没有传入noteId，则使用上下文菜单中的noteId
  const targetNoteId = noteId || contextMenuNoteId.value
  const noteIndex = notes.value.findIndex(note => note.id === targetNoteId)
  if (noteIndex < notes.value.length - 1) {
    try {
      await noteStore.reorderNotes(noteIndex, noteIndex + 1)
      closeNoteContextMenu()
    } catch (error) {
      console.error('笔记下移失败:', error)
      ElMessage.error('移动失败，请重试')
    }
  }
}

// AI美化笔记
const beautifyWithAI = async (noteId) => {
  const note = noteStore.notes.find(n => n.id === noteId)
  if (!note || !note.content.trim()) {
    ElMessage.warning('笔记内容为空，无法进行AI美化')
    closeNoteContextMenu()
    return
  }
  
  try {
    // 移除HTML标签，获取纯文本
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = note.content
    const text = tempDiv.textContent || tempDiv.innerText || ''
    
    ElMessage({ message: 'AI美化中，请稍候...', type: 'info', duration: 0 })
    
    // 使用AI服务进行文本润色
    const beautifiedText = await aiService.rewriteText(text)
    
    // 更新笔记内容
    await noteStore.updateNoteContent(noteId, beautifiedText)
    
    ElMessage.closeAll()
    ElMessage.success('笔记已成功美化')
    closeNoteContextMenu()
  } catch (error) {
    console.error('AI美化失败:', error)
    ElMessage.closeAll()
    ElMessage.error(`美化失败: ${error.message || '未知错误'}`)
  }
}

// 获取笔记预览（前100个字符）
const getNotePreview = (content) => {
  if (!content) return ''
  // 移除HTML标签
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = content
  const text = tempDiv.textContent || tempDiv.innerText || ''
  return text.length > 100 ? text.substring(0, 100) + '...' : text
}

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 获取标签名称
const getTagName = (tagId) => {
  const tag = tagStore.tags.find(t => t.id === tagId)
  return tag?.name || ''
}

// 获取标签颜色
const getTagColor = (tagId) => {
  const tag = tagStore.tags.find(t => t.id === tagId)
  return tag?.color || '#909399'
}

// 点击页面其他地方关闭右键菜单
const handleClickOutside = () => {
  closeNoteContextMenu()
}

// 添加全局点击事件监听
if (typeof window !== 'undefined') {
  window.addEventListener('click', handleClickOutside)
}

// 组件卸载时移除事件监听
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style scoped>
.note-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  position: relative;
}

.batch-actions {
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.selected-count {
  color: #909399;
  margin-left: auto;
}

.note-item {
  padding: 12px;
  margin-bottom: 8px;
  background-color: #fafafa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.note-item[draggable="true"] {
  cursor: grab;
}

.note-item[draggable="true"]:active {
  cursor: grabbing;
}

.note-item.dragging {
  opacity: 0.5;
  background-color: #e6f7ff;
}

.note-item.drag-over {
  background-color: #f0f0f0;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.note-item:hover {
  background-color: #f0f0f0;
}

.note-item.active {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.note-item.selected {
  background-color: #fffbe6;
  border-color: #faad14;
}

.note-checkbox {
  margin-top: 4px;
  cursor: pointer;
}

.note-content {
  flex: 1;
}

.note-title {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-preview {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-time {
  font-size: 11px;
  color: #909399;
}

.note-tags {
  display: flex;
  gap: 4px;
}

.el-tag {
  font-size: 11px;
  height: 18px;
  padding: 0 6px;
}

.note-actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-left: auto;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .note-item:hover .note-actions {
      opacity: 1;
    }

    .action-btn {
      padding: 4px;
      height: auto;
    }

    .delete-btn {
      color: #f56c6c;
    }

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #909399;
}

.context-menu {
  position: fixed;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  min-width: 120px;
  z-index: 1000;
}

.menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f5f7fa;
}
</style>