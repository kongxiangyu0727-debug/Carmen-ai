import { defineStore } from 'pinia'
import { db } from '../db/dexie'

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const useNoteStore = defineStore('note', {
  state: () => ({
    notes: [],
    currentNote: null,
    searchQuery: '',
    filteredTags: [],
    filteredNotes: []
  }),
  
  getters: {
    // 获取所有笔记
    allNotes: (state) => state.notes,
    
    // 获取当前选中的笔记
    getCurrentNote: (state) => state.currentNote
  },
  
  actions: {
    // 加载所有笔记
    async loadNotes() {
      try {
        this.notes = await db.notes.toArray()
        this.filterNotes()
      } catch (error) {
        console.error('加载笔记失败:', error)
      }
    },
    
    // 调整笔记顺序
    async reorderNotes(fromIndex, toIndex) {
      try {
        // 创建排序后的笔记数组
        const sortedNotes = [...this.filteredNotes]
        const [movedNote] = sortedNotes.splice(fromIndex, 1)
        sortedNotes.splice(toIndex, 0, movedNote)
        
        // 计算并更新每个笔记的排序位置
        const updatePromises = sortedNotes.map((note, index) => {
          // 设置排序权重（使用小数避免ID冲突）
          const sortWeight = (index + 1) * 10
          return db.notes.update(note.id, { sort_weight: sortWeight })
        })
        
        await Promise.all(updatePromises)
        await this.loadNotes()
      } catch (error) {
        console.error('调整笔记顺序失败:', error)
        throw error
      }
    },
    
    // 创建新笔记
    async createNote() {
      try {
        const newNote = {
          id: generateId(),
          title: '无标题笔记',
          content: '',
          tags: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ai_summary: ''
        }
        
        await db.notes.add(newNote)
        await this.loadNotes()
        this.selectNote(newNote.id)
      } catch (error) {
        console.error('创建笔记失败:', error)
        throw error
      }
    },
    
    // 选择笔记
    selectNote(noteId) {
      this.currentNote = this.notes.find(note => note.id === noteId)
    },
    
    // 更新笔记标题
    async updateNoteTitle(noteId, title) {
      try {
        await db.notes.update(noteId, {
          title,
          updated_at: new Date().toISOString()
        })
        await this.loadNotes()
        this.selectNote(noteId)
      } catch (error) {
        console.error('更新笔记标题失败:', error)
        throw error
      }
    },
    
    // 更新笔记内容
    async updateNoteContent(noteId, content) {
      try {
        await db.notes.update(noteId, {
          content,
          updated_at: new Date().toISOString()
        })
        await this.loadNotes()
        this.selectNote(noteId)
      } catch (error) {
        console.error('更新笔记内容失败:', error)
        throw error
      }
    },
    
    // 更新笔记标签
    async updateNoteTags(noteId, tags) {
      try {
        await db.notes.update(noteId, {
          tags,
          updated_at: new Date().toISOString()
        })
        await this.loadNotes()
        this.selectNote(noteId)
      } catch (error) {
        console.error('更新笔记标签失败:', error)
        throw error
      }
    },
    
    // 更新笔记摘要
    async updateNoteSummary(noteId, summary) {
      try {
        await db.notes.update(noteId, {
          ai_summary: summary,
          updated_at: new Date().toISOString()
        })
        await this.loadNotes()
        this.selectNote(noteId)
      } catch (error) {
        console.error('更新笔记摘要失败:', error)
        throw error
      }
    },
    
    // 保存当前笔记
    async saveCurrentNote() {
      if (this.currentNote) {
        await this.updateNoteContent(this.currentNote.id, this.currentNote.content)
      }
    },
    
    // 删除笔记
    async deleteNote(noteId) {
      try {
        await db.notes.delete(noteId)
        await this.loadNotes()
        
        // 如果删除的是当前选中的笔记，选择第一个笔记
        if (this.currentNote && this.currentNote.id === noteId) {
          if (this.notes.length > 0) {
            this.selectNote(this.notes[0].id)
          } else {
            this.currentNote = null
          }
        }
      } catch (error) {
        console.error('删除笔记失败:', error)
        throw error
      }
    },
    
    // 搜索笔记
    searchNotes(query) {
      this.searchQuery = query
      this.filterNotes()
    },
    
    // 按标签筛选笔记
    filterNotesByTags(tags) {
      this.filteredTags = tags
      this.filterNotes()
    },
    
    // 综合筛选笔记
    filterNotes() {
      let filtered = [...this.notes]
      
      // 按搜索关键词筛选
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(note => 
          note.title.toLowerCase().includes(query) || 
          note.content.toLowerCase().includes(query)
        )
      }
      
      // 按标签筛选
      if (this.filteredTags.length > 0) {
        filtered = filtered.filter(note => 
          this.filteredTags.some(tagId => note.tags.includes(tagId))
        )
      }
      
      // 首先按排序权重排序，如果没有权重则按更新时间倒序排序
      filtered.sort((a, b) => {
        // 如果两个笔记都有排序权重，按权重排序
        if (a.sort_weight !== undefined && b.sort_weight !== undefined) {
          return a.sort_weight - b.sort_weight
        }
        // 如果只有一个有排序权重，有权重的排在前面
        if (a.sort_weight !== undefined) return -1
        if (b.sort_weight !== undefined) return 1
        // 否则按更新时间倒序排序
        return new Date(b.updated_at) - new Date(a.updated_at)
      })
      
      this.filteredNotes = filtered
    }
  }
})