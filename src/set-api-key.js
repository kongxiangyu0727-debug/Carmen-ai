// 这个脚本用于验证并保存OpenRouter API密钥
import { db } from './db/dexie.js'

// 用户提供的API密钥
const apiKey = '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'

// 验证API密钥的函数
async function verifyAndSaveApiKey() {
  try {
    console.log('正在验证API密钥...')
    
    // 尝试发送一个简单的请求来验证API密钥 - 使用更通用的模型
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: '你好' }],
        max_tokens: 10
      })
    })
    
    if (response.ok) {
      console.log('API密钥验证成功！')
      
      // 保存API密钥到数据库
      await db.settings.put({
        id: 'user_settings',
        openrouter_api_key: apiKey,
        preferred_model: 'anthropic/claude-3-sonnet',
        auto_save_interval: 2000
      })
      
      console.log('API密钥已成功保存到应用设置中。')
      console.log('您现在可以使用AI对话功能了！')
    } else {
      const errorData = await response.json()
      console.error('API密钥验证失败:', response.status, errorData.error?.message || '未知错误')
    }
  } catch (error) {
    console.error('验证API密钥时发生错误:', error.message)
  }
}

// 运行脚本
verifyAndSaveApiKey().catch(error => {
  console.error('脚本执行失败:', error)
})