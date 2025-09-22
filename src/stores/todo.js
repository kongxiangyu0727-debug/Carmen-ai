import { defineStore } from 'pinia'
import { db } from '../db/dexie.js'

export const useTodoStore = defineStore('todo', {
  state: () => ({
    todos: [],
    isLoading: false
  }),

  getters: {
    completedTodos: (state) => state.todos.filter(todo => todo.completed),
    pendingTodos: (state) => state.todos.filter(todo => !todo.completed),
    todosCount: (state) => state.todos.length
  },

  actions: {
    // 加载所有待办事项
    async loadTodos() {
      this.isLoading = true
      try {
        this.todos = await db.todos.orderBy('created_at').toArray()
      } catch (error) {
        console.error('加载待办事项失败:', error)
      } finally {
        this.isLoading = false
      }
    },

    // 添加新的待办事项
    async addTodo(data) {
      // 支持对象参数和字符串参数两种形式
      const content = typeof data === 'string' ? data : data.content;
      const priority = typeof data === 'string' ? 'normal' : (data.priority || 'normal');
      
      const todo = {
        content,
        priority,
        completed: false,
        created_at: new Date(),
        updated_at: new Date()
      }

      try {
        const id = await db.todos.add(todo)
        todo.id = id
        this.todos.push(todo)
        return todo
      } catch (error) {
        console.error('添加待办事项失败:', error)
      }
    },

    // 切换待办事项的完成状态
    async toggleTodo(id) {
      const todo = this.todos.find(t => t.id === id)
      if (todo) {
        todo.completed = !todo.completed
        todo.updated_at = new Date()
        
        try {
          await db.todos.update(id, {
            completed: todo.completed,
            updated_at: todo.updated_at
          })
        } catch (error) {
          console.error('更新待办事项失败:', error)
          // 回滚状态
          todo.completed = !todo.completed
        }
      }
    },

    // 更新待办事项内容
    async updateTodoContent(id, content) {
      const todo = this.todos.find(t => t.id === id)
      if (todo) {
        todo.content = content
        todo.updated_at = new Date()
        
        try {
          await db.todos.update(id, {
            content,
            updated_at: todo.updated_at
          })
        } catch (error) {
          console.error('更新待办事项内容失败:', error)
        }
      }
    },

    // 删除待办事项
    async deleteTodo(id) {
      try {
        await db.todos.delete(id)
        this.todos = this.todos.filter(t => t.id !== id)
      } catch (error) {
        console.error('删除待办事项失败:', error)
      }
    },

    // 清除所有已完成的待办事项
    async clearCompleted() {
      const completedIds = this.todos
        .filter(todo => todo.completed)
        .map(todo => todo.id)
      
      try {
        await db.todos.bulkDelete(completedIds)
        this.todos = this.todos.filter(t => !t.completed)
      } catch (error) {
        console.error('清除已完成待办事项失败:', error)
      }
    },
    
    // 切换所有待办事项的完成状态
    async toggleAllTodos(status) {
      try {
        this.isLoading = true
        
        // 更新内存中的状态
        this.todos.forEach(todo => {
          todo.completed = status
          todo.updated_at = new Date()
        })
        
        // 批量更新到数据库
        const updates = this.todos.map(todo => ({
          id: todo.id,
          changes: {
            completed: todo.completed,
            updated_at: todo.updated_at
          }
        }))
        
        await db.todos.bulkUpdate(updates)
      } catch (error) {
        console.error('批量更新待办事项失败:', error)
        // 重新加载数据以确保一致性
        await this.loadTodos()
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新待办事项优先级
    async updateTodoPriority(id, priority) {
      const todo = this.todos.find(t => t.id === id)
      if (todo) {
        todo.priority = priority
        todo.updated_at = new Date()
        
        try {
          await db.todos.update(id, {
            priority,
            updated_at: todo.updated_at
          })
        } catch (error) {
          console.error('更新待办事项优先级失败:', error)
          // 回滚状态
          // 如果之前没有priority属性，保持不变
        }
      }
    }
  }
})