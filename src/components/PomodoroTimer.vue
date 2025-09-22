<template>
  <div class="pomodoro-container">
    <h2>番茄钟</h2>
    
    <div class="timer-display">
      <div class="timer-circle">
        <div class="timer-time">{{ formattedTime }}</div>
        <div class="timer-mode">{{ currentModeText }}</div>
      </div>
    </div>
    
    <div class="timer-controls">
      <el-button 
        :type="isRunning ? 'danger' : 'primary'"
        :disabled="!canToggle"
        @click="toggleTimer"
      >
        {{ isRunning ? '暂停' : '开始' }}
      </el-button>
      
      <el-button 
        type="default"
        :disabled="!canReset"
        @click="resetTimer"
      >
        重置
      </el-button>
    </div>
    
    <div class="timer-settings">
      <div class="setting-item">
        <label>工作时长(分钟):</label>
        <el-input-number 
          v-model="workDuration"
          :min="5"
          :max="60"
          :step="5"
          :disabled="isRunning"
        />
      </div>
      
      <div class="setting-item">
        <label>休息时长(分钟):</label>
        <el-input-number 
          v-model="shortBreakDuration"
          :min="1"
          :max="20"
          :step="1"
          :disabled="isRunning"
        />
      </div>
      
      <div class="setting-item">
        <label>长休息时长(分钟):</label>
        <el-input-number 
          v-model="longBreakDuration"
          :min="10"
          :max="40"
          :step="5"
          :disabled="isRunning"
        />
      </div>
    </div>
    
    <div class="pomodoro-stats">
      <div class="stats-item">
        <span class="stats-label">今日完成番茄钟:</span>
        <span class="stats-value">{{ completedPomodoros }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElButton, ElInputNumber } from 'element-plus'
import { useSettingStore } from '../stores/setting'

// 存储
const settingStore = useSettingStore()

// 状态变量
const isRunning = ref(false)
const currentTime = ref(25 * 60) // 默认25分钟
const currentMode = ref('work') // 'work', 'shortBreak', 'longBreak'
const completedPomodoros = ref(0)
let timerInterval = null

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
    work: '工作时间',
    shortBreak: '短休息',
    longBreak: '长休息'
  }
  return modes[currentMode.value]
})

const canToggle = computed(() => {
  return currentTime.value > 0
})

const canReset = computed(() => {
  return !isRunning.value || currentTime.value < getDurationForMode(currentMode.value)
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

function playNotificationSound() {
  // 简单的提示音，可以根据需要替换为其他方式
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
.pomodoro-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  max-width: 500px;
  margin: 0 auto;
  height: 100%;
}

.pomodoro-container h2 {
  color: #1890ff;
  margin-bottom: 30px;
}

.timer-display {
  margin-bottom: 30px;
}

.timer-circle {
  width: 250px;
  height: 250px;
  border-radius: 50%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  border: 4px solid #e6f7ff;
  transition: all 0.3s ease;
}

.timer-time {
  font-size: 48px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 10px;
}

.timer-mode {
  font-size: 18px;
  color: #666;
}

.timer-controls {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.timer-settings {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  max-width: 300px;
  margin-bottom: 30px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-item label {
  font-size: 14px;
  color: #666;
}

.pomodoro-stats {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #e6e6e6;
  width: 100%;
}

.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-label {
  font-size: 14px;
  color: #666;
}

.stats-value {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
}
</style>