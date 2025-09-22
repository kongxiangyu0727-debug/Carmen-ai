<template>
  <div class="note-editor">
    <!-- 格式化工具栏 -->
    <div class="editor-toolbar" v-if="noteStore.currentNote">
      <el-button type="text" size="small" @click="formatText('bold')" title="加粗 (Ctrl+B)">
        <i class="el-icon-bold"></i>
      </el-button>
      <el-button type="text" size="small" @click="formatText('italic')" title="斜体 (Ctrl+I)">
        <i class="el-icon-italic"></i>
      </el-button>
      <el-button type="text" size="small" @click="formatText('underline')" title="下划线 (Ctrl+U)">
        <i class="el-icon-underline"></i>
      </el-button>
      <el-divider direction="vertical"></el-divider>
      <el-button type="text" size="small" @click="formatText('insertUnorderedList')" title="无序列表">
        <i class="el-icon-list"></i>
      </el-button>
      <el-button type="text" size="small" @click="formatText('insertOrderedList')" title="有序列表">
        <i class="el-icon-s-order"></i>
      </el-button>
      <el-divider direction="vertical"></el-divider>
      <el-button type="text" size="small" @click="insertLink" title="插入链接 (Ctrl+K)">
        <i class="el-icon-link"></i>
      </el-button>
      <el-button type="text" size="small" @click="insertImage" title="插入图片">
        <i class="el-icon-picture"></i>
      </el-button>
      <el-divider direction="vertical"></el-divider>
      <el-button type="text" size="small" @click="clearFormat" title="清除格式">
        <i class="el-icon-refresh-left"></i>
      </el-button>
      <span class="auto-save-status" v-if="saveStatus">
        <i :class="saveStatus === 'saving' ? 'el-icon-loading' : 'el-icon-success'" class="icon"></i>
        <span>{{ saveStatus === 'saving' ? '保存中...' : '已保存' }}</span>
      </span>
    </div>
    
    <!-- 编辑器内容区域 -->
    <div 
      ref="editorContainer"
      class="editor-content"
      @keydown="handleKeyDown"
      @contextmenu="handleContextMenu"
      contenteditable="true"
      :data-placeholder="placeholderText"
    ></div>
    
    <!-- 右键菜单 -->
    <div 
      v-if="showContextMenu"
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="handleRewrite">润色文本</div>
      <div class="menu-item" @click="handleGenerateSummary">生成摘要</div>
      <el-divider></el-divider>
      <div class="menu-item" @click="formatSelectedText('bold')">加粗</div>
      <div class="menu-item" @click="formatSelectedText('italic')">斜体</div>
      <div class="menu-item" @click="formatSelectedText('underline')">下划线</div>
      <el-divider></el-divider>
      <div class="menu-item" @click="insertLinkAtSelection">插入链接</div>
    </div>
    
    <!-- 编辑器提示 -->
    <div class="editor-tips" v-if="!editorContainer.value?.textContent.trim()">
      <p>📝 开始输入笔记内容</p>
      <p class="shortcut-tips">• Tab 键：AI续写 • Ctrl+B/I/U：加粗/斜体/下划线 • Ctrl+K：插入链接</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useNoteStore } from '../../stores/note'
import { useAIService } from '../../services/ai'
import { ElButton, ElDivider, ElMessageBox, ElInput, ElMessage } from 'element-plus'

const noteStore = useNoteStore()
const aiService = useAIService()

const editorContainer = ref(null)
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const selectedText = ref('')
const saveStatus = ref(null)
const placeholderText = '开始输入你的笔记内容...'

// 防抖自动保存
let saveTimeout = null
const debouncedSave = (content) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(() => {
    if (noteStore.currentNote) {
      saveStatus.value = 'saving'
      noteStore.updateNoteContent(noteStore.currentNote.id, content)
        .then(() => {
          saveStatus.value = 'saved'
          // 2秒后隐藏保存状态
          setTimeout(() => {
            if (saveStatus.value === 'saved') {
              saveStatus.value = null
            }
          }, 2000)
        })
        .catch(() => {
          saveStatus.value = null
        })
    }
  }, 2000)
}

// 处理编辑器内容变化
const handleEditorInput = () => {
  if (editorContainer.value) {
    const content = editorContainer.value.innerHTML
    debouncedSave(content)
  }
}

// 监听当前笔记变化，更新编辑器内容
watch(() => noteStore.currentNote, (newNote) => {
  if (editorContainer.value) {
    editorContainer.value.innerHTML = newNote?.content || ''
  }
}, { immediate: true })

