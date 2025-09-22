import { defineStore } from 'pinia'
import { db } from '../db/dexie'

export const useSettingStore = defineStore('setting', {
  state: () => ({
    settings: {
      preferred_model: 'anthropic/claude-3-sonnet',
      openrouter_api_key: '',
      auto_save_interval: 2000
    }
  }),
  
  getters: {
    // 获取当前设置
    currentSettings: (state) => state.settings,
    
    // 获取首选AI模型
    preferredModel: (state) => state.settings.preferred_model,
    
    // 获取OpenRouter API密钥
    apiKey: (state) => state.settings.openrouter_api_key,
    
    // 获取自动保存间隔
    autoSaveInterval: (state) => state.settings.auto_save_interval
  },
  
  actions: {
    // 加载设置
    async loadSettings() {
      try {
        console.log('settingStore: 开始加载设置...')
        const savedSettings = await db.settings.get('user_settings')
        console.log('settingStore: 加载的设置数据:', savedSettings)
        if (savedSettings) {
          this.settings = { ...savedSettings }
          console.log('settingStore: 设置已更新:', this.settings)
        } else {
          console.log('settingStore: 未找到保存的设置，使用默认值')
        }
      } catch (error) {
        console.error('settingStore: 加载设置失败:', error)
        // 如果加载失败，使用默认设置
        this.resetToDefaults()
      }
    },
    
    // 更新设置
    async updateSettings(settingsData) {
      try {
        // 合并新的设置数据
        const updatedSettings = {
          ...this.settings,
          ...settingsData,
          id: 'user_settings' // 确保ID始终是user_settings
        }
        
        // 保存到数据库
        await db.settings.put(updatedSettings)
        
        // 更新本地状态
        this.settings = { ...updatedSettings }
      } catch (error) {
        console.error('更新设置失败:', error)
        throw error
      }
    },
    
    // 重置设置为默认值
    async resetToDefaults() {
      const defaultSettings = {
        id: 'user_settings',
        preferred_model: 'anthropic/claude-3-sonnet',
        openrouter_api_key: '',
        auto_save_interval: 2000
      }
      
      try {
        console.log('settingStore: 重置设置为默认值:', defaultSettings)
        await db.settings.put(defaultSettings)
        this.settings = { ...defaultSettings }
        console.log('settingStore: 设置重置成功:', this.settings)
      } catch (error) {
        console.error('settingStore: 重置设置失败:', error)
      }
    },
    
    // 设置首选AI模型
    async setPreferredModel(model) {
      await this.updateSettings({ preferred_model: model })
    },
    
    // 设置OpenRouter API密钥
    async setApiKey(apiKey) {
      await this.updateSettings({ openrouter_api_key: apiKey })
    },
    
    // 设置自动保存间隔
    async setAutoSaveInterval(interval) {
      // 确保间隔是有效的数字且大于0
      const validInterval = Number(interval) > 0 ? Number(interval) : 2000
      await this.updateSettings({ auto_save_interval: validInterval })
    }
  }
})