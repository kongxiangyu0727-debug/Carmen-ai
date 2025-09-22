<template>
  <div class="navigation-menu-container">
    <div class="app-title">知行象限</div>
    <div class="navigation-menu">
      <!-- 笔记导航 -->
      <div class="menu-item" v-for="item in menuItems" :key="item.id">
        <div 
          class="menu-trigger" 
          @click="toggleSubmenu(item.id)"
          :class="{ 'active': activeMenu === item.id || activeTab === item.id }"
        >
          <span class="menu-icon" v-if="item.icon">{{ item.icon }}</span>
          <span class="menu-text">{{ item.label }}</span>
          <span class="menu-arrow" v-if="item.subItems && item.subItems.length > 0">
            {{ activeMenu === item.id ? '▼' : '▶' }}
          </span>
        </div>
        <!-- 子菜单 -->
        <div 
          class="sub-menu" 
          v-if="item.subItems && item.subItems.length > 0 && activeMenu === item.id"
        >
          <div 
            class="sub-menu-item"
            v-for="subItem in item.subItems"
            :key="subItem.id"
            @click="handleSubItemClick(subItem)"
          >
            <span class="sub-menu-icon" v-if="subItem.icon">{{ subItem.icon }}</span>
            <span class="sub-menu-text">{{ subItem.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { useNoteStore } from '../stores/note'

// 定义Props，接收activeTab
const props = defineProps({
  activeTab: {
    type: String,
    default: 'notes'
  }
})

// 定义Emits，用于通知父组件切换标签和控制工具显示
const emit = defineEmits(['switchTab', 'togglePomodoro', 'toggleTagManager'])

// 状态管理
const activeMenu = ref(null)
const noteStore = useNoteStore()

// 菜单数据
const menuItems = [
  {
    id: 'notes',
    label: '笔记',
    icon: '📝',
    action: () => switchTab('notes')
  },
  {
    id: 'todos',
    label: '待办',
    icon: '✅',
    action: () => switchTab('todos')
  },
  {
    id: 'projects',
    label: '项目管理',
    icon: '📋',
    action: () => switchTab('projects')
  },
  {
    id: 'chat',
    label: 'AI副驾',
    icon: '🤖',
    action: () => switchTab('chat')
  },
  {
    id: 'calendar',
    label: '日历',
    icon: '📅',
    action: () => switchTab('calendar')
  },
  {
    id: 'tools',
    label: '工具',
    icon: '🔧',
    subItems: [
      {
        id: 'pomodoro',
        label: '番茄钟',
        icon: '⏱️',
        action: () => togglePomodoro()
      },
      {
        id: 'tagManager',
        label: '标签管理',
        icon: '🏷️',
        action: () => openTagManager()
      }
    ]
  }
]

// 切换菜单
const toggleSubmenu = (menuId) => {
  activeMenu.value = activeMenu.value === menuId ? null : menuId
  
  // 如果是主菜单项且有action，则执行action
  const menuItem = menuItems.find(item => item.id === menuId)
  if (menuItem && !menuItem.subItems && menuItem.action) {
    menuItem.action()
  }
}

// 处理子菜单项点击
const handleSubItemClick = (subItem) => {
  if (subItem.action) {
    subItem.action()
  }
  activeMenu.value = null
}

// 切换标签页
const switchTab = (tabValue) => {
  // 通知父组件切换标签
  emit('switchTab', tabValue)
}

// 切换番茄钟显示状态
const togglePomodoro = () => {
  emit('togglePomodoro')
}

// 打开标签管理
const openTagManager = () => {
  emit('toggleTagManager')
}
</script>

<style scoped>
.navigation-menu-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.navigation-menu {
  display: flex;
  gap: 10px;
  position: relative;
}

.menu-item {
  position: relative;
}

.menu-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f5f7fa;
  border: 1px solid transparent;
}

.menu-trigger:hover {
  background-color: #e6f7ff;
  border-color: #91d5ff;
}

.menu-trigger.active {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.menu-icon {
  font-size: 16px;
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
}

.menu-arrow {
  font-size: 12px;
  margin-left: 4px;
}

.sub-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background-color: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 160px;
  z-index: 1000;
}

.sub-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.sub-menu-item:hover {
  background-color: #f5f7fa;
  color: #1890ff;
}

.sub-menu-icon {
  font-size: 14px;
}

.sub-menu-text {
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navigation-menu-container {
    flex-direction: column;
    height: auto;
    padding: 10px;
    gap: 10px;
  }
  
  .navigation-menu {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .app-title {
    font-size: 20px;
  }
}
</style>