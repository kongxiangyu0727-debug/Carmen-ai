import { defineStore } from 'pinia'
import { db } from '../db/dexie'

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const useTagStore = defineStore('tag', {
  state: () => ({
    tags: [],
    showManager: false
  }),
  
  getters: {
    // 获取所有标签
    allTags: (state) => state.tags,
    
    // 检查标签是否已存在
    tagExists: (state) => (name) => {
      return state.tags.some(tag => tag.name.toLowerCase() === name.toLowerCase())
    }
  },
  
  actions: {
    // 加载所有标签
    async loadTags() {
      try {
        this.tags = await db.tags.toArray()
      } catch (error) {
        console.error('加载标签失败:', error)
      }
    },
    
    // 创建新标签
    async createTag(tagData) {
      try {
        // 检查标签是否已存在
        if (this.tagExists(tagData.name)) {
          throw new Error('标签名称已存在')
        }
        
        const newTag = {
          id: generateId(),
          name: tagData.name.trim(),
          color: tagData.color || '#409eff',
          created_at: new Date().toISOString()
        }
        
        await db.tags.add(newTag)
        await this.loadTags()
      } catch (error) {
        console.error('创建标签失败:', error)
        throw error
      }
    },
    
    // 更新标签
    async updateTag(tagId, tagData) {
      try {
        // 检查标签名称是否与其他标签重复
        if (this.tags.some(tag => 
          tag.id !== tagId && 
          tag.name.toLowerCase() === tagData.name.toLowerCase()
        )) {
          throw new Error('标签名称已存在')
        }
        
        await db.tags.update(tagId, {
          name: tagData.name.trim(),
          color: tagData.color || '#409eff'
        })
        await this.loadTags()
      } catch (error) {
        console.error('更新标签失败:', error)
        throw error
      }
    },
    
    // 删除标签
    async deleteTag(tagId) {
      try {
        // 1. 先从所有笔记中移除该标签
        const notes = await db.notes.toArray()
        for (const note of notes) {
          if (note.tags && note.tags.includes(tagId)) {
            const newTags = note.tags.filter(id => id !== tagId)
            await db.notes.update(note.id, {
              tags: newTags,
              updated_at: new Date().toISOString()
            })
          }
        }
        
        // 2. 删除标签本身
        await db.tags.delete(tagId)
        await this.loadTags()
        
        // 3. 重新加载笔记列表（如果有note store）
        // 这里暂时不直接调用note store的方法，而是在组件中处理
      } catch (error) {
        console.error('删除标签失败:', error)
        throw error
      }
    },
    
    // 打开标签管理器
    openTagManager() {
      this.showManager = true
    },
    
    // 关闭标签管理器
    closeTagManager() {
      this.showManager = false
    }
  }
})