<template>
  <div class="todo-container">
    <!-- 头部区域 -->
    <div class="todo-header">
      <div class="header-left">
        <h2>待办事项</h2>
        <span class="todo-badge">{{ filteredTodos.length }} 项</span>
      </div>
      <el-button 
        type="primary" 
        size="small" 
        @click="clearCompleted"
        :disabled="!todoStore.completedTodos.length"
        class="clear-btn"
      >
        清除已完成
      </el-button>
    </div>
    
    <!-- 搜索和筛选区域 -->
    <div class="todo-toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索待办事项..."
        clearable
        size="small"
        prefix-icon="el-icon-search"
        class="search-input"
      />
      
      <div class="todo-filters">
        <el-button
          v-for="filter in filters"
          :key="filter.type"
          size="small"
          :type="activeFilter === filter.type ? 'primary' : 'default'"
          plain
          @click="activeFilter = filter.type"
        >
          {{ filter.label }}
        </el-button>
      </div>
    </div>
    
    <!-- 添加待办事项输入框 -->
    <div class="todo-input-container">
      <el-input
        v-model="newTodoContent"
        placeholder="添加新的待办事项..."
        @keyup.enter="addTodo"
        clearable
        :disabled="todoStore.isLoading"
      >
        <template #prepend>
          <el-select v-model="newTodoPriority" size="small" placeholder="优先级">
            <el-option label="普通" value="normal" />
            <el-option label="重要" value="important" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </template>
        <template #append>
          <el-button type="primary" @click="addTodo" :disabled="!newTodoContent.trim() || todoStore.isLoading">
            添加
          </el-button>
        </template>
      </el-input>
    </div>
    
    <!-- 待办事项列表 -->
    <div class="todo-list">
      <div v-if="todoStore.isLoading" class="loading">
        <div class="loading-spinner">
          <el-icon><Loading /></el-icon>
          <span>加载中...</span>
        </div>
      </div>
      <div v-else-if="!filteredTodos.length" class="empty">
        <div class="empty-state">
          <el-icon name="el-icon--document-copy" class="empty-icon" />
          <h3>{{ getEmptyStateMessage() }}</h3>
          <p>{{ getEmptyStateSubtitle() }}</p>
        </div>
      </div>
      <transition-group name="todo-item" tag="div" class="todo-items-wrapper">
        <div 
          v-for="todo in filteredTodos" 
          :key="todo.id" 
          class="todo-item"
          :class="{
            'todo-item-completed': todo.completed,
            'todo-item-important': todo.priority === 'important',
            'todo-item-urgent': todo.priority === 'urgent',
            'todo-item-editing': editingTodoId === todo.id
          }"
        >
          <div class="todo-item-content">
            <el-checkbox 
              :checked="todo.completed" 
              @change="toggleTodo(todo.id)"
              :disabled="todoStore.isLoading"
            />
            <div 
              v-if="!editingTodoId || editingTodoId !== todo.id"
              class="todo-text"
              @dblclick="startEditing(todo)"
            >
              <span class="todo-priority-marker" :class="`priority-${todo.priority}`"></span>
              {{ todo.content }}
            </div>
            <el-input
              v-else
              v-model="editingContent"
              ref="editInput"
              @blur="finishEditing"
              @keyup.enter="finishEditing"
              @keyup.esc="cancelEditing"
              :disabled="todoStore.isLoading"
              class="todo-edit-input"
            />
          </div>
          <div class="todo-item-actions">
            <el-button 
              type="text" 
              size="small" 
              @click="changePriority(todo)"
              :disabled="todoStore.isLoading"
              class="priority-btn"
            >
              <el-icon><Flag /></el-icon>
            </el-button>
            <span class="todo-time">{{ formatTime(todo.created_at) }}</span>
            <el-button 
              type="text" 
              size="small" 
              @click="deleteTodo(todo.id)"
              :disabled="todoStore.isLoading"
              class="delete-btn"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </transition-group>
    </div>
    
    <!-- 统计和批量操作 -->
    <div class="todo-footer">
      <div class="todo-stats">
        <span class="todo-count">
          剩余 {{ todoStore.pendingTodos.length }} 项待办
        </span>
        <span class="todo-completed-count">
          已完成 {{ todoStore.completedTodos.length }} 项
        </span>
      </div>
      <div class="todo-batch-actions">
        <el-button 
          type="default" 
          size="small" 
          @click="toggleAll"
          :disabled="!todoStore.todos.length || todoStore.isLoading"
          class="toggle-all-btn"
        >
          {{ allCompleted ? '取消全选' : '全部完成' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElInput, ElButton, ElCheckbox, ElSelect, ElOption, ElIcon, ElBadge } from 'element-plus'
import { Delete, Flag, Loading } from '@element-plus/icons-vue'
import { useTodoStore } from '../stores/todo'

const todoStore = useTodoStore()
const newTodoContent = ref('')
const newTodoPriority = ref('normal')
const editingTodoId = ref(null)
const editingContent = ref('')
const editInput = ref(null)
const searchKeyword = ref('')
const activeFilter = ref('all')

// 筛选选项
const filters = [
  { type: 'all', label: '全部' },
  { type: 'active', label: '进行中' },
  { type: 'completed', label: '已完成' }
]

// 计算属性：过滤后的待办事项
const filteredTodos = computed(() => {
  let todos = [...todoStore.todos]
  
  // 搜索过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    todos = todos.filter(todo => 
      todo.content.toLowerCase().includes(keyword)
    )
  }
  
  // 状态过滤
  switch (activeFilter.value) {
    case 'active':
      todos = todos.filter(todo => !todo.completed)
      break
    case 'completed':
      todos = todos.filter(todo => todo.completed)
      break
  }
  
  // 按优先级和创建时间排序
  return todos.sort((a, b) => {
    // 先按完成状态排序（未完成的在前）
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    
    // 再按优先级排序
    const priorityOrder = { urgent: 0, important: 1, normal: 2 }
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    
    // 最后按创建时间排序
    return new Date(b.created_at) - new Date(a.created_at)
  })
})