// 处理键盘事件
const handleKeyDown = (event) => {
  // Tab 键续写
  if (event.key === 'Tab' && !event.shiftKey) {
    event.preventDefault()
    triggerAIContinuation()
  }
  
  // 快捷键处理
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 'b':
        event.preventDefault()
        formatText('bold')
        break
      case 'i':
        event.preventDefault()
        formatText('italic')
        break
      case 'u':
        event.preventDefault()
        formatText('underline')
        break
      case 'k':
        event.preventDefault()
        insertLink()
        break
    }
  }
}

// 处理右键菜单
const handleContextMenu = (event) => {
  const selection = window.getSelection()
  const text = selection.toString().trim()
  
  event.preventDefault()
  selectedText.value = text
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  showContextMenu.value = true
}

// 关闭右键菜单
const closeContextMenu = () => {
  showContextMenu.value = false
}

// 触发AI续写
const triggerAIContinuation = async () => {
  if (editorContainer.value && noteStore.currentNote) {
    const content = editorContainer.value.textContent
    
    try {
      // 显示加载状态
      editorContainer.value.contentEditable = false
      editorContainer.value.style.cursor = 'wait'
      
      // 显示AI思考中提示
      const selection = window.getSelection()
      let range = null
      const thinkingNode = document.createElement('span')
      thinkingNode.className = 'ai-thinking'
      thinkingNode.innerHTML = '<i class="el-icon-loading"></i> AI思考中...'
      
      if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0)
        range.insertNode(thinkingNode)
        range.setStartAfter(thinkingNode)
        range.setEndAfter(thinkingNode)
        selection.removeAllRanges()
        selection.addRange(range)
      }
      
      // 调用AI服务进行续写
      const continuation = await aiService.continueText(content)
      
      // 移除思考提示
      if (thinkingNode.parentNode) {
        thinkingNode.parentNode.removeChild(thinkingNode)
      }
      
      // 插入续写内容
      if (range) {
        const textNode = document.createTextNode('\n' + continuation)
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.setEndAfter(textNode)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        editorContainer.value.innerHTML += '\n' + continuation
      }
      
      // 保存更新后的内容
      handleEditorInput()
    } catch (error) {
      console.error('AI续写失败:', error)
      ElMessage.error('AI续写失败，请检查API配置')
    } finally {
      editorContainer.value.contentEditable = true
      editorContainer.value.style.cursor = 'text'
    }
  }
}

// 处理文本润色
const handleRewrite = async () => {
  if (!selectedText.value) return
  
  try {
    showContextMenu.value = false
    
    // 显示加载状态
    editorContainer.value.contentEditable = false
    editorContainer.value.style.cursor = 'wait'
    
    // 调用AI服务进行润色
    const rewrittenText = await aiService.rewriteText(selectedText.value)
    
    // 替换选中文本
    const selection = window.getSelection()
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
    
    if (range) {
      const textNode = document.createTextNode(rewrittenText)
      range.deleteContents()
      range.insertNode(textNode)
      range.setStart(textNode, 0)
      range.setEnd(textNode, textNode.length)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    
    // 保存更新后的内容
    handleEditorInput()
    ElMessage.success('文本润色成功')
  } catch (error) {
    console.error('文本润色失败:', error)
    ElMessage.error('文本润色失败，请检查API配置')
  } finally {
    editorContainer.value.contentEditable = true
    editorContainer.value.style.cursor = 'text'
  }
}

// 处理生成摘要
const handleGenerateSummary = async () => {
  if (noteStore.currentNote) {
    try {
      showContextMenu.value = false
      
      // 显示加载状态
      editorContainer.value.contentEditable = false
      editorContainer.value.style.cursor = 'wait'
      
      // 调用AI服务生成摘要
      const summary = await aiService.generateSummary(noteStore.currentNote.content)
      
      // 保存摘要到笔记
      await noteStore.updateNoteSummary(noteStore.currentNote.id, summary)
      ElMessage.success('摘要生成成功')
    } catch (error) {
      console.error('生成摘要失败:', error)
      ElMessage.error('生成摘要失败，请检查API配置')
    } finally {
      editorContainer.value.contentEditable = true
      editorContainer.value.style.cursor = 'text'
    }
  }
}

// 文本格式化函数
const formatText = (command) => {
  document.execCommand(command, false, null)
  editorContainer.value.focus()
  handleEditorInput()
}

// 格式化选中文本
const formatSelectedText = (command) => {
  document.execCommand(command, false, null)
  closeContextMenu()
  handleEditorInput()
}

// 插入链接
const insertLink = async () => {
  const selection = window.getSelection()
  const selectedText = selection.toString().trim()
  
  const result = await ElMessageBox.prompt(
    '请输入链接地址:',
    '插入链接',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: selectedText || 'https://',
      inputPlaceholder: '请输入完整的URL地址'
    }
  )
  
  if (result && result.value) {
    const url = result.value.trim()
    
    // 确保URL格式正确
    let fullUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url
    }
    
    // 插入链接
    document.execCommand('createLink', false, fullUrl)
    editorContainer.value.focus()
    handleEditorInput()
  }
}

