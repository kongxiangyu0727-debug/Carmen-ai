import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import { initializeDB } from './db/dexie'
import { useNoteStore } from './stores/note'
import { useTagStore } from './stores/tag'
import { useSettingStore } from './stores/setting'
import { useTodoStore } from './stores/todo'
import { useProjectStore } from './stores/project'

// 初始化应用
async function initApp() {
  try {
    // 初始化数据库
    await initializeDB()
    
    // 创建应用实例
    const app = createApp(App)
    const pinia = createPinia()
    
    app.use(pinia)
    app.use(ElementPlus)
    
    // 在应用挂载前加载必要的数据
    const noteStore = useNoteStore()
    const tagStore = useTagStore()
    const settingStore = useSettingStore()
    const todoStore = useTodoStore()
    const projectStore = useProjectStore()
    
    // 加载数据，但不使用Promise.all以避免一个失败导致全部失败
    try {
      await noteStore.loadNotes()
    } catch (error) {
      console.error('笔记数据加载失败:', error)
    }
    
    try {
      await tagStore.loadTags()
    } catch (error) {
      console.error('标签数据加载失败:', error)
    }
    
    try {
      await settingStore.loadSettings()
    } catch (error) {
      console.error('设置数据加载失败:', error)
    }
    
    try {
      await todoStore.loadTodos()
    } catch (error) {
      console.error('待办数据加载失败:', error)
    }
    
    try {
      await projectStore.loadProjects()
      await projectStore.loadTasks()
    } catch (error) {
      console.error('项目数据加载失败:', error)
    }
    
    // 如果没有笔记，创建一个示例笔记
    try {
      if (noteStore.notes && noteStore.notes.length === 0) {
        await noteStore.createNote()
        // 创建一些示例标签
        await tagStore.createTag({ name: '工作', color: '#f56c6c' })
        await tagStore.createTag({ name: '学习', color: '#409eff' })
        await tagStore.createTag({ name: '生活', color: '#67c23a' })
      }
    } catch (error) {
      console.error('创建示例数据失败:', error)
    }
    
    // 如果没有待办事项，创建一些示例待办事项
    try {
      if (todoStore.todos && todoStore.todos.length === 0) {
        await todoStore.addTodo('完成项目文档')
        await todoStore.addTodo('准备会议材料')
        await todoStore.addTodo('回复重要邮件')
      }
    } catch (error) {
      console.error('创建示例待办事项失败:', error)
    }
    
    // 设置OpenRouter API密钥（用户提供的）
    try {
      const userApiKey = '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'
      const preferredModel = 'anthropic/claude-sonnet-4'  // 设置为用户指定的默认大模型
      
      // 确保settings对象存在
      if (!settingStore.settings) {
        await settingStore.resetToDefaults()
      }
      
      if (settingStore.apiKey !== userApiKey || settingStore.preferredModel !== preferredModel) {
        await settingStore.setApiKey(userApiKey)
        await settingStore.setPreferredModel(preferredModel)
      }
    } catch (error) {
      console.error('设置API密钥和模型失败:', error)
      // 即使设置失败，也继续挂载应用
    }
    
    // 如果没有项目，创建一些示例项目和任务
    try {
      if (projectStore.projects && projectStore.projects.length === 0) {
        // 创建活动策划项目
        const eventProject = await projectStore.createProject({
          name: '暑期英语夏令营活动策划',
          type: '活动策划',
          description: '策划并组织2024年暑期英语夏令营活动，吸引新学员报名，提升品牌知名度。'
        })
        
        // 为活动策划项目创建任务
        await projectStore.createTask(eventProject.id, {
          title: '制定活动方案',
          description: '包括活动主题、流程、时间安排等',
          priority: 'high',
          assigned_to: '张经理',
          department: '市场部',
          due_date: new Date().toISOString().split('T')[0]
        })
        
        await projectStore.createTask(eventProject.id, {
          title: '联系场地和供应商',
          description: '确定活动场地和所需物资供应商',
          priority: 'medium',
          assigned_to: '李主管',
          department: '运营部'
        })
        
        // 创建培训计划项目
        const trainingProject = await projectStore.createProject({
          name: '新员工销售技巧培训',
          type: '培训计划',
          description: '为新入职的销售人员提供英语教学产品销售技巧培训。'
        })
        
        // 为培训计划项目创建任务
        await projectStore.createTask(trainingProject.id, {
          title: '编写培训教材',
          description: '准备销售技巧培训的PPT和讲义',
          priority: 'high',
          assigned_to: '王培训师',
          department: '培训部'
        })
        
        await projectStore.createTask(trainingProject.id, {
          title: '安排培训场地和设备',
          description: '预订培训教室并准备相关设备',
          priority: 'medium',
          assigned_to: '赵助理',
          department: '行政部'
        })
        
        // 创建工作任务项目
        const workProject = await projectStore.createProject({
          name: '季度销售目标达成',
          type: '工作任务',
          description: '完成第三季度的销售目标，提升30%的销售额。'
        })
        
        // 为工作任务项目创建任务
        await projectStore.createTask(workProject.id, {
          title: '制定销售计划',
          description: '根据季度目标制定详细的销售计划',
          priority: 'high',
          assigned_to: '陈销售总监',
          department: '销售部'
        })
        
        await projectStore.createTask(workProject.id, {
          title: '客户回访',
          description: '对现有客户进行回访，了解需求并促进续报',
          priority: 'medium',
          assigned_to: '全体销售人员',
          department: '销售部'
        })
      }
    } catch (error) {
      console.error('创建示例项目数据失败:', error)
    }
    
    // 挂载应用
    app.mount('#app')
  } catch (error) {
    console.error('应用初始化过程中出错:', error)
    // 创建一个最小化的应用实例以显示错误信息
    const app = createApp({
      template: `<div style="padding: 20px; text-align: center; color: red;">应用初始化失败: {{ errorMessage }}</div>`,
      data() {
        // 安全地获取错误信息
        const errorMessage = error && error.message ? error.message : JSON.stringify(error) || '未知错误'
        return { errorMessage }
      }
    })
    app.mount('#app')
  }
}

// 启动应用
initApp()