// 是否全部完成
const allCompleted = computed(() => {
  return todoStore.todos.length > 0 && 
         todoStore.todos.every(todo => todo.completed)
})

// 加载待办事项
onMounted(() => {
  todoStore.loadTodos()
})

// 添加待办事项
const addTodo = async () => {
  if (newTodoContent.value.trim()) {
    await todoStore.addTodo({
      content: newTodoContent.value.trim(),
      priority: newTodoPriority.value
    })
    newTodoContent.value = ''
    newTodoPriority.value = 'normal'
  }
}

// 切换待办事项状态
const toggleTodo = async (id) => {
  await todoStore.toggleTodo(id)
}

// 开始编辑
const startEditing = (todo) => {
  editingTodoId.value = todo.id
  editingContent.value = todo.content
  nextTick(() => {
    editInput.value?.focus()
  })
}

// 完成编辑
const finishEditing = async () => {
  if (editingTodoId.value && editingContent.value.trim()) {
    await todoStore.updateTodoContent(editingTodoId.value, editingContent.value.trim())
  }
  cancelEditing()
}

// 取消编辑
const cancelEditing = () => {
  editingTodoId.value = null
  editingContent.value = ''
}

// 删除待办事项
const deleteTodo = async (id) => {
  if (confirm('确定要删除这个待办事项吗？')) {
    await todoStore.deleteTodo(id)
  }
}

// 清除已完成的待办事项
const clearCompleted = async () => {
  if (todoStore.completedTodos.length > 0 && 
      confirm(`确定要清除所有 ${todoStore.completedTodos.length} 个已完成的待办事项吗？`)) {
    await todoStore.clearCompleted()
  }
}

// 切换全部待办事项状态
const toggleAll = async () => {
  await todoStore.toggleAllTodos(!allCompleted.value)
}

