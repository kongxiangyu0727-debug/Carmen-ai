<template>
  <div class="chat-container">
    <div class="chat-header">
      <h2>AI对话助手</h2>
      <div class="chat-controls">
        <el-select 
          v-model="selectedModel"
          placeholder="选择模型"
          size="small"
          class="model-select"
          @change="handleModelChange"
        >
          <el-option label="GPT-3.5-Turbo" value="openai/gpt-3.5-turbo" />
          <el-option label="GPT-4" value="openai/gpt-4" />
          <el-option label="GPT-5" value="openai/gpt-5" />
          <el-option label="Claude Sonnet 4" value="anthropic/claude-sonnet-4" />
        </el-select>
        <el-button 
          type="default" 
          size="small" 
          @click="clearChat"
          class="control-btn"
          :disabled="messages.length === 0"
        >
          <el-icon><RefreshRight /></el-icon>
          清空
        </el-button>
        <el-button 
          type="default" 
          size="small" 
          @click="exportChat"
          class="control-btn"
          :disabled="messages.length === 0"
        >
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>
    
    <!-- 对话消息区域 -->
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-chat">
        <div class="empty-icon">
          <el-icon name="el-icon--robot" />
        </div>
        <h3>欢迎使用AI对话助手</h3>
        <p>开始与AI助手对话，获取智能回答</p>
        <div class="quick-prompts">
          <el-button type="text" size="small" @click="sendQuickPrompt('解释量子计算的基本原理')">解释量子计算</el-button>
          <el-button type="text" size="small" @click="sendQuickPrompt('如何提高编程效率？')">提高编程效率</el-button>
          <el-button type="text" size="small" @click="sendQuickPrompt('写一首关于技术的诗')">写一首诗</el-button>
        </div>
      </div>
      
      <div v-for="(message, index) in messages" :key="index" class="message-wrapper animate-fade-in">
        <!-- 用户消息 -->
        <div v-if="message.role === 'user'" class="message user-message">
          <div class="message-avatar user-avatar">
            <el-icon><User /></el-icon>
          </div>
          <div class="message-content">
            <div class="message-bubble user-bubble">
              <pre>{{ message.content }}</pre>
            </div>
            <div class="message-time">{{ formatMessageTime(message.timestamp) }}</div>
          </div>
        </div>
        
        <!-- AI消息 -->
        <div v-else class="message ai-message">
          <div class="message-avatar ai-avatar">
            <el-icon><Document /></el-icon>
          </div>
          <div class="message-content">
            <div v-if="message.loading" class="loading-indicator">
              <el-loading :visible="true" text="AI思考中..." />
            </div>
            <div v-else>
              <div class="message-bubble ai-bubble">
                <div v-html="formatMessage(message.content)"></div>
              </div>
              <div class="message-actions">
                <el-button type="text" size="small" @click="copyMessage(message.content)">
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
                <el-button type="text" size="small" @click="thumbsUpMessage(index)">
                  <el-icon><Flag /></el-icon>
                </el-button>
                <el-button type="text" size="small" @click="continueConversation(message.id)">
                  <el-icon><ChatDotRound /></el-icon>
                  追问
                </el-button>
              </div>
              <div class="message-time">{{ formatMessageTime(message.timestamp) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="chat-input-container">
      <div class="input-toolbar">
        <el-button type="text" size="small" @click="pasteFromClipboard" title="粘贴剪贴板内容">
          <el-icon><CopyDocument /></el-icon>
        </el-button>
        <el-button type="text" size="small" @click="uploadFile" title="上传文件">
          <el-icon><Upload /></el-icon>
        </el-button>
        <el-button type="text" size="small" @click="showQuickPrompts = !showQuickPrompts" title="快捷提示词">
          <el-icon><HelpFilled /></el-icon>
        </el-button>
        <input type="file" ref="fileInput" style="display: none;" @change="handleFileUpload">
        
        <!-- 快捷提示词 -->
        <div v-if="showQuickPrompts" class="quick-prompts-dropdown">
          <div class="prompt-item" v-for="prompt in quickPrompts" :key="prompt.id" @click="sendQuickPrompt(prompt.text)">
            {{ prompt.text }}
          </div>
        </div>
      </div>
      <el-input
        v-model="inputMessage"
        type="textarea"
        :rows="4"
        placeholder="输入您的问题或消息...按Shift+Enter换行，Enter发送"
        @keyup.enter.exact="sendMessage"
        @keyup.enter.shift="handleNewLine"
        :disabled="isSending"
        class="chat-textarea"
      />
      <div class="chat-input-actions">
        <span class="tip">Shift+Enter 换行 | Enter 发送</span>
        <el-button 
          type="primary" 
          @click="sendMessage"
          :disabled="!inputMessage.trim() || isSending"
          :loading="isSending"
          class="send-button"
        >
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElInput, ElButton, ElEmpty, ElLoading, ElSelect, ElOption, ElMessage } from 'element-plus'
import { User, Document, RefreshRight, Download, Upload, HelpFilled, CopyDocument, Flag, ChatDotRound } from '@element-plus/icons-vue'
import { useAIService } from '../services/ai'
import { useSettingStore } from '../stores/setting'
import axios from 'axios'

const aiService = useAIService()
const settingStore = useSettingStore()
const messagesContainer = ref(null)
const messages = ref([])
const inputMessage = ref('')
const isSending = ref(false)
const selectedModel = ref(settingStore.preferredModel)
const showQuickPrompts = ref(false)
const quickPrompts = ref([
  { id: 1, text: '解释量子计算的基本原理' },
  { id: 2, text: '如何提高编程效率？' },
  { id: 3, text: '写一首关于技术的诗' },
  { id: 4, text: '生成一个项目的README模板' },
  { id: 5, text: '如何优化网站性能？' },
  { id: 6, text: '解释机器学习的基本概念' }
])
const fileInput = ref(null)

// 监听模型变化
watch(
  () => settingStore.preferredModel,
  (newModel) => {
    selectedModel.value = newModel
  }
)

// 监听消息变化，自动滚动到底部
watch(
  () => messages.value,
  async () => {
    await nextTick()
    scrollToBottom()
  },
  { deep: true }
)

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化消息内容（支持Markdown）
const formatMessage = (content) => {
  // 简单的Markdown解析
  if (!content) return ''
  
  let formatted = content
    // 代码块
    .replace(/```([\s\S]*?)```/g, '<pre class="code-block">$1</pre>')
    // 标题
    .replace(/#{1,6}\s+(.*?)(?=\n|$)/g, '<h$1>$2</h$1>')
    // 粗体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 链接
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
    // 列表
    .replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>')
    .replace(/<li>(.*?)<\/li>/gs, '<ul>$&</ul>')
    // 段落
    .replace(/^(?!<[h|ul|pre])(.*?)$/gm, '<p>$1</p>')
    // 换行
    .replace(/\n/g, '<br>')
  
  return formatted
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isSending.value) return
  
  const content = inputMessage.value.trim()
  inputMessage.value = ''
  isSending.value = true
  showQuickPrompts.value = false
  
  // 添加用户消息
  const timestamp = new Date().toISOString()
  messages.value.push({
    id: `msg-${Date.now()}-user`,
    role: 'user',
    content: content,
    timestamp: timestamp
  })
  
  // 确保消息数量不超过50条
  if (messages.value.length > 50) {
    messages.value.shift()
  }
  
  // 添加AI消息占位符
  const aiMessageIndex = messages.value.length
  messages.value.push({
    id: `msg-${Date.now()}-ai`,
    role: 'assistant',
    content: '',
    loading: true,
    timestamp: new Date().toISOString()
  })
  
  try {
    // 发送请求给AI服务
    const aiResponse = await getChatResponse(content)
    
    // 更新AI消息
    messages.value[aiMessageIndex] = {
      id: `msg-${Date.now()}-ai`,
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
      liked: false
    }
  } catch (error) {
    // 错误处理
    messages.value[aiMessageIndex] = {
      role: 'assistant',
      content: `错误: ${error.message || 'AI服务请求失败'}`
    }
    console.error('AI对话失败:', error)
  } finally {
    isSending.value = false
  }
}

// 发送快捷提示词
const sendQuickPrompt = (prompt) => {
  inputMessage.value = prompt
  sendMessage()
}

// 处理文件上传
const uploadFile = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 这里可以添加文件处理逻辑
  ElMessage.info(`文件 ${file.name} 已上传`)
  // 重置input，以便可以再次选择同一个文件
  event.target.value = ''
}

