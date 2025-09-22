<template>
  <!-- 番茄钟切换按钮（默认显示） -->
  <div v-if="!isVisible" class="toggle-button" @click="toggleVisibility">
    ⏱️
  </div>
  
  <!-- 悬浮式番茄钟（点击按钮后显示） -->
  <div 
    v-else 
    class="floating-pomodoro" 
    :class="{ minimized: isMinimized }"
  >
    <!-- 头部控制区域 -->
    <div class="pomodoro-header">
      <span class="pomodoro-title">番茄钟</span>
      <div class="header-controls">
        <button 
          class="control-btn minimize-btn"
          @click="toggleMinimize"
          title="最小化"
        >
          {{ isMinimized ? '◼' : '━' }}
        </button>
        <button 
          class="control-btn close-btn"
          @click="toggleVisibility"
          title="关闭"
        >
          ×
        </button>
      </div>
    </div>
    
    <!-- 主体内容区域 -->
    <div v-if="!isMinimized" class="pomodoro-content">
      <!-- 倒计时显示 -->
      <div class="timer-display">
        <div class="timer-circle">
          <div class="timer-time">{{ formattedTime }}</div>
          <div class="timer-mode">{{ currentModeText }}</div>
        </div>
      </div>
      
      <!-- 控制按钮 -->
      <div class="timer-controls">
        <button 
          class="control-btn action-btn"
          :class="{ running: isRunning }"
          @click="toggleTimer"
          :title="isRunning ? '暂停' : '开始'"
        >
          {{ isRunning ? '⏸️' : '▶️' }}
        </button>
        <button 
          class="control-btn action-btn"
          @click="resetTimer"
          title="重置"
        >
          🔄
        </button>
      </div>
      
      <!-- 简单设置 -->
      <div class="timer-settings">
        <div class="setting-item">
          <label>工作:</label>
          <span class="setting-value">{{ workDuration }}m</span>
        </div>
        <div class="setting-item">
          <label>休息:</label>
          <span class="setting-value">{{ shortBreakDuration }}m</span>
        </div>
      </div>
    </div>
    
    <!-- 最小化状态 -->
    <div v-else class="minimized-content">
      <div class="minimized-time">{{ formattedTime }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// 定义Props，接收来自父组件的显示控制
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// 状态变量
const isVisible = ref(props.visible)
const isMinimized = ref(false)
const isRunning = ref(false)
const currentTime = ref(25 * 60) // 默认25分钟
const currentMode = ref('work') // 'work', 'shortBreak', 'longBreak'
const completedPomodoros = ref(0)
let timerInterval = null

// 监听外部visible属性变化
watch(() => props.visible, (newValue) => {
  isVisible.value = newValue
})

// 设置项
const workDuration = ref(25)
const shortBreakDuration = ref(5)
const longBreakDuration = ref(15)

// 计算属性
const formattedTime = computed(() => {
  const minutes = Math.floor(currentTime.value / 60)
  const seconds = currentTime.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const currentModeText = computed(() => {
  const modes = {
    work: '工作中',
    shortBreak: '休息中',
    longBreak: '长休息'
  }
  return modes[currentMode.value]
})

// 工具函数
function getDurationForMode(mode) {
  switch (mode) {
    case 'work':
      return workDuration.value * 60
    case 'shortBreak':
      return shortBreakDuration.value * 60
    case 'longBreak':
      return longBreakDuration.value * 60
    default:
      return 25 * 60
  }
}

function switchToNextMode() {
  if (currentMode.value === 'work') {
    completedPomodoros.value++
    // 每4个番茄钟后是长休息
    if (completedPomodoros.value % 4 === 0) {
      currentMode.value = 'longBreak'
    } else {
      currentMode.value = 'shortBreak'
    }
  } else {
    currentMode.value = 'work'
  }
  
  // 重置当前模式的时长
  currentTime.value = getDurationForMode(currentMode.value)
}

// 控制函数
function toggleTimer() {
  if (isRunning.value) {
    // 暂停计时器
    clearInterval(timerInterval)
  } else {
    // 开始计时器
    timerInterval = setInterval(() => {
      if (currentTime.value > 0) {
        currentTime.value--
      } else {
        // 时间到，切换模式
        clearInterval(timerInterval)
        isRunning.value = false
        playNotificationSound()
        switchToNextMode()
      }
    }, 1000)
  }
  
  isRunning.value = !isRunning.value
}

function resetTimer() {
  clearInterval(timerInterval)
  isRunning.value = false
  currentTime.value = getDurationForMode(currentMode.value)
}

function toggleMinimize() {
  isMinimized.value = !isMinimized.value
}

function toggleVisibility() {
  isVisible.value = !isVisible.value
}

function playNotificationSound() {
  // 简单的提示音
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUcAAAAA')
    audio.play().catch(e => console.log('无法播放提示音:', e))
  } catch (e) {
    console.log('提示音播放失败:', e)
  }
}

// 生命周期钩子
onMounted(() => {
  // 从本地存储加载统计数据
  const savedStats = localStorage.getItem('pomodoroStats')
  if (savedStats) {
    const stats = JSON.parse(savedStats)
    const today = new Date().toDateString()
    if (stats.lastDate === today) {
      completedPomodoros.value = stats.completedPomodoros
    }
  }
})

onUnmounted(() => {
  // 保存统计数据到本地存储
  const today = new Date().toDateString()
  localStorage.setItem('pomodoroStats', JSON.stringify({
    lastDate: today,
    completedPomodoros: completedPomodoros.value
  }))
  
  // 清理计时器
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.floating-pomodoro {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 999; /* 降低z-index，确保不遮挡重要内容 */
  transition: all 0.3s ease;
  width: 140px;
}

.floating-pomodoro.minimized {
  width: 80px;
}

.pomodoro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background-color: #1890ff;
  color: white;
  border-radius: 8px 8px 0 0;
  cursor: grab;
  font-size: 12px;
}

.pomodoro-header:active {
  cursor: grabbing;
}

.pomodoro-title {
  font-size: 12px;
  font-weight: bold;
}

.header-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 1px 4px;
  border-radius: 3px;
  transition: background-color 0.2s;
  font-size: 10px;
}

.control-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.pomodoro-content {
  padding: 10px;
}

.timer-display {
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
}

.timer-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #f0f2f5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid #e6f7ff;
}

.timer-time {
  font-size: 16px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 3px;
}

.timer-mode {
  font-size: 10px;
  color: #666;
}

.timer-controls {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn:not(.running) {
  background-color: #1890ff;
  color: white;
}

.action-btn.running {
  background-color: #ff4d4f;
  color: white;
}

.action-btn:hover {
  transform: scale(1.05);
}

.timer-settings {
  display: flex;
  justify-content: space-around;
  gap: 6px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.setting-item label {
  font-size: 9px;
  color: #999;
  margin-bottom: 1px;
}

.setting-value {
  font-size: 10px;
  color: #666;
  font-weight: bold;
}

.minimized-content {
  padding: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.minimized-time {
  font-size: 12px;
  font-weight: bold;
  color: #1890ff;
}

.toggle-button {
  position: fixed;
  bottom: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #1890ff;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 1000;
}

.toggle-button:hover {
  background-color: #40a9ff;
  transform: scale(1.05);
}
</style>