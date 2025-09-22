import Dexie from 'dexie'

// 创建数据库实例
const db = new Dexie('ai-notepad-db')

// 定义数据库模式
// 笔记表
// tags表
// settings表

// 版本1: 初始版本
// 版本2: 添加ai_summary字段到notes表
// 版本3: 添加todos表
// 版本4: 为todos表添加priority字段
// 版本5: 添加projects和tasks表，支持项目管理功能
db.version(5).stores({
  notes: '++id, title, content, *tags, created_at, updated_at, ai_summary',
  tags: '++id, name, color, created_at',
  settings: 'id, preferred_model, openrouter_api_key, auto_save_interval',
  todos: '++id, content, priority, completed, created_at, updated_at',
  projects: '++id, name, type, description, status, created_at, updated_at',
  tasks: '++id, project_id, title, description, priority, status, assigned_to, department, due_date, completed_at, created_at, updated_at'
})

// 初始化默认设置
const initializeDefaultSettings = async () => {
  try {
    const settings = await db.settings.get('user_settings')
    if (!settings) {
      await db.settings.add({
        id: 'user_settings',
        preferred_model: 'anthropic/claude-3-sonnet',
        openrouter_api_key: '',
        auto_save_interval: 2000
      })
    }
  } catch (error) {
    console.error('初始化默认设置失败:', error)
  }
}

// 初始化数据库
const initializeDB = async () => {
  try {
    await db.open()
    await initializeDefaultSettings()
    console.log('数据库初始化成功')
  } catch (error) {
    console.error('数据库初始化失败:', error)
  }
}

// 导出数据库实例和初始化函数
export { db, initializeDB }