// 更改优先级
const changePriority = async (todo) => {
  const priorities = ['normal', 'important', 'urgent', 'normal']
  const currentIndex = priorities.indexOf(todo.priority)
  const newPriority = priorities[currentIndex + 1]
  await todoStore.updateTodoPriority(todo.id, newPriority)
}

// 格式化时间
const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) {
    return '刚刚'
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// 获取空状态消息
const getEmptyStateMessage = () => {
  if (todoStore.isLoading) return '加载中...'
  if (searchKeyword.value.trim()) return '没有找到匹配的待办事项'
  
  switch (activeFilter.value) {
    case 'active':
      return '没有待办事项'
    case 'completed':
      return '没有已完成的待办事项'
    default:
      return '暂无待办事项'
  }
}

// 获取空状态副标题
const getEmptyStateSubtitle = () => {
  if (searchKeyword.value.trim()) {
    return '尝试使用其他关键词搜索'
  }
  
  switch (activeFilter.value) {
    case 'active':
      return '所有待办事项都已完成'
    case 'completed':
      return '完成一些待办事项后会显示在这里'
    default:
      return '点击上方输入框添加新的待办事项'
  }
}
</script>

<style scoped>
.todo-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f5f7fa;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.todo-header h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.todo-badge {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.clear-btn {
  transition: all 0.3s ease;
}

.todo-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.todo-filters {
  display: flex;
  gap: 4px;
}

.todo-filters .el-button {
  transition: all 0.2s ease;
}

.todo-filters .el-button:hover {
  transform: translateY(-1px);
}

.todo-input-container {
  margin-bottom: 16px;
}

.todo-input-container .el-input {
  width: 100%;
}

.todo-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
  position: relative;
}

.todo-items-wrapper {
  position: relative;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  margin-bottom: 8px;
  border-radius: 6px;
  background-color: #fafafa;
  transition: all 0.3s ease;
  position: relative;
  border: 1px solid transparent;
}

.todo-item:hover {
  background-color: #f0f0f0;
  transform: translateX(2px);
  border-color: #e6e6e6;
}

.todo-item-completed {
  background-color: #f6ffed;
}

.todo-item-important {
  border-left: 4px solid #faad14;
}

.todo-item-urgent {
  border-left: 4px solid #f5222d;
  background-color: #fff1f0;
}

.todo-item-editing {
  background-color: #e6f7ff;
  border-color: #91d5ff;
}

.todo-item-content {
  display: flex;
  align-items: flex-start;
  flex: 1;
  gap: 10px;
}

.todo-text {
  cursor: pointer;
  color: #303133;
  flex: 1;
  line-height: 1.6;
  min-height: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  word-break: break-word;
}

.todo-item-completed .todo-text {
  color: #909399;
  text-decoration: line-through;
}

.todo-priority-marker {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.priority-normal {
  background-color: #52c41a;
}

.priority-important {
  background-color: #faad14;
}

.priority-urgent {
  background-color: #f5222d;
}

.todo-edit-input {
  flex: 1;
  min-width: 0;
}

.todo-item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.todo-item:hover .todo-item-actions {
  opacity: 1;
}

.priority-btn:hover,
.delete-btn:hover {
  color: #1890ff;
}

.todo-time {
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
}

.todo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 14px;
}

.todo-stats {
  display: flex;
  gap: 20px;
}

.todo-count {
  color: #606266;
  font-weight: 500;
}

.todo-completed-count {
  color: #909399;
}

.toggle-all-btn {
  transition: all 0.3s ease;
}

/* 动画效果 */
.todo-item-enter-active,
.todo-item-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.todo-item-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.todo-item-leave-to {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}

.todo-item-leave-active {
  position: absolute;
  width: calc(100% - 32px);
  z-index: 10;
}

/* 加载和空状态 */
.loading-spinner,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  color: #909399;
}

.loading-spinner .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}

.empty-state .empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 16px;
}

.empty-state p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 滚动条样式 */
.todo-list::-webkit-scrollbar {
  width: 6px;
}

.todo-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.todo-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.todo-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>