<template>
  <div class="ai-toolbar">
    <el-dropdown
      trigger="click"
      @command="handleAIAction"
    >
      <el-button
        type="default"
        size="small"
        :loading="isLoading"
      >
        <el-icon><ChatDotRound /></el-icon>
        AI助手
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="continue">文本续写</el-dropdown-item>
          <el-dropdown-item command="rewrite">文本润色</el-dropdown-item>
          <el-dropdown-item command="summary">生成摘要</el-dropdown-item>
          <el-dropdown-item command="settings" divided>设置</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    
    <el-dialog
      v-model="showSettingsModal"
      title="AI设置"
      width="500px"
      @close="cancelSettings"
    >
      <el-form :model="settingsForm" label-width="120px">
        <el-form-item label="OpenRouter API密钥">
          <el-input
            v-model="settingsForm.apiKey"
            placeholder="请输入OpenRouter API密钥"
            type="password"
            show-password
          />
        </el-form-item>
        <el-form-item label="首选AI模型">
          <el-select v-model="settingsForm.preferredModel" placeholder="选择AI模型">
            <el-option
              v-for="model in availableModels"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelSettings">取消</el-button>
          <el-button type="primary" @click="saveSettings">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElButton, ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon, ElDialog, ElInput, ElForm, ElFormItem, ElSelect, ElOption } from 'element-plus'
import { ChatDotRound } from '@element-plus/icons-vue'
import { useNoteStore } from '../../stores/note'
import { useAIService } from '../../services/ai'
import { useSettingStore } from '../../stores/setting'

const noteStore = useNoteStore()
const aiService = useAIService()
const settingStore = useSettingStore()

const isLoading = ref(false)
const showSettingsModal = ref(false)
const settingsForm = ref({
  apiKey: '',
  preferredModel: 'anthropic/claude-sonnet-4'
})

// 处理AI操作
const handleAIAction = async (command) => {
  if (command === 'settings') {
    showSettingsModal.value = true
    settingsForm.value = {
      apiKey: settingStore.settings.openrouter_api_key || '',
      preferredModel: settingStore.settings.preferred_model || 'anthropic/claude-3-sonnet'
    }
    return
  }
  
  if (!noteStore.currentNote) {
    alert('请先创建或选择一个笔记')
    return
  }
  
  try {
    isLoading.value = true
    
    switch (command) {
      case 'continue':
        await triggerContinuation()
        break
      case 'rewrite':
        await triggerRewrite()
        break
      case 'summary':
        await triggerSummary()
        break
    }
  } catch (error) {
    console.error(`AI ${command}失败:`, error)
    alert(`AI ${getActionName(command)}失败，请检查API配置`)
  } finally {
    isLoading.value = false
  }
}

// 获取操作名称
const getActionName = (command) => {
  const names = {
    continue: '续写',
    rewrite: '润色',
    summary: '摘要'
  }
  return names[command] || command
}

// 触发文本续写
const triggerContinuation = async () => {
  const content = getEditorContent()
  if (!content) {
    alert('请先输入一些文本再使用续写功能')
    return
  }
  
  const continuation = await aiService.continueText(content)
  appendToEditor('\n' + continuation)
}

// 触发文本润色
const triggerRewrite = async () => {
  const selection = window.getSelection()
  const selectedText = selection.toString().trim()
  
  if (!selectedText) {
    // 如果没有选中文本，润色整个内容
    const content = getEditorContent()
    if (!content) {
      alert('请先输入一些文本再使用润色功能')
      return
    }
    
    const rewrittenText = await aiService.rewriteText(content)
    setEditorContent(rewrittenText)
  } else {
    // 如果有选中文本，润色选中的部分
    const rewrittenText = await aiService.rewriteText(selectedText)
    replaceSelectedText(rewrittenText)
  }
}

// 触发生成摘要
const triggerSummary = async () => {
  const content = getEditorContent()
  if (!content) {
    alert('请先输入一些文本再生成摘要')
    return
  }
  
  const summary = await aiService.generateSummary(content)
  await noteStore.updateNoteSummary(noteStore.currentNote.id, summary)
}

// 获取编辑器内容
const getEditorContent = () => {
  const editor = document.querySelector('.editor-content')
  return editor ? editor.textContent : ''
}

// 设置编辑器内容
const setEditorContent = (content) => {
  const editor = document.querySelector('.editor-content')
  if (editor) {
    editor.textContent = content
    // 触发input事件以保存内容
    editor.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

// 追加内容到编辑器
const appendToEditor = (content) => {
  const editor = document.querySelector('.editor-content')
  if (editor) {
    editor.textContent += content
    // 触发input事件以保存内容
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    // 滚动到底部
    editor.scrollTop = editor.scrollHeight
  }
}

// 替换选中文本
const replaceSelectedText = (text) => {
  const selection = window.getSelection()
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    range.deleteContents()
    range.insertNode(document.createTextNode(text))
    
    // 触发input事件以保存内容
    const editor = document.querySelector('.editor-content')
    if (editor) {
      editor.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }
}

// 保存设置
const saveSettings = () => {
  settingStore.updateSettings(settingsForm.value)
  showSettingsModal.value = false
}
</script>

<style scoped>
.ai-toolbar {
  display: inline-block;
}
</style>