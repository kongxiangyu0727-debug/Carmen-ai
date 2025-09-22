<template>
  <div class="model-selector">
    <el-select
      v-model="selectedModel"
      placeholder="选择AI模型"
      size="small"
      @change="handleModelChange"
      style="width: 180px;"
    >
      <el-option
        v-for="model in availableModels"
        :key="model.id"
        :label="model.name"
        :value="model.id"
      />
    </el-select>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElSelect, ElOption } from 'element-plus'
import { useSettingStore } from '../../stores/setting'

const settingStore = useSettingStore()
const selectedModel = ref('anthropic/claude-3-sonnet')

// 可用的AI模型列表
const availableModels = [
  { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4' },
  { id: 'openai/gpt-4', name: 'GPT-4' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat' }
]

// 组件挂载时加载当前设置的模型
onMounted(() => {
  if (settingStore.settings.preferred_model) {
    selectedModel.value = settingStore.settings.preferred_model
  }
})

// 处理模型变更
const handleModelChange = () => {
  settingStore.updateSettings({
    preferred_model: selectedModel.value
  })
}
</script>

<style scoped>
.model-selector {
  display: inline-block;
}
</style>