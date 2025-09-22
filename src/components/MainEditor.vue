<template>
  <div class="main-editor">
    <!-- 编辑器顶部工具栏 -->
    <div class="editor-header">
      <input
        v-model="currentNoteTitle"
        class="note-title-input"
        placeholder="请输入笔记标题..."
        :disabled="!currentNote"
      />
      <div class="header-actions">
        <el-button
          type="primary"
          size="small"
          :disabled="!currentNote"
          class="save-btn"
          @click="saveNote"
        >
          <el-icon name="el-icon--save" />
          保存
        </el-button>
      </div>
    </div>
    
    <!-- 笔记内容编辑器 -->
    <div v-if="currentNote" class="editor-content">
      <div 
        ref="editorContainer" 
        class="codemirror-container"
        @click="focusEditor"
      ></div>
    </div>
    
    <!-- 空状态提示 -->
    <div class="empty-state" v-else>
      <div class="empty-icon">
        <el-icon name="el-icon--document" />
      </div>
      <h3>选择或创建笔记</h3>
      <p>从左侧列表选择一个笔记，或创建一个新的笔记开始编辑</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElButton } from 'element-plus'
import { useNoteStore } from '../stores/note'
import { basicSetup } from 'codemirror'
import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'

const noteStore = useNoteStore()
const currentNote = computed(() => noteStore.currentNote)
const currentNoteTitle = ref('')
const currentNoteContent = ref('')
const editorContainer = ref(null)
let editorView = null

// 保存笔记
const saveNote = async () => {
  if (!currentNote.value) return
  
  try {
    // 先更新标题
    if (currentNoteTitle.value !== currentNote.value.title) {
      await noteStore.updateNoteTitle(currentNote.value.id, currentNoteTitle.value)
    }
    
    // 再更新内容
    await noteStore.updateNoteContent(currentNote.value.id, currentNoteContent.value)
  } catch (error) {
    console.error('保存笔记失败:', error)
  }
}

// 注册保存快捷键 (Ctrl+S)
const saveCommand = EditorView.domEventHandlers({
  keydown: (event, view) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault()
      saveNote()
      return true
    }
    return false
  }
})

// 初始化编辑器
const initEditor = () => {
  if (!editorContainer.value || editorView) return
  
  // 清空容器，确保没有旧的编辑器实例
  while (editorContainer.value.firstChild) {
    editorContainer.value.removeChild(editorContainer.value.firstChild)
  }
  
  const state = EditorState.create({
    doc: currentNoteContent.value || '请输入笔记内容...',
    extensions: [
      basicSetup,
      markdown(),
      keymap.of(defaultKeymap),
      saveCommand,
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          currentNoteContent.value = update.state.doc.toString()
        }
      }),

      // 调整编辑器主题和样式
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '16px',
          fontFamily: 'inherit'
        },
        '.cm-content': {
          padding: '20px',
          minHeight: '100%',
          cursor: 'text'
        },
        '.cm-editor': {
          height: '100%'
        },
        '.cm-scroller': {
          fontFamily: 'inherit',
          overflow: 'auto'
        }
      })
    ]
  })
  
  editorView = new EditorView({
    state,
    parent: editorContainer.value
  })
  
  // 手动聚焦编辑器
  setTimeout(() => {
    if (editorView && document.activeElement !== editorView.contentDOM) {
      editorView.focus()
    }
  }, 100)
}

// 监听当前笔记变化
watch(currentNote, (newNote) => {
  if (newNote) {
    currentNoteTitle.value = newNote.title
    currentNoteContent.value = newNote.content || ''
    
    // 更新编辑器内容
    if (editorView) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: currentNoteContent.value
        }
      })
    } else {
      initEditor()
    }
  }
})

// 手动聚焦编辑器的函数
const focusEditor = () => {
  if (editorView && document.activeElement !== editorView.contentDOM) {
    editorView.focus()
  }
}

// 组件挂载后初始化编辑器
onMounted(() => {
  if (currentNote.value) {
    initEditor()
  }
})


</script>

<style scoped>
.main-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
}

.note-title-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 20px;
  padding: 8px 0;
  margin-right: 16px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.editor-content {
  flex: 1;
  overflow: hidden;
}

.codemirror-container {
  height: 100%;
  width: 100%;
}

/* CodeMirror 编辑器样式覆盖 */
.cm-editor {
  height: 100%;
}

.cm-content {
  padding: 20px;
  font-size: 16px;
  line-height: 1.6;
}

.cm-scroller {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}
</style>