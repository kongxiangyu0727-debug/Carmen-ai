import { defineStore } from 'pinia'
import { db } from '../db/dexie'

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [],
    tasks: [],
    isLoading: false
  }),

  getters: {
    // 获取所有项目
    allProjects: (state) => state.projects,
    
    // 根据ID获取项目
    getProjectById: (state) => (id) => {
      return state.projects.find(project => project.id === id)
    },
    
    // 获取项目类型列表（用于筛选）
    projectTypes: (state) => {
      const types = new Set(state.projects.map(project => project.type))
      return Array.from(types)
    },
    
    // 获取所有任务
    allTasks: (state) => state.tasks,
    
    // 根据项目ID获取任务
    getTasksByProjectId: (state) => (projectId) => {
      return state.tasks.filter(task => task.project_id === projectId)
    },
    
    // 根据ID获取任务
    getTaskById: (state) => (id) => {
      return state.tasks.find(task => task.id === id)
    },
    
    // 根据状态筛选任务
    getTasksByStatus: (state) => (status) => {
      return state.tasks.filter(task => task.status === status)
    },
    
    // 根据优先级筛选任务
    getTasksByPriority: (state) => (priority) => {
      return state.tasks.filter(task => task.priority === priority)
    },
    
    // 根据部门筛选任务
    getTasksByDepartment: (state) => (department) => {
      return state.tasks.filter(task => task.department === department)
    }
  },

  actions: {
    // 加载所有项目
    async loadProjects() {
      this.isLoading = true
      try {
        this.projects = await db.projects.toArray()
      } catch (error) {
        console.error('加载项目失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 加载所有任务
    async loadTasks() {
      try {
        this.tasks = await db.tasks.toArray()
      } catch (error) {
        console.error('加载任务失败:', error)
        throw error
      }
    },
    
    // 创建新项目
    async createProject(projectData) {
      try {
        const now = new Date().toISOString()
        const project = {
          ...projectData,
          status: 'active', // 默认状态为进行中
          created_at: now,
          updated_at: now
        }
        const id = await db.projects.add(project)
        const createdProject = { ...project, id }
        this.projects.push(createdProject)
        return createdProject
      } catch (error) {
        console.error('创建项目失败:', error)
        throw error
      }
    },
    
    // 更新项目
    async updateProject(id, projectData) {
      try {
        const project = this.getProjectById(id)
        if (!project) {
          throw new Error('项目不存在')
        }
        
        const updatedProject = {
          ...project,
          ...projectData,
          updated_at: new Date().toISOString()
        }
        
        await db.projects.update(id, updatedProject)
        
        // 更新本地状态
        const index = this.projects.findIndex(p => p.id === id)
        if (index !== -1) {
          this.projects[index] = updatedProject
        }
        
        return updatedProject
      } catch (error) {
        console.error('更新项目失败:', error)
        throw error
      }
    },
    
    // 标记项目为完成
    async completeProject(id) {
      return this.updateProject(id, { status: 'completed' })
    },
    
    // 归档项目
    async archiveProject(id) {
      return this.updateProject(id, { status: 'archived' })
    },
    
    // 激活项目
    async activateProject(id) {
      return this.updateProject(id, { status: 'active' })
    },
    
    // 删除项目（同时删除相关任务）
    async deleteProject(id) {
      try {
        // 开始事务
        await db.transaction('rw', [db.projects, db.tasks], async () => {
          // 删除项目
          await db.projects.delete(id)
          
          // 删除相关任务
          await db.tasks.where('project_id').equals(id).delete()
        })
        
        // 更新本地状态
        this.projects = this.projects.filter(project => project.id !== id)
        this.tasks = this.tasks.filter(task => task.project_id !== id)
      } catch (error) {
        console.error('删除项目失败:', error)
        throw error
      }
    },
    
    // 创建新任务
    async createTask(projectId, taskData) {
      try {
        // 检查项目是否存在
        const project = this.getProjectById(projectId)
        if (!project) {
          throw new Error('项目不存在')
        }
        
        const now = new Date().toISOString()
        const task = {
          ...taskData,
          project_id: projectId,
          status: 'todo',
          created_at: now,
          updated_at: now
        }
        
        const id = await db.tasks.add(task)
        const createdTask = { ...task, id }
        this.tasks.push(createdTask)
        return createdTask
      } catch (error) {
        console.error('创建任务失败:', error)
        throw error
      }
    },
    
    // 更新任务
    async updateTask(id, taskData) {
      try {
        const task = this.getTaskById(id)
        if (!task) {
          throw new Error('任务不存在')
        }
        
        const updatedTask = {
          ...task,
          ...taskData,
          updated_at: new Date().toISOString()
        }
        
        await db.tasks.update(id, updatedTask)
        
        // 更新本地状态
        const index = this.tasks.findIndex(t => t.id === id)
        if (index !== -1) {
          this.tasks[index] = updatedTask
        }
        
        return updatedTask
      } catch (error) {
        console.error('更新任务失败:', error)
        throw error
      }
    },
    
    // 删除任务
    async deleteTask(id) {
      try {
        await db.tasks.delete(id)
        
        // 更新本地状态
        this.tasks = this.tasks.filter(task => task.id !== id)
      } catch (error) {
        console.error('删除任务失败:', error)
        throw error
      }
    },
    
    // 批量更新任务状态
    async batchUpdateTasksStatus(taskIds, status) {
      try {
        const now = new Date().toISOString()
        
        // 开始事务
        await db.transaction('rw', db.tasks, async () => {
          for (const id of taskIds) {
            await db.tasks.update(id, { status, updated_at: now })
          }
        })
        
        // 更新本地状态
        this.tasks.forEach(task => {
          if (taskIds.includes(task.id)) {
            task.status = status
            task.updated_at = now
          }
        })
      } catch (error) {
        console.error('批量更新任务状态失败:', error)
        throw error
      }
    }
  }
})