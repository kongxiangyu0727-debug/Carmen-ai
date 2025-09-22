// 这个脚本用于直接保存OpenRouter API密钥到数据库
import { db } from './db/dexie.js'

// 用户提供的API密钥
const apiKey = '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'

// 保存API密钥的函数
async function saveApiKey() {
  try {
    console.log('正在保存API密钥...')
    
    // 保存API密钥到数据库
    await db.settings.put({
      id: 'user_settings',
      openrouter_api_key: apiKey,
      preferred_model: 'openai/gpt-3.5-turbo', // 使用更通用的模型
      auto_save_interval: 2000
    })
    
    console.log('API密钥已成功保存到应用设置中。')
    console.log('请在应用中测试AI功能。如果遇到问题，可能需要检查API密钥是否有效。')
  } catch (error) {
    console.error('保存API密钥时发生错误:', error.message)
  }
}

// 运行脚本
saveApiKey().catch(error => {
  console.error('脚本执行失败:', error)
})