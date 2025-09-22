<template>
  <div class="project-management">
    <!-- AI助手横幅 -->
    <div class="ai-banner">
      <el-icon class="banner-icon"><HelpFilled /></el-icon>
      <span>AI项目管理助手已就绪，随时为您提供智能建议和分析</span>
      <el-button type="text" size="small" @click="showAIFeaturesTour">了解更多</el-button>
      <el-button type="text" size="small" @click="showAllProjectsStats">项目统计</el-button>
    </div>

    <!-- 头部区域 -->
    <div class="project-header">
      <h2><el-icon><HelpFilled /></el-icon> AI项目管理中心</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateProjectDialog = true">
          <el-icon><Plus /></el-icon>
          新建项目
        </el-button>
        
        <!-- AI功能下拉菜单 -->
        <el-dropdown trigger="click" @command="handleAIFeature">
          <el-button type="primary" class="ai-assistant-btn">
            <el-icon><Flag /></el-icon>
            AI助手
            <i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="show_panel">
                <el-icon><MessageSquare /></el-icon> 显示AI面板
              </el-dropdown-item>
              <el-dropdown-item command="generate_suggestion">
                <el-icon><Sparkles /></el-icon> 生成项目建议
              </el-dropdown-item>
              <el-dropdown-item command="show_stats">
                <el-icon><DataAnalysis /></el-icon> 项目统计分析
              </el-dropdown-item>
              <el-dropdown-item command="show_tour">
                <el-icon><Guide /></el-icon> 功能引导
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <el-icon><Setting /></el-icon> AI设置
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- AI项目建议面板 -->
    <div v-if="showAiPanel" class="ai-panel">
      <div class="ai-panel-header">
        <h3><el-icon><HelpFilled /></el-icon> AI项目建议</h3>
        <div class="ai-panel-header-actions">
          <el-select v-model="selectedAIModel" size="small" style="width: 120px; margin-right: 10px;">
            <el-option label="标准模式" value="default"></el-option>
            <el-option label="创意模式" value="creative"></el-option>
          </el-select>
          <el-button type="text" @click="showSuggestionSettings">
            <el-icon><Setting /></el-icon>
          </el-button>
          <el-button type="text" @click="generateProjectSuggestion" :loading="isGenerating">
            <el-icon><RefreshRight /></el-icon>
            生成新建议
          </el-button>
        </div>
      </div>
      <div class="ai-panel-content" v-if="aiSuggestions">
        <div class="ai-suggestion" v-html="formatMarkdown(aiSuggestions)"></div>
        <div class="ai-suggestion-actions">
          <el-button size="small" type="primary" @click="saveAsProject" :loading="isSaving">
            保存为项目
          </el-button>
          <el-button size="small" @click="regenerateSuggestion">
            重新生成
          </el-button>
        </div>
      </div>
      <div class="ai-panel-content empty" v-else-if="!isGenerating">
        <p>点击"生成新建议"，AI将为您推荐合适的项目</p>
      </div>
      <div class="ai-panel-content loading" v-else>
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>AI正在分析您的需求...</p>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="project-filter">
      <el-select v-model="statusFilter" placeholder="项目状态" size="small" @change="loadProjects">
        <el-option label="全部" value="all"></el-option>
        <el-option label="进行中" value="active"></el-option>
        <el-option label="已完成" value="completed"></el-option>
        <el-option label="已归档" value="archived"></el-option>
      </el-select>
      
      <el-select v-model="typeFilter" placeholder="项目类型" size="small" @change="loadProjects">
        <el-option label="全部" value="all"></el-option>
        <el-option label="活动策划" value="活动策划"></el-option>
        <el-option label="培训计划" value="培训计划"></el-option>
        <el-option label="工作任务" value="工作任务"></el-option>
        <el-option label="面谈计划" value="面谈计划"></el-option>
      </el-select>
      
      <el-input v-model="searchKeyword" placeholder="搜索项目..." clearable size="small" prefix-icon="el-icon-search" @change="loadProjects" />
    </div>

    <!-- 项目列表 -->
    <div class="project-list">
      <el-row :gutter="20">
        <el-col :span="24" v-if="projectStore.isLoading">
          <div class="loading-state">
            <el-icon><Loading /></el-icon>
            <span>加载中...</span>
          </div>
        </el-col>
        
        <el-col :span="24" v-else-if="filteredProjects.length === 0">
          <div class="empty-state">
            <el-icon><DocumentAdd /></el-icon>
            <p>暂无项目，点击"新建项目"开始</p>
            <el-button type="primary" @click="generateProjectSuggestion" style="margin-top: 10px;">
              <el-icon><HelpFilled /></el-icon> 获取AI建议
            </el-button>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8" v-for="project in filteredProjects" :key="project.id">
          <el-card :body-style="{ padding: '20px' }" class="project-card">
            <div class="project-card-header">
              <h3>{{ project.name }}</h3>
              <div class="project-actions">
                <el-dropdown @command="handleProjectAction">
                  <span class="el-dropdown-link">
                    <el-icon><Setting /></el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="{ type: 'edit', id: project.id }">编辑</el-dropdown-item>
                      <el-dropdown-item :command="{ type: 'complete', id: project.id }" v-if="project.status === 'active'">完成</el-dropdown-item>
                      <el-dropdown-item :command="{ type: 'archive', id: project.id }" v-if="project.status !== 'archived'">归档</el-dropdown-item>
                      <el-dropdown-item :command="{ type: 'activate', id: project.id }" v-if="project.status !== 'active'">激活</el-dropdown-item>
                      <el-dropdown-item :command="{ type: 'evaluate_progress', id: project.id }">
                        <el-icon><HelpFilled /></el-icon> AI评估进度
                      </el-dropdown-item>
                      <el-dropdown-item :command="{ type: 'delete', id: project.id }" danger>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            
            <div class="project-info">
              <div class="project-type">{{ project.type }}</div>
              <div class="project-status" :class="`status-${project.status}`">{{ statusText[project.status] }}</div>
            </div>
            
            <div class="project-description" v-if="project.description">
              {{ project.description }}
            </div>
            
            <div class="project-meta">
              <span>创建于 {{ formatDate(project.created_at) }}</span>
              <span v-if="project.updated_at !== project.created_at">更新于 {{ formatDate(project.updated_at) }}</span>
            </div>
            
            <div class="project-stats">
              <div class="stat-item">
                <span class="stat-label">任务总数</span>
                <span class="stat-value">{{ getProjectTasks(project.id).length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已完成</span>
                <span class="stat-value">{{ getProjectCompletedTasks(project.id).length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">进度</span>
                <span class="stat-value">{{ getProjectProgress(project.id) }}%</span>
              </div>
            </div>
            
            <div class="project-actions-bottom">
              <el-button type="default" size="small" @click="viewProjectDetails(project.id)">
                查看详情
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 创建/编辑项目对话框 -->
    <el-dialog
      v-model="showCreateProjectDialog"
      :title="editingProject ? '编辑项目' : '创建项目'"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="projectForm" :rules="projectRules" ref="projectFormRef">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目类型" prop="type">
          <el-select v-model="projectForm.type" placeholder="请选择项目类型">
            <el-option label="活动策划" value="活动策划"></el-option>
            <el-option label="培训计划" value="培训计划"></el-option>
            <el-option label="工作任务" value="工作任务"></el-option>
            <el-option label="面谈计划" value="面谈计划"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input v-model="projectForm.description" type="textarea" :rows="6" placeholder="请输入项目描述" />
          <el-button size="small" type="primary" @click="aiAssistProjectDescription" style="margin-top: 10px;" :loading="isGenerating">
            <el-icon><HelpFilled /></el-icon> AI辅助编写
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateProjectDialog = false">取消</el-button>
          <el-button type="primary" @click="submitProjectForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 项目详情抽屉 -->
    <el-drawer
      v-model="showProjectDetails"
      size="70%"
      :title="selectedProject ? selectedProject.name : '项目详情'"
      direction="rtl"
    >
      <div v-if="selectedProject" class="project-details">
        <div class="project-details-header">
          <div class="details-info">
            <div class="details-type">{{ selectedProject.type }}</div>
            <div class="details-status" :class="`status-${selectedProject.status}`">{{ statusText[selectedProject.status] }}</div>
          </div>
          <div class="details-meta">
            <span>创建于 {{ formatDate(selectedProject.created_at) }}</span>
            <span v-if="selectedProject.updated_at !== selectedProject.created_at">更新于 {{ formatDate(selectedProject.updated_at) }}</span>
          </div>
        </div>
        
        <div class="project-details-description" v-if="selectedProject.description">
          <h4>项目描述</h4>
          <p>{{ selectedProject.description }}</p>
        </div>
        
        <!-- AI项目分析面板 -->
        <div class="ai-project-analysis">
          <h4><el-icon><Flag /></el-icon> AI智能分析</h4>
          
          <!-- 项目摘要 -->
          <div class="analysis-section">
            <div class="section-header">
              <h5><el-icon><HelpFilled /></el-icon> 项目智能摘要</h5>
              <el-button size="small" type="primary" @click="enhancedGenerateProjectSummary(selectedProject).catch(handleApiKeyError)" :loading="isGenerating">
                <el-icon><RefreshRight /></el-icon> 智能分析
              </el-button>
            </div>
            <div class="analysis-content" v-if="projectSummary">
              <div class="ai-output" v-html="formatMarkdown(projectSummary)"></div>
              <div class="ai-analysis-actions">
                <el-button size="small" @click="copyToClipboard(projectSummary)">
                  复制结果
                </el-button>
              </div>
            </div>
            <div class="analysis-content empty" v-else-if="!isGenerating">
              <p>点击"智能分析"获取AI生成的项目摘要</p>
            </div>
            <div class="analysis-content loading" v-else>
              <el-icon class="loading-icon"><Loading /></el-icon>
              <p>AI正在分析项目数据...</p>
            </div>
          </div>
          
          <!-- 任务建议 -->
          <div class="analysis-section">
            <div class="section-header">
              <h5><el-icon><HelpFilled /></el-icon> 智能任务建议</h5>
              <el-button size="small" type="primary" @click="enhancedGenerateTaskSuggestions(selectedProject).catch(handleApiKeyError)" :loading="isGenerating">
                <el-icon><RefreshRight /></el-icon> 智能生成
              </el-button>
            </div>
            <div class="analysis-content" v-if="taskSuggestions">
              <div class="ai-output" v-html="formatMarkdown(taskSuggestions)"></div>
              <div class="ai-analysis-actions">
                <el-button size="small" @click="copyToClipboard(taskSuggestions)">
                  复制结果
                </el-button>
                <el-button size="small" type="primary" @click="addSuggestedTasks(taskSuggestions)">
                  添加到任务
                </el-button>
              </div>
            </div>
            <div class="analysis-content empty" v-else-if="!isGenerating">
              <p>点击"智能生成"获取AI任务建议</p>
            </div>
            <div class="analysis-content loading" v-else>
              <el-icon class="loading-icon"><Loading /></el-icon>
              <p>AI正在生成任务建议...</p>
            </div>
          </div>
          
          <!-- 风险分析 -->
          <div class="analysis-section">
            <div class="section-header">
              <h5><el-icon><Flag /></el-icon> 智能风险分析</h5>
              <el-button size="small" type="primary" @click="enhancedAnalyzeProjectRisks(selectedProject).catch(handleApiKeyError)" :loading="isGenerating">
                <el-icon><RefreshRight /></el-icon> 风险评估
              </el-button>
            </div>
            <div class="analysis-content" v-if="riskAnalysis">
              <div class="ai-output" v-html="formatMarkdown(riskAnalysis)"></div>
              <div class="ai-analysis-actions">
                <el-button size="small" @click="copyToClipboard(riskAnalysis)">
                  复制结果
                </el-button>
                <el-button size="small" type="primary" @click="generateRiskMitigationPlan(riskAnalysis)">
                  生成缓解计划
                </el-button>
              </div>
            </div>
            <div class="analysis-content empty" v-else-if="!isGenerating">
              <p>点击"风险评估"获取AI风险分析</p>
            </div>
            <div class="analysis-content loading" v-else>
              <el-icon class="loading-icon"><Loading /></el-icon>
              <p>AI正在评估项目风险...</p>
            </div>
          </div>
        </div>
        
        <div class="project-tasks-section">
          <div class="tasks-header">
            <h4>项目任务</h4>
            <el-button type="primary" size="small" @click="showCreateTaskDialog = true">
              <el-icon><Plus /></el-icon>
              添加任务
            </el-button>
          </div>
          
          <div class="tasks-list">
            <div v-if="projectTasks.length === 0" class="empty-tasks">
              <p>暂无任务，点击"添加任务"开始</p>
            </div>
            
            <el-table :data="projectTasks" stripe size="small">
              <el-table-column prop="title" label="任务名称" width="300" />
              <el-table-column prop="priority" label="优先级" width="100">
                <template #default="scope">
                  <el-tag :type="getPriorityTagType(scope.row.priority)">{{ getPriorityText(scope.row.priority) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="getStatusTagType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="assigned_to" label="负责人" width="120" />
              <el-table-column prop="due_date" label="截止日期" width="120">
                <template #default="scope">
                  {{ scope.row.due_date ? formatDate(scope.row.due_date) : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="scope">
                  <el-dropdown @command="handleTaskStatusChange(scope.row.id, $event)" size="small" placement="bottom">
                    <el-button type="text" size="small">
                      {{ getStatusText(scope.row.status) }}
                      <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item v-if="scope.row.status !== 'todo'" command="todo">待办</el-dropdown-item>
                        <el-dropdown-item v-if="scope.row.status !== 'in_progress'" command="in_progress">进行中</el-dropdown-item>
                        <el-dropdown-item v-if="scope.row.status !== 'completed'" command="completed">已完成</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <el-button type="text" size="small" @click="editTask(scope.row)">编辑</el-button>
                  <el-button type="text" size="small" danger @click="deleteTaskConfirm(scope.row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 创建/编辑任务对话框 -->
    <el-dialog
      v-model="showCreateTaskDialog"
      :title="editingTask ? '编辑任务' : '创建任务'"
      width="600px"
      @close="resetTaskForm"
    >
      <el-form :model="taskForm" :rules="taskRules" ref="taskFormRef">
        <el-form-item label="任务名称" prop="title">
          <el-input v-model="taskForm.title" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input v-model="taskForm.description" type="textarea" :rows="4" placeholder="请输入任务描述" />
          <el-button size="small" type="primary" @click="aiAssistTaskDescription" style="margin-top: 10px;" :loading="isGenerating">
            <el-icon><HelpFilled /></el-icon> AI辅助编写
          </el-button>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="taskForm.priority" placeholder="请选择优先级">
            <el-option label="高" value="high"></el-option>
            <el-option label="中" value="medium"></el-option>
            <el-option label="低" value="low"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="assigned_to">
          <el-input v-model="taskForm.assigned_to" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="taskForm.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="截止日期" prop="due_date">
          <el-date-picker
            v-model="taskForm.due_date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateTaskDialog = false">取消</el-button>
          <el-button type="primary" @click="submitTaskForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElButton, ElCard, ElSelect, ElOption, ElInput, ElDialog, ElForm, ElFormItem, ElTable, ElTableColumn, ElTag, ElDatePicker, ElDrawer, ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon, ElMessage, ElMessageBox, ElProgress } from 'element-plus'
import { Plus, Setting, DocumentAdd, Loading, ArrowDown, Flag, HelpFilled, RefreshRight, Message, Star, DataAnalysis, Guide } from '@element-plus/icons-vue'
import { useProjectStore } from '../stores/project.js'
import { useAIService } from '../services/ai.js'

// 项目状态文本映射
const statusText = {
  active: '进行中',
  completed: '已完成',
  archived: '已归档'
}

// 任务优先级文本映射
const priorityText = {
  high: '高',
  medium: '中',
  low: '低'
}

// 任务状态文本映射
const taskStatusText = {
  todo: '待办',
  in_progress: '进行中',
  completed: '已完成'
}

// Store
const projectStore = useProjectStore()
const aiService = useAIService()

// 状态变量
const statusFilter = ref('all')
const typeFilter = ref('all')
const searchKeyword = ref('')
const showCreateProjectDialog = ref(false)
const showProjectDetails = ref(false)
const showCreateTaskDialog = ref(false)
const editingProject = ref(null)
const selectedProject = ref(null)
const editingTask = ref(null)

// AI相关状态
const isGenerating = ref(false)
const aiSuggestions = ref('')
const projectSummary = ref('')
const taskSuggestions = ref('')
const riskAnalysis = ref('')
const showAiPanel = ref(false)

// 表单引用
const projectFormRef = ref(null)
const taskFormRef = ref(null)

// 项目表单数据
const projectForm = ref({
  name: '',
  type: '工作任务',
  description: ''
})

// 任务表单数据
const taskForm = ref({
  title: '',
  description: '',
  priority: 'medium',
  assigned_to: '',
  department: '',
  due_date: ''
})

// 项目表单规则
const projectRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '项目名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 任务表单规则
const taskRules = {
  title: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 100, message: '任务名称长度在 2 到 100 个字符', trigger: 'blur' }
  ]
}

// 过滤后的项目列表
const filteredProjects = computed(() => {
  let projects = [...projectStore.projects]
  
  // 按状态筛选
  if (statusFilter.value !== 'all') {
    projects = projects.filter(project => project.status === statusFilter.value)
  }
  
  // 按类型筛选
  if (typeFilter.value !== 'all') {
    projects = projects.filter(project => project.type === typeFilter.value)
  }
  
  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    projects = projects.filter(project => 
      project.name.toLowerCase().includes(keyword) || 
      project.description.toLowerCase().includes(keyword)
    )
  }
  
  return projects
})

// 当前选中项目的任务列表
const projectTasks = computed(() => {
  if (!selectedProject.value) return []
  return projectStore.getTasksByProjectId(selectedProject.value.id)
})

// 获取项目任务
const getProjectTasks = (projectId) => {
  return projectStore.getTasksByProjectId(projectId)
}

// 获取项目已完成任务
const getProjectCompletedTasks = (projectId) => {
  return getProjectTasks(projectId).filter(task => task.status === 'completed')
}

// 获取项目进度
const getProjectProgress = (projectId) => {
  const tasks = getProjectTasks(projectId)
  if (tasks.length === 0) return 0
  const completedTasks = getProjectCompletedTasks(projectId)
  return Math.round((completedTasks.length / tasks.length) * 100)
}

// 获取优先级标签类型
const getPriorityTagType = (priority) => {
  const typeMap = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return typeMap[priority] || 'info'
}

// 获取优先级文本
const getPriorityText = (priority) => {
  return priorityText[priority] || priority
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    todo: 'info',
    in_progress: 'primary',
    completed: 'success'
  }
  return typeMap[status] || 'default'
}

// 获取状态文本
const getStatusText = (status) => {
  return taskStatusText[status] || status
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

// 额外状态变量
const isSaving = ref(false)
const selectedAIModel = ref('default')
const aiSettings = ref({
  includeSeasonalFactors: true,
  considerRecentProjects: true,
  suggestionDetailLevel: 'medium'
})

// AI生成项目建议
const generateProjectSuggestion = async () => {
  try {
    isGenerating.value = true
    // 获取用户当前项目状态作为上下文
    const currentProjects = projectStore.projects
    const projectTypes = [...new Set(currentProjects.map(p => p.type))]
    const projectCount = currentProjects.length
    
    // 获取季节信息
    const now = new Date()
    const seasons = ['冬季', '春季', '夏季', '秋季']
    const currentSeason = seasons[Math.floor(now.getMonth() / 3)]
    
    // 获取最近完成的项目
    const recentProjects = currentProjects
      .filter(p => p.status === 'completed')
      .sort((a, b) => new Date(b.completed_at || b.updated_at) - new Date(a.completed_at || a.updated_at))
      .slice(0, 3)
    
    // 根据设置生成详细的提示词
    let prompt = `你是一个智能项目管理助手，能为用户提供个性化的项目建议。根据以下内容，为用户生成一个新项目建议，包括项目名称、类型、描述和关键任务：\n` +
                  `1. 用户当前正在管理 ${projectCount} 个项目\n` +
                  `2. 用户已有的项目类型：${projectTypes.join('、') || '暂无项目'}\n`
                  
    // 添加季节因素
    if (aiSettings.value.includeSeasonalFactors) {
      prompt += `3. 当前季节：${currentSeason}\n`
    }
    
    // 添加最近项目信息
    if (aiSettings.value.considerRecentProjects && recentProjects.length > 0) {
      prompt += `4. 用户最近完成的项目：${recentProjects.map(p => p.name).join('、')}\n`
    }
    
    // 继续添加其他要求
    prompt += `5. 可选的项目类型包括：活动策划、培训计划、工作任务、面谈计划\n` +
              `6. 建议应实用、有针对性，并考虑用户可能的需求\n` +
              `7. 请以Markdown格式输出，包括标题、列表等格式\n`
              
    // 根据详细程度设置调整输出要求
    if (aiSettings.value.suggestionDetailLevel === 'high') {
      prompt += `8. 请提供详细的项目建议，包括每个任务的预期完成时间和资源需求\n`
    } else if (aiSettings.value.suggestionDetailLevel === 'low') {
      prompt += `8. 请提供简洁的项目建议，重点突出核心内容\n`
    }
    
    // 设置模型参数
    const modelParams = selectedAIModel.value === 'creative' ? 
      { temperature: 0.8, max_tokens: 1200 } : 
      { temperature: 0.5, max_tokens: 1000 }
    
    const response = await aiService.continueText(prompt, modelParams)
    aiSuggestions.value = optimizeAISuggestionOutput(response)
  } catch (error) {
    ElMessage.error('生成项目建议失败: ' + error.message)
    console.error('生成项目建议失败:', error)
  } finally {
    isGenerating.value = false
  }
}

// 格式化Markdown文本
const formatMarkdown = (text) => {
  if (!text) return ''
  
  // 基本的Markdown转HTML转换
  let formatted = text
    .replace(/^# (.*$)/gm, '<h1 class="markdown-h1">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="markdown-h2">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="markdown-h3">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gm, '<div class="markdown-list-item">• $1</div>')
    .replace(/^\d\. (.*$)/gm, '<div class="markdown-ordered-item">$&</div>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
  
  return formatted
}

// 优化AI建议输出
const optimizeAISuggestionOutput = (text) => {
  if (!text) return ''
  
  // 提取项目名称、类型、描述和任务的逻辑
  let optimized = text
  
  // 确保有项目名称
  if (!optimized.match(/^# /m)) {
    optimized = '# 项目建议\n' + optimized
  }
  
  // 确保有关键任务部分
  if (!optimized.match(/关键任务|任务列表|Tasks/i)) {
    optimized += '\n\n## 关键任务\n- 待定义'
  }
  
  return optimized
}

// 显示AI功能引导
const showAIFeaturesTour = () => {
  ElMessageBox.alert(
    `<div class="ai-tour-content">
      <h3>AI项目管理助手功能介绍</h3>
      <p>1. <strong>项目建议</strong>：根据您的项目历史和当前需求，AI可以为您生成个性化的项目建议</p>
      <p>2. <strong>进度评估</strong>：AI可以分析您的项目进度，提供改进建议</p>
      <p>3. <strong>智能撰写</strong>：在创建项目描述时，可以使用AI辅助编写</p>
      <p>4. <strong>风险分析</strong>：AI可以帮助您识别项目中的潜在风险</p>
    </div>`, 
    'AI功能引导',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '开始体验'
    }
  )
}

// 显示项目统计
const showAllProjectsStats = async () => {
  try {
    const currentProjects = projectStore.projects
    const totalTasks = currentProjects.reduce((sum, project) => sum + getProjectTasks(project.id).length, 0)
    const completedTasks = currentProjects.reduce((sum, project) => sum + getProjectCompletedTasks(project.id).length, 0)
    
    const prompt = `根据以下项目统计数据，生成一份项目管理分析报告：\n` +
                  `1. 项目总数：${currentProjects.length}\n` +
                  `2. 任务总数：${totalTasks}\n` +
                  `3. 已完成任务：${completedTasks}\n` +
                  `4. 总体完成率：${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%\n` +
                  `5. 项目类型分布：${[...new Set(currentProjects.map(p => p.type))].join('、') || '暂无项目'}\n` +
                  `请以Markdown格式输出，包括标题、统计数据可视化建议和改进建议`
    
    isGenerating.value = true
    const response = await aiService.continueText(prompt)
    
    ElMessageBox.alert(
      `<div class="project-stats-report" v-html="formatMarkdown(response)">${formatMarkdown(response)}</div>`,
      '项目统计分析',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '关闭'
      }
    )
  } catch (error) {
    ElMessage.error('生成项目统计失败: ' + error.message)
    console.error('生成项目统计失败:', error)
  } finally {
    isGenerating.value = false
  }
}

// 显示建议设置
const showSuggestionSettings = () => {
  ElMessageBox.alert(
    `<div class="ai-settings-content">
      <h3>AI建议设置</h3>
      <p>当前设置：</p>
      <ul>
        <li>季节因素：${aiSettings.value.includeSeasonalFactors ? '开启' : '关闭'}</li>
        <li>考虑最近项目：${aiSettings.value.considerRecentProjects ? '开启' : '关闭'}</li>
        <li>建议详细程度：${{
          low: '简洁',
          medium: '中等',
          high: '详细'
        }[aiSettings.value.suggestionDetailLevel]}</li>
      </ul>
    </div>`,
    'AI设置',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  )
}

// 重新生成项目建议
const regenerateSuggestion = async () => {
  await generateProjectSuggestion()
}

// 将AI建议保存为新项目
const saveAsProject = async () => {
  if (!aiSuggestions.value) {
    ElMessage.warning('请先生成项目建议')
    return
  }
  
  try {
    isSaving.value = true
    
    // 解析AI建议，提取项目信息
    // 这里使用简化的解析逻辑，实际项目中可以根据AI返回的格式进行更复杂的解析
    const prompt = `从以下项目建议中提取项目名称、类型、描述，并以JSON格式返回：\n${aiSuggestions.value}`
    
    const response = await aiService.continueText(prompt)
    
    // 尝试解析JSON响应
    let projectInfo
    try {
      projectInfo = JSON.parse(response)
    } catch (e) {
      // 如果解析失败，使用默认值
      projectInfo = {
        name: 'AI生成项目',
        type: '工作任务',
        description: aiSuggestions.value.substring(0, 200) + '...'
      }
    }
    
    // 填充表单并打开创建对话框
    projectForm.value = {
      name: projectInfo.name || 'AI生成项目',
      type: projectInfo.type || '工作任务',
      description: projectInfo.description || ''
    }
    editingProject.value = null
    showCreateProjectDialog.value = true
    
    // 提示用户表单已填充
    ElMessage.success('项目信息已填充到表单中，请确认后创建')
  } catch (error) {
    ElMessage.error('保存项目失败: ' + error.message)
    console.error('保存项目失败:', error)
  } finally {
    isSaving.value = false
  }
}

// 增强的AI生成项目摘要
const enhancedGenerateProjectSummary = async (project) => {
  try {
    isGenerating.value = true
    
    // 收集更详细的项目信息
    const projectInfo = {
      name: project.name,
      type: project.type,
      description: project.description,
      tasks: projectStore.getTasksByProjectId(project.id),
      status: project.status,
      progress: getProjectProgress(project.id),
      createdTime: project.created_at
    }
    
    // 计算项目统计信息
    const totalTasks = projectInfo.tasks.length
    const completedTasks = projectInfo.tasks.filter(t => t.status === 'completed').length
    const inProgressTasks = projectInfo.tasks.filter(t => t.status === 'in_progress').length
    const todoTasks = projectInfo.tasks.filter(t => t.status === 'todo').length
    const overdueTasks = projectInfo.tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length
    
    const prompt = `请为以下项目生成一份详细的项目摘要：\n` +
                  `项目名称：${projectInfo.name}\n` +
                  `项目类型：${projectInfo.type}\n` +
                  `项目描述：${projectInfo.description}\n` +
                  `项目状态：${projectInfo.status}\n` +
                  `项目进度：${projectInfo.progress}%\n` +
                  `项目统计：\n` +
                  `- 总任务数：${totalTasks}\n` +
                  `- 已完成任务：${completedTasks}\n` +
                  `- 进行中任务：${inProgressTasks}\n` +
                  `- 待办任务：${todoTasks}\n` +
                  `- 逾期任务：${overdueTasks}\n` +
                  `摘要应包括项目概况、当前进度分析、关键任务和下一步建议，并以Markdown格式输出。`
    
    const response = await aiService.generateSummary(prompt)
    projectSummary.value = response
  } catch (error) {
    ElMessage.error('生成项目摘要失败: ' + error.message)
    console.error('生成项目摘要失败:', error)
  } finally {
    isGenerating.value = false
  }
}

// 复制文本到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 增强的AI生成任务建议
const enhancedGenerateTaskSuggestions = async (project) => {
  try {
    isGenerating.value = true
    
    // 收集项目信息和当前任务状态
    const projectInfo = {
      name: project.name,
      type: project.type,
      description: project.description,
      currentTasks: projectStore.getTasksByProjectId(project.id)
    }
    
    // 分析当前任务状态
    const currentTaskTitles = projectInfo.currentTasks.map(t => t.title)
    const taskCount = projectInfo.currentTasks.length
    
    const prompt = `为以下项目生成详细的任务建议：\n` +
                  `项目名称：${projectInfo.name}\n` +
                  `项目类型：${projectInfo.type}\n` +
                  `项目描述：${projectInfo.description}\n` +
                  `当前任务数量：${taskCount}\n` +
                  `当前已有任务：${currentTaskTitles.length > 0 ? currentTaskTitles.join('、') : '暂无'}\n` +
                  `请基于项目类型和描述，生成具体、可执行的任务建议，确保不与现有任务重复。\n` +
                  `每个任务应包含：任务名称、优先级、预计耗时、负责人建议。\n` +
                  `请以Markdown列表格式输出，并使用清晰的标题和分类。`
    
    const response = await aiService.continueText(prompt)
    taskSuggestions.value = response
  } catch (error) {
    ElMessage.error('生成任务建议失败: ' + error.message)
    console.error('生成任务建议失败:', error)
  } finally {
    isGenerating.value = false
  }
}

// 将AI建议的任务添加到项目
const addSuggestedTasks = async (suggestions) => {
  if (!suggestions || !selectedProject.value) {
    ElMessage.warning('请先生成任务建议')
    return
  }
  
  try {
    isSaving.value = true
    
    // 解析AI建议，提取任务信息
    const prompt = `从以下任务建议中提取任务名称列表，并以JSON格式返回：\n${suggestions}`
    
    const response = await aiService.continueText(prompt)
    
    // 尝试解析JSON响应
    let tasksData
    try {
      tasksData = JSON.parse(response)
    } catch (e) {
      // 如果解析失败，简单提取列表项
      const taskRegex = /-\s*(.+?)(?:\(|\n|$)/g
      const taskMatches = [...suggestions.matchAll(taskRegex)]
      tasksData = taskMatches.map(match => match[1].trim())
    }
    
    // 创建任务
    const tasksToCreate = Array.isArray(tasksData) ? tasksData : 
                         tasksData.tasks || tasksData.taskNames || []
    
    if (tasksToCreate.length === 0) {
      ElMessage.warning('未找到可添加的任务')
      return
    }
    
    // 批量创建任务
    const createPromises = tasksToCreate.slice(0, 5).map(task => {
      const taskName = typeof task === 'string' ? task : task.name || task
      return projectStore.createTask(selectedProject.value.id, {
        title: taskName,
        description: '',
        priority: 'medium',
        assigned_to: '',
        department: '',
        due_date: ''
      })
    })
    
    await Promise.all(createPromises)
    
    ElMessage.success(`已成功添加 ${Math.min(tasksToCreate.length, 5)} 个任务（最多添加5个）`)
  } catch (error) {
    ElMessage.error('添加任务失败: ' + error.message)
    console.error('添加任务失败:', error)
  } finally {
    isSaving.value = false
  }
}

// 增强的AI分析项目风险
const enhancedAnalyzeProjectRisks = async (project) => {
  try {
    isGenerating.value = true
    
    // 收集详细的项目风险相关信息
    const projectInfo = {
      name: project.name,
      type: project.type,
      description: project.description,
      tasks: projectStore.getTasksByProjectId(project.id),
      status: project.status,
      progress: getProjectProgress(project.id),
      created_at: project.created_at
    }
    
    // 计算更详细的项目风险指标
    const totalTasks = projectInfo.tasks.length
    const completedTasks = projectInfo.tasks.filter(t => t.status === 'completed').length
    const inProgressTasks = projectInfo.tasks.filter(t => t.status === 'in_progress').length
    const todoTasks = projectInfo.tasks.filter(t => t.status === 'todo').length
    const overdueTasks = projectInfo.tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length
    const highPriorityTasks = projectInfo.tasks.filter(t => t.priority === 'high').length
    
    // 计算风险相关指标
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const overdueRate = totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0
    const highPriorityRatio = totalTasks > 0 ? Math.round((highPriorityTasks / totalTasks) * 100) : 0
    
    const prompt = `请详细分析以下项目可能面临的风险：\n` +
                  `项目名称：${projectInfo.name}\n` +
                  `项目类型：${projectInfo.type}\n` +
                  `项目描述：${projectInfo.description}\n` +
                  `项目状态：${projectInfo.status}\n` +
                  `项目进度：${projectInfo.progress}%\n` +
                  `\n项目详细指标：\n` +
                  `- 总任务数：${totalTasks}\n` +
                  `- 已完成任务：${completedTasks} (${completionRate}%)\n` +
                  `- 进行中任务：${inProgressTasks}\n` +
                  `- 待办任务：${todoTasks}\n` +
                  `- 逾期任务：${overdueTasks} (${overdueRate}%)\n` +
                  `- 高优先级任务：${highPriorityTasks} (${highPriorityRatio}%)\n` +
                  `\n分析要求：\n` +
                  `1. 基于项目类型、状态和详细指标进行全面风险评估\n` +
                  `2. 识别至少5个主要风险，按严重性排序\n` +
                  `3. 对每个风险提供：风险描述、影响范围、风险等级（高/中/低）\n` +
                  `4. 提供初步的应对建议\n` +
                  `5. 以结构化的Markdown格式输出，使用清晰的标题和列表`
    
    const response = await aiService.continueText(prompt)
    riskAnalysis.value = response
  } catch (error) {
    ElMessage.error('分析项目风险失败: ' + error.message)
    console.error('分析项目风险失败:', error)
  } finally {
    isGenerating.value = false
  }
}

// 生成风险缓解计划
const generateRiskMitigationPlan = async (riskAnalysis) => {
  if (!riskAnalysis || !selectedProject.value) {
    ElMessage.warning('请先进行风险分析')
    return
  }
  
  try {
    isGenerating.value = true
    
    const project = selectedProject.value
    
    const prompt = `基于以下风险分析结果，为项目生成详细的风险缓解计划：\n` +
                  `\n项目基本信息：\n` +
                  `项目名称：${project.name}\n` +
                  `项目类型：${project.type}\n` +
                  `\n风险分析结果：\n${riskAnalysis}\n` +
                  `\n计划要求：\n` +
                  `1. 针对每个已识别的风险，制定具体的缓解措施\n` +
                  `2. 每个措施应包含：措施描述、负责人、预计完成时间、所需资源\n` +
                  `3. 按风险优先级排序，先处理高风险\n` +
                  `4. 提供可执行的任务建议，便于直接添加到项目中\n` +
                  `5. 以结构化的Markdown格式输出`
    
    const response = await aiService.continueText(prompt)
    
    // 显示生成的缓解计划
    ElMessageBox.alert(response, '风险缓解计划', {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '复制计划',
      callback: () => {
        copyToClipboard(response)
      }
    })
    
  } catch (error) {
    ElMessage.error('生成风险缓解计划失败: ' + error.message)
    console.error('生成风险缓解计划失败:', error)
  } finally {
    isGenerating.value = false
  }
}

// 处理API密钥错误
const handleApiKeyError = (error) => {
  if (error.message.includes('API密钥')) {
    ElMessageBox.alert('请先配置OpenRouter API密钥', '提示', {
      confirmButtonText: '确定',
      callback: () => {
        // 这里可以添加跳转到API密钥配置页面的逻辑
      }
    })
  }
}

// 加载项目数据
const loadProjects = async () => {
  await projectStore.loadProjects()
  await projectStore.loadTasks()
}

// 重置项目表单
const resetForm = () => {
  projectForm.value = {
    name: '',
    type: '工作任务',
    description: ''
  }
  editingProject.value = null
  if (projectFormRef.value) {
    projectFormRef.value.resetFields()
  }
}

// 重置任务表单
const resetTaskForm = () => {
  taskForm.value = {
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    department: '',
    due_date: ''
  }
  editingTask.value = null
  if (taskFormRef.value) {
    taskFormRef.value.resetFields()
  }
}

// 提交项目表单
const submitProjectForm = async () => {
  if (!projectFormRef.value) return
  
  try {
    await projectFormRef.value.validate()
    
    if (editingProject.value) {
      // 编辑项目
      await projectStore.updateProject(editingProject.value, projectForm.value)
      ElMessage.success('项目更新成功')
    } else {
      // 创建新项目
      await projectStore.createProject(projectForm.value)
      ElMessage.success('项目创建成功')
    }
    
    showCreateProjectDialog.value = false
    resetForm()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 提交任务表单
const submitTaskForm = async () => {
  if (!taskFormRef.value || !selectedProject.value) return
  
  try {
    await taskFormRef.value.validate()
    
    if (editingTask.value) {
      // 编辑任务
      await projectStore.updateTask(editingTask.value.id, taskForm.value)
      ElMessage.success('任务更新成功')
    } else {
      // 创建新任务
      await projectStore.createTask(selectedProject.value.id, taskForm.value)
      ElMessage.success('任务创建成功')
    }
    
    showCreateTaskDialog.value = false
    resetTaskForm()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// AI辅助编写项目描述
const aiAssistProjectDescription = async () => {
  if (!projectForm.value.name) {
    ElMessage.warning('请先输入项目名称')
    return
  }
  
  try {
    isGenerating.value = true
    
    const prompt = `根据以下信息，为项目生成详细的项目描述：\n` +
                  `项目名称：${projectForm.value.name}\n` +
                  `项目类型：${projectForm.value.type || '工作任务'}\n` +
                  `现有描述：${projectForm.value.description || '暂无'}\n` +
                  `请生成专业、详细的项目描述，包括项目背景、目标、范围和预期成果。`
    
    const response = await aiService.continueText(prompt)
    projectForm.value.description = response
  } catch (error) {
    ElMessage.error('AI辅助编写失败: ' + error.message)
    console.error('AI辅助编写失败:', error)
  } finally {
    isGenerating.value = false
  }
}

// AI辅助编写任务描述
const aiAssistTaskDescription = async () => {
  if (!taskForm.value.title) {
    ElMessage.warning('请先输入任务名称')
    return
  }
  
  try {
    isGenerating.value = true
    
    // 获取项目上下文
    const projectContext = selectedProject.value ? 
                          `项目名称：${selectedProject.value.name}\n项目类型：${selectedProject.value.type}\n` : 
                          ''
    
    const prompt = `根据以下信息，为任务生成详细的任务描述：\n` +
                  `任务名称：${taskForm.value.title}\n` +
                  `${projectContext}` +
                  `现有描述：${taskForm.value.description || '暂无'}\n` +
                  `优先级：${getPriorityText(taskForm.value.priority)}\n` +
                  `请生成专业、具体、可执行的任务描述，包括任务内容、步骤和验收标准。`
    
    const response = await aiService.continueText(prompt)
    taskForm.value.description = response
  } catch (error) {
    ElMessage.error('AI辅助编写失败: ' + error.message)
    console.error('AI辅助编写失败:', error)
  } finally {
    isGenerating.value = false
  }
}

// AI自动评估项目进度
const aiEvaluateProjectProgress = async (project) => {
  try {
    isGenerating.value = true
    
    const projectInfo = {
      name: project.name,
      type: project.type,
      description: project.description,
      tasks: projectStore.getTasksByProjectId(project.id),
      status: project.status,
      progress: getProjectProgress(project.id)
    }
    
    // 计算项目统计信息
    const totalTasks = projectInfo.tasks.length
    const completedTasks = projectInfo.tasks.filter(t => t.status === 'completed').length
    const inProgressTasks = projectInfo.tasks.filter(t => t.status === 'in_progress').length
    const todoTasks = projectInfo.tasks.filter(t => t.status === 'todo').length
    const overdueTasks = projectInfo.tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length
    
    const prompt = `请评估以下项目的实际进度和健康状况：\n` +
                  `项目名称：${projectInfo.name}\n` +
                  `项目类型：${projectInfo.type}\n` +
                  `项目描述：${projectInfo.description}\n` +
                  `当前系统计算进度：${projectInfo.progress}%\n` +
                  `项目统计：\n` +
                  `- 总任务数：${totalTasks}\n` +
                  `- 已完成任务：${completedTasks}\n` +
                  `- 进行中任务：${inProgressTasks}\n` +
                  `- 待办任务：${todoTasks}\n` +
                  `- 逾期任务：${overdueTasks}\n` +
                  `请基于以上信息，评估项目的实际进度（与系统计算可能不同）、项目健康状况，并提供改进建议。`
    
    const response = await aiService.continueText(prompt)
    
    // 显示评估结果
    ElMessageBox.alert(response, 'AI进度评估', {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '复制评估',
      callback: () => {
        copyToClipboard(response)
      }
    })
    
  } catch (error) {
    ElMessage.error('评估项目进度失败: ' + error.message)
    console.error('评估项目进度失败:', error)
  } finally {
    isGenerating.value = false
  }
}

// 处理项目操作
const handleProjectAction = async (command) => {
  const { type, id } = command
  
  switch (type) {
    case 'edit': {
      // 编辑项目
      const project = projectStore.getProjectById(id)
      if (project) {
        projectForm.value = {
          name: project.name,
          type: project.type,
          description: project.description
        }
        editingProject.value = id
        showCreateProjectDialog.value = true
      }
      break
    }
      
    case 'complete':
      // 完成项目
      await projectStore.completeProject(id)
      ElMessage.success('项目已标记为完成')
      break
      
    case 'archive':
      // 归档项目
      await projectStore.archiveProject(id)
      ElMessage.success('项目已归档')
      break
      
    case 'activate':
      // 激活项目
      await projectStore.activateProject(id)
      ElMessage.success('项目已激活')
      break
      
    case 'evaluate_progress': {
      // AI评估项目进度
      const project = projectStore.getProjectById(id)
      if (project) {
        await aiEvaluateProjectProgress(project)
      }
      break
    }
      
    case 'delete':
      // 删除项目
      ElMessageBox.confirm('确定要删除这个项目吗？删除后相关任务也会被删除。', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        await projectStore.deleteProject(id)
        ElMessage.success('项目已删除')
      }).catch(() => {
        // 用户取消删除
      })
      break
  }
}

// 查看项目详情
const viewProjectDetails = (projectId) => {
  const project = projectStore.getProjectById(projectId)
  if (project) {
    selectedProject.value = project
    showProjectDetails.value = true
    
    // 重置AI分析结果
    projectSummary.value = ''
    taskSuggestions.value = ''
    riskAnalysis.value = ''
    
    // 自动生成项目摘要
    setTimeout(() => {
      enhancedGenerateProjectSummary(project).catch(handleApiKeyError)
    }, 500)
  }
}

// 编辑任务
const editTask = (task) => {
  taskForm.value = {
    title: task.title,
    description: task.description,
    priority: task.priority,
    assigned_to: task.assigned_to,
    department: task.department,
    due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
  }
  editingTask.value = task
  showCreateTaskDialog.value = true
}

// 处理任务状态变更
const handleTaskStatusChange = async (taskId, newStatus) => {
  try {
    await projectStore.updateTask(taskId, { status: newStatus })
    ElMessage.success('任务状态已更新')
  } catch (error) {
    console.error('更新任务状态失败:', error)
    ElMessage.error('更新任务状态失败')
  }
}

// 删除任务确认
const deleteTaskConfirm = (taskId) => {
  ElMessageBox.confirm('确定要删除这个任务吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await projectStore.deleteTask(taskId)
    ElMessage.success('任务已删除')
  }).catch(() => {
    // 用户取消删除
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadProjects()
})

// 处理AI功能下拉菜单命令
const handleAIFeature = async (command) => {
  switch (command) {
    case 'show_panel':
      showAiPanel.value = true
      break
    case 'generate_suggestion':
      await generateProjectSuggestion()
      showAiPanel.value = true
      break
    case 'show_stats':
      await showAllProjectsStats()
      break
    case 'show_tour':
      showAIFeaturesTour()
      break
    case 'settings':
      showSuggestionSettings()
      break
  }
}
</script>

<style scoped>
.project-management {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

/* AI助手横幅 */
.ai-banner {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #bae6fd;
}

.banner-icon {
  color: #0284c7;
  font-size: 20px;
}

.ai-banner span {
  flex: 1;
  color: #0369a1;
  font-weight: 500;
}

.ai-banner .el-button {
  color: #0284c7;
  padding: 4px 12px;
  height: auto;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.ai-assistant-btn {
  background-color: #f0f9ff;
  color: #0ea5e9;
  border-color: #0ea5e9;
}

.ai-assistant-btn:hover {
  background-color: #e0f2fe;
  color: #0284c7;
  border-color: #0284c7;
}

/* AI面板样式 */
.ai-panel {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #bae6fd;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
}

.ai-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ai-panel-header h3 {
  margin: 0;
  color: #0284c7;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-panel-content {
  background: white;
  border-radius: 6px;
  padding: 16px;
  min-height: 100px;
}

.ai-panel-content.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.ai-panel-content.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.loading-icon {
  animation: rotate 1s linear infinite;
  color: #0ea5e9;
}

.ai-suggestion {
  line-height: 1.6;
  color: #334155;
}

/* AI项目分析面板样式 */
.ai-project-analysis {
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  border: 1px solid #bae6fd;
}

.ai-project-analysis h4 {
  margin: 0 0 16px 0;
  color: #0284c7;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.analysis-section {
  margin-bottom: 16px;
  background: white;
  border-radius: 6px;
  padding: 16px;
}

.analysis-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h5 {
  margin: 0;
  color: #334155;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.analysis-content {
  min-height: 80px;
  line-height: 1.6;
}

.analysis-content.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-style: italic;
}

.analysis-content.loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-output {
  color: #334155;
  white-space: pre-wrap;
}

/* 动画效果 */
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
  }
  
  .header-actions .el-button {
    width: 100%;
  }
  
  .ai-panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

.project-filter {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.project-filter .el-select,
.project-filter .el-input {
  width: 200px;
}

.project-list {
  flex: 1;
}

.project-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.project-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.project-card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.project-info {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.project-type {
  background-color: #f0f9ff;
  color: #0284c7;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.project-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-active {
  background-color: #f0f9ff;
  color: #0284c7;
}

.status-completed {
  background-color: #ecfdf5;
  color: #10b981;
}

.status-archived {
  background-color: #f9fafb;
  color: #6b7280;
}

.project-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #909399;
  font-size: 12px;
  margin-bottom: 12px;
}

.project-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  color: #909399;
  font-size: 12px;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.project-actions-bottom {
  margin-top: auto;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}

.loading-state .el-icon,
.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.project-details {
  height: 100%;
  overflow-y: auto;
}

.project-details-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.details-info {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.details-type,
.details-status {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
}

.details-meta {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 12px;
}

.project-details-description {
  margin-bottom: 24px;
}

.project-details-description h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.project-details-description p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.project-tasks-section {
  margin-bottom: 24px;
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tasks-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.empty-tasks {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}
</style>