// 从剪贴板插入内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputMessage.value += text
    ElMessage.success('已从剪贴板粘贴')
  } catch (err) {
    ElMessage.error('无法访问剪贴板')
  }
}

// 处理换行
const handleNewLine = (event) => {
  // 允许在按下Shift+Enter时换行
  // 由于我们在模板中使用了@keyup.enter.shift="handleNewLine"，
  // Vue会自动处理这个行为，这里只是为了确保不阻止默认行为
}

// 追问功能
const continueConversation = (messageId) => {
  const message = messages.value.find(m => m.id === messageId)
  if (message && message.role === 'assistant') {
    inputMessage.value = `继续关于"${getFirstFewWords(message.content)}"的讨论`
    // 聚焦到输入框
    nextTick(() => {
      const textarea = document.querySelector('.chat-textarea textarea')
      if (textarea) {
        textarea.focus()
      }
    })
  }
}

// 获取文本前几个字
const getFirstFewWords = (text) => {
  const plainText = text.replace(/<[^>]*>/g, '').trim()
  return plainText.length > 20 ? plainText.substring(0, 20) + '...' : plainText
}

// 复制消息内容
const copyMessage = async (content) => {
  try {
    // 移除HTML标签
    const plainText = content.replace(/<[^>]*>/g, '').trim()
    await navigator.clipboard.writeText(plainText)
    ElMessage.success('已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

// 点赞消息
const thumbsUpMessage = (index) => {
  if (messages.value[index] && messages.value[index].role === 'assistant') {
    messages.value[index].liked = !messages.value[index].liked
  }
}

// 导出对话
const exportChat = () => {
  const chatContent = messages.value.map(msg => {
    const role = msg.role === 'user' ? '用户' : 'AI'
    const content = msg.content.replace(/<[^>]*>/g, '')
    return `${role}: ${content}\n`
  }).join('\n')
  
  const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ai_chat_${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('对话已导出')
}

// 格式化消息时间
const formatMessageTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) {
    return '刚刚'
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`
  } else if (diffMins < 1440) {
    return `${Math.floor(diffMins / 60)}小时前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }
}

// 获取AI对话响应
const getChatResponse = async (message) => {
  try {
    // 构造消息历史
    const messageHistory = messages.value
      .filter(m => !m.loading) // 过滤掉加载中的消息
      .map(m => ({ role: m.role, content: m.content }))
      .slice(-10) // 只保留最近10条消息以避免上下文过长
      .concat([{ role: 'user', content: message }])
      
    // 使用axios而不是fetch，保持与ai.js服务的一致性
    const config = aiService.getApiConfig()
    const response = await axios.post(
      aiService.apiBaseUrl,
      {
        model: selectedModel.value,
        messages: messageHistory,
        max_tokens: 1000,
        temperature: 0.7
      },
      config
    )
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content.trim()
    } else {
      throw new Error('AI响应格式不正确')
    }
  } catch (error) {
    console.error('获取AI响应失败:', error)
    if (error.response) {
      throw new Error(`API错误: ${error.response.status} - ${error.response.data?.error?.message || '未知错误'}`)
    }
    throw error
  }
}

// 清空对话
const clearChat = () => {
  messages.value = []
}

// 处理模型切换
const handleModelChange = async (model) => {
  await settingStore.setPreferredModel(model)
}

// 组件挂载时检查API密钥
onMounted(() => {
  if (!settingStore.apiKey) {
    messages.value.push({
      id: `msg-welcome`,
      role: 'assistant',
      content: '欢迎使用AI对话助手！请先在设置中配置OpenRouter API密钥。' 
    })
  }
  
  // 添加键盘事件监听，优化用户体验
  const handleKeyDown = (event) => {
    // 如果正在输入内容，不拦截Esc键
    const textarea = document.querySelector('.chat-textarea textarea')
    if (textarea && document.activeElement === textarea) {
      return
    }
    
    // 按下Esc键时隐藏快捷提示词
    if (event.key === 'Escape' && showQuickPrompts.value) {
      showQuickPrompts.value = false
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  
  // 组件卸载时移除事件监听
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
})
</script>

<style scoped>
.chat-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px 12px 0 0;
  color: white;
}

.chat-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.chat-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.model-select {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.control-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.6);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #fafbfc;
  background-image: radial-gradient(#e0e0e0 1px, transparent 1px);
  background-size: 20px 20px;
}

/* 空状态样式 */
.empty-chat {
  padding: 60px 20px;
  text-align: center;
  color: #606266;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  color: #c0c4cc;
  animation: pulse 2s ease-in-out infinite;
}

.empty-chat h3 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 18px;
}

.empty-chat p {
  margin: 0 0 20px 0;
  color: #909399;
}

/* 快捷提示词 */
.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.quick-prompts button {
  background: #f0f2f5;
  border: 1px solid #dcdfe6;
  color: #606266;
  transition: all 0.3s ease;
}

.quick-prompts button:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
}

