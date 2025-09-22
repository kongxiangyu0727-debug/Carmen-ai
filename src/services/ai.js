import axios from 'axios'
import { useSettingStore } from '../stores/setting'

class AIService {
  constructor() {
    this.settingStore = useSettingStore()
    this.apiBaseUrl = 'https://openrouter.ai/api/v1/chat/completions'
  }
  
  // 获取API配置
  getApiConfig() {
    const apiKey = this.settingStore.apiKey
    if (!apiKey) {
      throw new Error('请先配置OpenRouter API密钥')
    }
    
    return {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  }
  
  // 获取当前选择的模型
  getCurrentModel() {
    return this.settingStore.preferredModel || 'anthropic/claude-sonnet-4'
  }
  
  // 文本续写
  async continueText(text) {
    try {
      const config = this.getApiConfig()
      const model = this.getCurrentModel()
      
      const response = await axios.post(
        this.apiBaseUrl,
        {
          model: model,
          messages: [
            {
              role: 'user',
              content: `续写以下文本：${text}`
            }
          ],
          max_tokens: 500
        },
        config
      )
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content.trim()
      } else {
        throw new Error('AI响应格式不正确')
      }
    } catch (error) {
      console.error('文本续写失败:', error)
      if (error.response) {
        throw new Error(`API错误: ${error.response.status} - ${error.response.data?.error?.message || '未知错误'}`)
      }
      throw error
    }
  }
  
  // 文本润色
  async rewriteText(text) {
    try {
      const config = this.getApiConfig()
      // 对于润色功能，使用gpt-4模型（根据需求文档）
      const model = 'openai/gpt-4'
      
      const response = await axios.post(
        this.apiBaseUrl,
        {
          model: model,
          messages: [
            {
              role: 'user',
              content: `请润色以下文本，保持原意：${text}`
            }
          ]
        },
        config
      )
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content.trim()
      } else {
        throw new Error('AI响应格式不正确')
      }
    } catch (error) {
      console.error('文本润色失败:', error)
      if (error.response) {
        throw new Error(`API错误: ${error.response.status} - ${error.response.data?.error?.message || '未知错误'}`)
      }
      throw error
    }
  }
  
  // 生成摘要
  async generateSummary(text) {
    try {
      const config = this.getApiConfig()
      // 对于摘要功能，使用claude-3-sonnet模型（根据需求文档）
      const model = 'anthropic/claude-3-sonnet'
      
      const response = await axios.post(
        this.apiBaseUrl,
        {
          model: model,
          messages: [
            {
              role: 'user',
              content: `请为以下文本生成摘要和关键点：${text}`
            }
          ]
        },
        config
      )
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content.trim()
      } else {
        throw new Error('AI响应格式不正确')
      }
    } catch (error) {
      console.error('生成摘要失败:', error)
      if (error.response) {
        throw new Error(`API错误: ${error.response.status} - ${error.response.data?.error?.message || '未知错误'}`)
      }
      throw error
    }
  }
  
  // 检查API密钥是否有效
  async validateApiKey(apiKey) {
    try {
      const testConfig = {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
      
      // 发送一个简单的请求来验证API密钥
      const response = await axios.post(
        this.apiBaseUrl,
        {
          model: 'anthropic/claude-3-sonnet',
          messages: [
            { role: 'user', content: '你好' }
          ],
          max_tokens: 10
        },
        testConfig
      )
      
      return response.status === 200
    } catch (error) {
      console.error('验证API密钥失败:', error)
      return false
    }
  }
}

// 创建并导出服务实例
export const useAIService = () => new AIService()