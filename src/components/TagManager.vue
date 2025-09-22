<template>
  <el-dialog
    v-model="dialogVisible"
    title="标签管理"
    width="400px"
    @close="handleClose"
  >
    <!-- 标签列表 -->
    <div class="tag-manager">
      <div class="tag-form" v-if="editingTag">
        <div class="form-group">
          <label>标签名称</label>
          <input 
            v-model="tagForm.name" 
            placeholder="请输入标签名称" 
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>标签颜色</label>
          <el-color-picker v-model="tagForm.color" show-alpha />
        </div>
        <div class="form-actions">
          <button 
            class="btn btn-primary"
            @click="handleSaveTag"
            :disabled="isSaving"
          >
            {{ isSaving ? '保存中...' : '保存' }}
          </button>
          <button 
            class="btn btn-default"
            @click="cancelEdit"
          >
            取消
          </button>
          <button 
            class="btn btn-info"
            @click="testClick"
          >
            测试按钮
          </button>
        </div>
      </div>
      
      <div v-else>
        <div class="tag-actions">
          <button class="btn btn-primary btn-small" @click="addNewTag">添加标签</button>
        </div>
        
        <div class="tag-list">
          <div 
            v-for="tag in tags"
            :key="tag.id"
            class="tag-item"
          >
            <div class="tag-info">
              <div class="tag-color" :style="{ backgroundColor: tag.color || '#f0f0f0' }"/>
              <span class="tag-name">{{ tag.name }}</span>
            </div>
            <div class="tag-actions">
              <button class="btn-text" @click="editTag(tag)">编辑</button>
              <button class="btn-text btn-danger" @click="deleteTag(tag.id)">删除</button>
            </div>
          </div>
        </div>
        
        <div v-if="tags.length === 0" class="empty-state">
          <p>暂无标签，点击上方"添加标签"按钮创建</p>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElDialog, ElColorPicker } from 'element-plus'
import { useTagStore } from '../stores/tag'

// 定义Props，接收来自父组件的显示控制
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// 定义Emits
const emit = defineEmits(['update:visible'])

const tagStore = useTagStore()

// 从store获取showManager状态
const storeShowManager = computed({
  get: () => tagStore.showManager,
  set: (value) => { tagStore.showManager = value }
})

// 计算对话框的可见性，结合props和store状态
const dialogVisible = computed({
  get: () => props.visible || storeShowManager.value,
  set: (value) => {
    // 同时更新store和通过emit通知父组件
    storeShowManager.value = value
    emit('update:visible', value)
  }
})

// 为了简化，我们仍然保留showManager作为dialogVisible的别名
const showManager = dialogVisible

// 监听store中的showManager变化，同步到props
watch(() => storeShowManager.value, (newValue) => {
  if (newValue !== props.visible) {
    emit('update:visible', newValue)
  }
})

const tags = computed(() => tagStore.tags)
const editingTag = ref(null)
const tagForm = ref({
  name: '',
  color: '#409eff'
})
const isSaving = ref(false)

// 测试点击事件
const testClick = () => {
  console.log('Test button clicked!');
  alert('测试按钮被点击了！');
}

// 保存标签
const handleSaveTag = async () => {
  console.log('handleSaveTag function called');
  console.log('tagForm value:', tagForm.value);
  console.log('editingTag value:', editingTag.value);
  
  if (!tagForm.value.name.trim()) {
    alert('请输入标签名称')
    return
  }
  
  try {
    isSaving.value = true
    console.log('isSaving set to true');
    
    if (editingTag.value === 'new') {
      console.log('Creating new tag...');
      await tagStore.createTag(tagForm.value)
    } else {
      console.log('Updating existing tag...');
      await tagStore.updateTag(editingTag.value, tagForm.value)
    }
    
    cancelEdit()
    console.log('Tag saved successfully');
  } catch (error) {
    console.error('保存标签失败:', error);
    console.log('Error details:', error);
    // 显示具体的错误信息，包括标签名称重复的提示
    alert(`保存标签失败: ${error.message || '未知错误'}`)
  } finally {
    isSaving.value = false
    console.log('isSaving set to false');
  }
}

// 添加新标签
const addNewTag = () => {
  editingTag.value = 'new'
  tagForm.value = {
    name: '',
    color: '#409eff'
  }
}

// 编辑标签
const editTag = (tag) => {
  editingTag.value = tag.id
  tagForm.value = {
    name: tag.name,
    color: tag.color || '#409eff'
  }
}

// 取消编辑
const cancelEdit = () => {
  editingTag.value = null
  tagForm.value = {
    name: '',
    color: '#409eff'
  }
}

// 删除标签
const deleteTag = async (tagId) => {
  if (confirm('确定要删除这个标签吗？')) {
    try {
      await tagStore.deleteTag(tagId)
    } catch (error) {
      console.error('删除标签失败:', error)
      alert('删除标签失败')
    }
  }
}

// 处理弹窗关闭
const handleClose = () => {
  cancelEdit()
}
</script>

<style scoped>
.tag-manager {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.tag-form {
  padding: 10px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #606266;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #409eff;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 20px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-primary {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.btn-default {
  background-color: white;
  color: #606266;
}

.btn-default:hover:not(:disabled) {
  color: #409eff;
  border-color: #c6e2ff;
}

.btn-info {
  background-color: #909399;
  color: white;
  border-color: #909399;
}

.btn-info:hover:not(:disabled) {
  background-color: #a6a9ad;
  border-color: #a6a9ad;
}

.btn-small {
  padding: 4px 12px;
  font-size: 12px;
}

.tag-actions {
  margin-bottom: 16px;
}

.tag-list {
  border-top: 1px solid #e4e7ed;
}

.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.tag-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tag-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.tag-name {
  font-size: 14px;
}

.btn-text {
  background: none;
  border: none;
  color: #606266;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 14px;
  transition: color 0.3s;
}

.btn-text:hover {
  color: #409eff;
}

.btn-danger {
  color: #f56c6c;
}

.btn-danger:hover {
  color: #f78989;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}
</style>