/* 消息样式 */
.message-wrapper {
  margin-bottom: 20px;
  animation: fadeInUp 0.3s ease-out;
}

.animate-fade-in {
  animation: fadeInUp 0.3s ease-out;
}

.message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  max-width: 100%;
}

.message-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 18px;
  transition: transform 0.2s ease;
}

.message-avatar:hover {
  transform: scale(1.05);
}

.user-avatar {
  background-color: #409eff;
  color: white;
}

.ai-avatar {
  background-color: #67c23a;
  color: white;
}

.message-content {
  flex: 1;
  word-break: break-word;
  min-width: 0;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  line-height: 1.5;
  max-width: 85%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.user-bubble {
  background-color: #409eff;
  color: white;
  margin-left: auto;
  border-bottom-right-radius: 6px;
}

.ai-bubble {
  background-color: #fff;
  color: #303133;
  border: 1px solid #ebeef5;
  border-bottom-left-radius: 6px;
}

.message-content pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
}

.code-block {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  margin: 10px 0;
  border: 1px solid #e0e0e0;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  margin-left: auto;
  text-align: right;
  width: 85%;
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  width: fit-content;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.message-wrapper:hover .message-actions {
  opacity: 1;
}

.loading-indicator {
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #fff;
  border-radius: 18px;
  border-bottom-left-radius: 6px;
  border: 1px solid #ebeef5;
}

/* 输入区域样式 */
.chat-input-container {
  margin-top: auto;
  padding: 20px;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 0 0 12px 12px;
}

.input-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
  padding-left: 4px;
}

