<template>
  <div class="app-container">

    
    <!-- 悬浮式番茄钟组件 -->
    <FloatingPomodoro :visible="isPomodoroVisible" />
    
    <!-- 顶部导航栏 - 新的导航菜单 -->
    <NavigationMenu 
      :activeTab="activeTab" 
      @switchTab="switchTab" 
      @togglePomodoro="togglePomodoro" 
      @toggleTagManager="toggleTagManager" 
    />
    
    <!-- 顶部导航栏 - 保留原始导航栏作为备用 -->
    <div class="app-header-original">
      <div class="app-title">知行象限</div>
      <div class="app-nav">
        <el-button
          v-for="tab in tabs"
          :key="tab.value"
          :type="activeTab === tab.value ? 'primary' : 'default'"
          @click="switchTab(tab.value)"
        >
          {{ tab.label }}
        </el-button>
      </div>
    </div>
    
    <!-- 主内容区域 -->
    <div class="app-main">
      
      <!-- 笔记模式 -->
      <div v-if="activeTab === 'notes'" class="notes-layout">
        <!-- 左侧笔记列表区域 -->
        <LeftSidebar />
        
        <!-- 右侧编辑器区域 -->
        <MainEditor />
      </div>
      
      <!-- 待办事项模式 -->
      <div v-else-if="activeTab === 'todos'" class="todos-layout">
        <!-- 待办事项列表 -->
        <TodoList />
      </div>
      
      <!-- AI对话模式 -->
      <div v-else-if="activeTab === 'chat'" class="chat-layout">
        <!-- AI对话组件 -->
        <AIChat />
      </div>
      
      <!-- 项目管理模式 -->
      <div v-else-if="activeTab === 'projects'" class="projects-layout">
        <!-- 项目管理组件 -->
        <ProjectManagement />
      </div>
      
      <!-- 日历模式 -->
      <div v-else-if="activeTab === 'calendar'" class="calendar-layout">
        <!-- 日历组件 -->
        <CalendarComponent />
      </div>
    </div>
    
    <!-- 标签管理弹窗 -->
    <TagManager v-model:visible="isTagManagerVisible" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElButton } from 'element-plus'
import LeftSidebar from './components/LeftSidebar.vue'
import MainEditor from './components/MainEditor.vue'
import TagManager from './components/TagManager.vue'
import TodoList from './components/TodoList.vue'
import AIChat from './components/AIChat.vue'
import CalendarComponent from './components/Calendar.vue' // 重命名以避免与图标冲突
import FloatingPomodoro from './components/FloatingPomodoro.vue'
import TestButton from './components/TestButton.vue'
import ProjectManagement from './components/ProjectManagement.vue'
import NavigationMenu from './components/NavigationMenu.vue'

// 导航标签
const tabs = [
  { label: '笔记', value: 'notes' },
  { label: '待办', value: 'todos' },
  { label: '项目管理', value: 'projects' },
  { label: 'AI对话', value: 'chat' },
  { label: '日历', value: 'calendar' }
]

// 当前激活的标签
const activeTab = ref('notes')

// 番茄钟显示状态
const isPomodoroVisible = ref(false)

// 标签管理显示状态
const isTagManagerVisible = ref(false)

// 切换标签
const switchTab = (tabValue) => {
  activeTab.value = tabValue
}

// 切换番茄钟显示状态
const togglePomodoro = () => {
  isPomodoroVisible.value = !isPomodoroVisible.value
}

// 切换标签管理显示状态
const toggleTagManager = () => {
  isTagManagerVisible.value = !isTagManagerVisible.value
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

.app-header-original {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  /* 默认隐藏原始导航栏 */
  display: none;
}

.app-title {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  padding: 5px 0;
  letter-spacing: 1px;
}

.app-nav {
  display: flex;
  gap: 10px;
}

.app-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.notes-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

.todos-layout {
  display: flex;
  width: 100%;
  height: 100%;
  padding: 20px;
}

.chat-layout {
  display: flex;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.calendar-layout {
  display: flex;
  width: 100%;
  height: 100%;
  padding: 20px;
}

.projects-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    height: auto;
    padding: 10px;
    gap: 10px;
  }
  
  .app-nav {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .todos-layout {
    padding: 10px;
  }
}
</style>