// 在选中位置插入链接
const insertLinkAtSelection = () => {
  insertLink()
}

// 插入图片
const insertImage = async () => {
  const result = await ElMessageBox.prompt(
    '请输入图片URL地址:',
    '插入图片',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入图片的完整URL地址'
    }
  )
  
  if (result && result.value) {
    const imageUrl = result.value.trim()
    document.execCommand('insertImage', false, imageUrl)
    editorContainer.value.focus()
    handleEditorInput()
  }
}

// 清除格式
const clearFormat = () => {
  document.execCommand('removeFormat', false, null)
  editorContainer.value.focus()
  handleEditorInput()
}

// 组件挂载时添加事件监听
onMounted(() => {
  if (editorContainer.value) {
    editorContainer.value.addEventListener('input', handleEditorInput)
    document.addEventListener('click', closeContextMenu)
    
    // 添加粘贴事件监听，清理粘贴的格式
    editorContainer.value.addEventListener('paste', (e) => {
      e.preventDefault()
      const text = (e.clipboardData || window.clipboardData).getData('text/plain')
      document.execCommand('insertText', false, text)
      handleEditorInput()
    })
  }
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  if (editorContainer.value) {
    editorContainer.value.removeEventListener('input', handleEditorInput)
    document.removeEventListener('click', closeContextMenu)
    editorContainer.value.removeEventListener('paste', () => {})
  }
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
})
</script>

<style scoped>
.note-editor {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 编辑器工具栏 */
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px 12px;
  background-color: #fafafa;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.editor-toolbar .el-button {
  font-size: 14px;
  padding: 4px 8px;
  min-width: auto;
  border-radius: 4px;
  transition: all 0.2s;
}

.editor-toolbar .el-button:hover {
  background-color: #f0f0f0;
}

.auto-save-status {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 4px 8px;
  background-color: #f0f9ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 12px;
}

.auto-save-status .icon {
  font-size: 12px;
}

/* 编辑器内容区域 */
.editor-content {
  flex: 1;
  padding: 24px;
  font-size: 14px;
  line-height: 1.8;
  outline: none;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  cursor: text;
  background-color: #fff;
}

/* 占位符样式 */
.editor-content:empty:before {
  content: attr(data-placeholder);
  color: #909399;
  pointer-events: none;
}

/* AI思考中提示 */
.ai-thinking {
  display: inline-block;
  padding: 4px 8px;
  margin: 4px 0;
  background-color: #f0f9ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 12px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  min-width: 120px;
  z-index: 1000;
  animation: menuFadeIn 0.2s ease-in;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

/* 编辑器提示 */
.editor-tips {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #909399;
  pointer-events: none;
  user-select: none;
  animation: tipsFadeIn 0.5s ease-in;
}

@keyframes tipsFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.editor-tips p {
  margin: 8px 0;
}

.shortcut-tips {
  font-size: 12px;
  line-height: 1.5;
}

/* 美化编辑器中的内容样式 */
.editor-content h1, .editor-content h2, .editor-content h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.editor-content h1 {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.editor-content h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.editor-content h3 {
  font-size: 1.25em;
}

.editor-content ul, .editor-content ol {
  padding-left: 2em;
  margin-bottom: 16px;
}

.editor-content li {
  margin-bottom: 4px;
}

.editor-content a {
  color: #1890ff;
  text-decoration: none;
  transition: color 0.2s;
}

.editor-content a:hover {
  color: #40a9ff;
  text-decoration: underline;
}

.editor-content img {
  max-width: 100%;
  height: auto;
  margin: 16px 0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.editor-content blockquote {
  padding: 8px 16px;
  margin: 16px 0;
  border-left: 4px solid #dfe2e5;
  background-color: #f6f8fa;
  color: #586069;
}

/* 滚动条样式优化 */
.editor-content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.editor-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.editor-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.editor-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>