.input-toolbar button {
  color: #606266;
  font-size: 18px;
  transition: color 0.3s ease;
  padding: 4px;
  border-radius: 4px;
}

.input-toolbar button:hover {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
}

.chat-textarea {
  border-radius: 8px !important;
  border: 1px solid #dcdfe6 !important;
  transition: all 0.3s ease !important;
}

.chat-textarea:hover {
  border-color: #c0c4cc !important;
}

.chat-textarea:focus-within {
  border-color: #409eff !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
}

.chat-textarea textarea {
  resize: none;
  font-size: 14px;
  line-height: 1.5;
}

.chat-input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.tip {
  color: #909399;
  font-size: 12px;
}

.send-button {
  background: linear-gradient(135deg, #409eff 0%, #667eea 100%);
  border: none;
  padding: 8px 24px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.send-button:hover {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  transform: translateY(-1px);
}

.send-button:active {
  transform: translateY(0);
}

/* 快捷提示词下拉菜单 */
.quick-prompts-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  padding: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  min-width: 200px;
}

.prompt-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.prompt-item:hover {
  background-color: #f0f2f5;
  color: #409eff;
}

/* 自定义滚动条 */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-container {
    border-radius: 0;
  }
  
  .chat-header {
    padding: 15px;
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
    border-radius: 0;
  }
  
  .chat-header h2 {
    text-align: center;
  }
  
  .chat-controls {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .model-select {
    flex: 1;
    min-width: 180px;
  }
  
  .chat-messages {
    padding: 15px;
  }
  
  .message-bubble {
    max-width: 90%;
    padding: 10px 14px;
  }
  
  .chat-input-container {
    padding: 15px;
    border-radius: 0;
  }
  
  .chat-input-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .send-button {
    width: 100%;
  }
}

/* 在大屏幕上优化显示 */
@media (min-width: 1024px) {
  .message-bubble {
    max-width: 70%;
  }
}

/* Markdown样式增强 */
.message-content h1, .message-content h2, .message-content h3 {
  margin: 16px 0 8px 0;
  color: inherit;
}

.message-content h1 {
  font-size: 20px;
}

.message-content h2 {
  font-size: 18px;
}

.message-content h3 {
  font-size: 16px;
}

.message-content p {
  margin: 8px 0;
  color: inherit;
}

.message-content ul {
  margin: 8px 0;
  padding-left: 24px;
}

.message-content a {
  color: #409eff;
  text-decoration: none;
}

.message-content a:hover {
  text-decoration: underline;
}

.message-content strong {
  font-weight: 600;
}

.message-content em {
  font-style: italic;
}
</style>