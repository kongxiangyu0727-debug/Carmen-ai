<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <h2>日历</h2>
      <div class="calendar-controls">
        <el-button type="text" size="small" @click="previousMonth">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h3>{{ currentYear }}年{{ currentMonth + 1 }}月</h3>
        <el-button type="text" size="small" @click="nextMonth">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        
        <!-- 节日/纪念日显示控制 -->
        <el-switch 
          v-model="showHolidays" 
          size="small"
          active-text="显示"
          inactive-text="隐藏"
          class="holiday-toggle"
        />
        <span class="holiday-label">节日</span>
        
        <!-- 农历显示控制 -->
        <el-switch 
          v-model="showLunarCalendar" 
          size="small"
          active-text="显示"
          inactive-text="隐藏"
          class="holiday-toggle"
        />
        <span class="holiday-label">农历</span>
      </div>
    </div>
    
    <!-- 日历主体 -->
    <div class="calendar-body">
      <!-- 星期标题 -->
      <div class="calendar-weekdays">
        <div v-for="day in weekdays" :key="day" class="weekday">
          {{ day }}
        </div>
      </div>
      
      <!-- 日历格子 -->
      <div class="calendar-days">
        <!-- 上个月的日期 -->
        <div 
          v-for="day in prevMonthDays" 
          :key="`prev-${day}`"
          class="calendar-day prev-month"
        >
          <div class="day-number">{{ day }}</div>
        </div>
        
        <!-- 当前月的日期 -->
        <div 
          v-for="day in daysInMonth" 
          :key="day"
          class="calendar-day current-month"
          :class="{ 'today': isToday(day) }"
        >
          <div class="day-number">{{ day }}</div>
          
          <!-- 农历日期显示 -->
          <div v-if="showLunarCalendar" class="lunar-date">
            {{ getLunarInfo(currentYear.value, currentMonth.value, day).chineseDate }}
          </div>
          
          <!-- 节日/纪念日显示 -->
          <div v-if="showHolidays" class="day-holidays">
            <div 
              v-for="holiday in getHolidaysForDay(day)" 
              :key="holiday.name"
              class="holiday-item"
              :class="holiday.type"
            >
              {{ holiday.name }}
            </div>
          </div>
          
          <!-- 当天的待办事项 -->
          <div class="day-todos">
            <div 
              v-for="todo in getTodosForDay(day)" 
              :key="todo.id"
              class="todo-item"
              :class="{ 'todo-completed': todo.completed }"
              @click="toggleTodo(todo.id)"
            >
              <el-checkbox 
                :checked="todo.completed" 
                size="small"
                @change="toggleTodo(todo.id)"
              />
              <span class="todo-content">{{ todo.content }}</span>
            </div>
          </div>
        </div>
        
        <!-- 下个月的日期 -->
        <div 
          v-for="day in nextMonthDays" 
          :key="`next-${day}`"
          class="calendar-day next-month"
        >
          <div class="day-number">{{ day }}</div>
        </div>
      </div>
    </div>
    
    <!-- 图例 -->
    <div class="calendar-legend">
      <div class="legend-item">
        <div class="legend-dot pending"></div>
        <span>待办事项</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot completed"></div>
        <span>已完成事项</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot lunar-date"></div>
        <span>农历日期</span>
      </div>
      
      <!-- 节日图例 -->
  <div class="legend-item">
    <div class="legend-dot chinese-holiday"></div>
    <span>中国节日</span>
  </div>
  <div class="legend-item">
    <div class="legend-dot world-holiday"></div>
    <span>世界节日</span>
  </div>
  <div class="legend-item">
    <div class="legend-dot chinese-memorial"></div>
    <span>中国纪念日</span>
  </div>
  <div class="legend-item">
    <div class="legend-dot world-memorial"></div>
    <span>世界纪念日</span>
  </div>
  <div class="legend-item">
    <div class="legend-dot solar-term"></div>
    <span>二十四节气</span>
  </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElButton, ElCheckbox, ElIcon } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useTodoStore } from '../stores/todo'

// 存储
const todoStore = useTodoStore()

// 状态变量
const currentDate = ref(new Date())
const showHolidays = ref(true) // 控制是否显示节日/纪念日
const showLunarCalendar = ref(true) // 控制是否显示农历

// 公历节日和纪念日数据
const solarHolidays = {
  // 中国节日
  '01-01': [{ name: '元旦', type: 'chinese-holiday' }],
  '02-14': [{ name: '情人节', type: 'world-holiday' }],
  '03-08': [{ name: '妇女节', type: 'world-holiday' }],
  '03-12': [{ name: '植树节', type: 'chinese-holiday' }],
  '04-01': [{ name: '愚人节', type: 'world-holiday' }],
  '05-01': [{ name: '劳动节', type: 'chinese-holiday' }],
  '05-04': [{ name: '青年节', type: 'chinese-holiday' }],
  '06-01': [{ name: '儿童节', type: 'world-holiday' }],
  '07-01': [{ name: '建党节', type: 'chinese-memorial' }],
  '08-01': [{ name: '建军节', type: 'chinese-memorial' }],
  '09-10': [{ name: '教师节', type: 'chinese-holiday' }],
  '10-01': [{ name: '国庆节', type: 'chinese-holiday' }],
  '12-24': [{ name: '平安夜', type: 'world-holiday' }],
  '12-25': [{ name: '圣诞节', type: 'world-holiday' }],
  
  // 世界纪念日
  '01-26': [{ name: '国际大屠杀纪念日', type: 'world-memorial' }],
  '02-02': [{ name: '世界湿地日', type: 'world-memorial' }],
  '02-10': [{ name: '世界气象日', type: 'world-memorial' }],
  '02-21': [{ name: '国际母语日', type: 'world-memorial' }],
  '03-03': [{ name: '世界野生动植物日', type: 'world-memorial' }],
  '03-20': [{ name: '国际幸福日', type: 'world-memorial' }],
  '03-21': [{ name: '世界森林日', type: 'world-memorial' }, { name: '世界睡眠日', type: 'world-memorial' }],
  '03-22': [{ name: '世界水日', type: 'world-memorial' }],
  '03-23': [{ name: '世界气象日', type: 'world-memorial' }],
  '03-24': [{ name: '世界防治结核病日', type: 'world-memorial' }],
  '04-07': [{ name: '世界卫生日', type: 'world-memorial' }],
  '04-22': [{ name: '地球日', type: 'world-memorial' }],
  '05-03': [{ name: '世界新闻自由日', type: 'world-memorial' }],
  '05-08': [{ name: '世界红十字日', type: 'world-memorial' }],
  '05-12': [{ name: '国际护士节', type: 'world-memorial' }],
  '05-15': [{ name: '国际家庭日', type: 'world-memorial' }],
  '05-17': [{ name: '世界电信日', type: 'world-memorial' }],
  '05-20': [{ name: '世界计量日', type: 'world-memorial' }],
  '05-21': [{ name: '世界文化多样性促进对话和发展日', type: 'world-memorial' }],
  '05-22': [{ name: '国际生物多样性日', type: 'world-memorial' }],
  '05-31': [{ name: '世界无烟日', type: 'world-memorial' }],
  '06-05': [{ name: '世界环境日', type: 'world-memorial' }],
  '06-17': [{ name: '世界防治荒漠化和干旱日', type: 'world-memorial' }],
  '06-26': [{ name: '国际禁毒日', type: 'world-memorial' }],
  '07-11': [{ name: '世界人口日', type: 'world-memorial' }],
  '07-28': [{ name: '世界肝炎日', type: 'world-memorial' }],
  '08-09': [{ name: '国际土著人日', type: 'world-memorial' }],
  '08-12': [{ name: '国际青年日', type: 'world-memorial' }],
  '08-29': [{ name: '全球战胜肥胖日', type: 'world-memorial' }],
  '09-08': [{ name: '国际扫盲日', type: 'world-memorial' }],
  '09-16': [{ name: '国际臭氧层保护日', type: 'world-memorial' }],
  '09-21': [{ name: '世界和平日', type: 'world-memorial' }],
  '09-27': [{ name: '世界旅游日', type: 'world-memorial' }],
  '10-01': [{ name: '国际老年人日', type: 'world-memorial' }],
  '10-05': [{ name: '世界教师日', type: 'world-memorial' }],
  '10-09': [{ name: '世界邮政日', type: 'world-memorial' }],
  '10-10': [{ name: '世界精神卫生日', type: 'world-memorial' }],
  '10-13': [{ name: '世界保健日', type: 'world-memorial' }],
  '10-15': [{ name: '国际盲人节', type: 'world-memorial' }],
  '10-16': [{ name: '世界粮食日', type: 'world-memorial' }],
  '10-17': [{ name: '国际消除贫困日', type: 'world-memorial' }],
  '10-24': [{ name: '联合国日', type: 'world-memorial' }],
  '11-01': [{ name: '世界城市日', type: 'world-memorial' }],
  '11-14': [{ name: '世界糖尿病日', type: 'world-memorial' }],
  '11-16': [{ name: '国际宽容日', type: 'world-memorial' }],
  '11-19': [{ name: '世界厕所日', type: 'world-memorial' }],
  '11-20': [{ name: '国际儿童日', type: 'world-memorial' }],
  '11-25': [{ name: '国际消除对妇女暴力日', type: 'world-memorial' }],
  '11-29': [{ name: '国际声援巴勒斯坦人民日', type: 'world-memorial' }],
  '12-01': [{ name: '世界艾滋病日', type: 'world-memorial' }],
  '12-03': [{ name: '国际残疾人日', type: 'world-memorial' }],
  '12-05': [{ name: '国际志愿者日', type: 'world-memorial' }],
  '12-09': [{ name: '国际反腐败日', type: 'world-memorial' }],
  '12-18': [{ name: '国际移徙者日', type: 'world-memorial' }],
  '12-20': [{ name: '国际人类团结日', type: 'world-memorial' }],
  
  // 中国纪念日
  '01-27': [{ name: '南京大屠杀纪念日', type: 'chinese-memorial' }],
  '02-01': [{ name: '立春', type: 'solar-term' }],
  '02-19': [{ name: '雨水', type: 'solar-term' }],
  '03-05': [{ name: '惊蛰', type: 'solar-term' }],
  '03-20': [{ name: '春分', type: 'solar-term' }],
  '04-04': [{ name: '清明', type: 'solar-term' }],
  '04-19': [{ name: '谷雨', type: 'solar-term' }],
  '05-05': [{ name: '立夏', type: 'solar-term' }],
  '05-12': [{ name: '汶川地震纪念日', type: 'chinese-memorial' }],
  '05-20': [{ name: '小满', type: 'solar-term' }],
  '06-05': [{ name: '芒种', type: 'solar-term' }],
  '06-21': [{ name: '夏至', type: 'solar-term' }],
  '07-06': [{ name: '小暑', type: 'solar-term' }],
  '07-07': [{ name: '七七事变纪念日', type: 'chinese-memorial' }],
  '07-22': [{ name: '大暑', type: 'solar-term' }],
  '08-07': [{ name: '立秋', type: 'solar-term' }],
  '08-15': [{ name: '日本投降日', type: 'chinese-memorial' }],
  '08-23': [{ name: '处暑', type: 'solar-term' }],
  '09-07': [{ name: '白露', type: 'solar-term' }],
  '09-18': [{ name: '九一八事变纪念日', type: 'chinese-memorial' }],
  '09-23': [{ name: '秋分', type: 'solar-term' }],
  '10-08': [{ name: '寒露', type: 'solar-term' }],
  '10-23': [{ name: '霜降', type: 'solar-term' }],
  '11-07': [{ name: '立冬', type: 'solar-term' }],
  '11-22': [{ name: '小雪', type: 'solar-term' }],
  '12-06': [{ name: '大雪', type: 'solar-term' }],
  '12-13': [{ name: '国家公祭日', type: 'chinese-memorial' }],
  '12-22': [{ name: '冬至', type: 'solar-term' }]
}

// 农历节日数据
const lunarHolidays = {
  // 中国传统节日（使用农历日期）
  '01-01': [{ name: '春节', type: 'chinese-holiday' }],
  '01-15': [{ name: '元宵节', type: 'chinese-holiday' }],
  '02-02': [{ name: '龙抬头', type: 'chinese-holiday' }],
  '04-04': [{ name: '寒食节', type: 'chinese-holiday' }],
  '05-05': [{ name: '端午节', type: 'chinese-holiday' }],
  '07-07': [{ name: '七夕节', type: 'chinese-holiday' }],
  '07-15': [{ name: '中元节', type: 'chinese-holiday' }],
  '08-15': [{ name: '中秋节', type: 'chinese-holiday' }],
  '09-09': [{ name: '重阳节', type: 'chinese-holiday' }],
  '12-08': [{ name: '腊八节', type: 'chinese-holiday' }],
  '12-23': [{ name: '小年', type: 'chinese-holiday' }],
  '12-30': [{ name: '除夕', type: 'chinese-holiday' }]
}

// 公历节日（非固定日期）
const variableHolidays = {
  // 清明节（中国传统节日，节气）
  qingming: {
    getDate: function(year) {
      // 简化的清明节计算，实际应根据节气确定
      // 清明节通常在公历4月4日或5日
      const baseYear = 2000
      const baseDate = new Date(baseYear, 3, 4)
      // 每4年闰一次，调整日期
      const leapYears = Math.floor((year - baseYear) / 4)
      const adjust = year % 4 === 0 && year % 100 !== 0 || year % 400 === 0 ? 1 : 0
      const day = 4 + Math.floor((year - baseYear + leapYears + adjust) % 2)
      return new Date(year, 3, day)
    },
    name: '清明节',
    type: 'chinese-holiday'
  },
  // 母亲节（第二个星期日）
  mother: {
    getDate: function(year) {
      // 母亲节是每年5月的第二个星期日
      const firstDay = new Date(year, 4, 1)
      const firstSunday = firstDay.getDay() === 0 ? 1 : 8 - firstDay.getDay()
      return new Date(year, 4, firstSunday + 7)
    },
    name: '母亲节',
    type: 'world-holiday'
  },
  // 父亲节（第三个星期日）
  father: {
    getDate: function(year) {
      // 父亲节是每年6月的第三个星期日
      const firstDay = new Date(year, 5, 1)
      const firstSunday = firstDay.getDay() === 0 ? 1 : 8 - firstDay.getDay()
      return new Date(year, 5, firstSunday + 14)
    },
    name: '父亲节',
    type: 'world-holiday'
  },
  // 中国青年节（5月4日）
  youth: {
    month: 5,
    day: 4,
    name: '青年节',
    type: 'chinese-holiday'
  }
}

// 星期标题
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 计算属性
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

// 获取当月有多少天
const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

// 获取当月第一天是星期几
const firstDayOfMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay()
})

// 获取上个月的最后几天（用于填充日历）
const prevMonthDays = computed(() => {
  const prevMonth = new Date(currentYear.value, currentMonth.value, 0)
  const prevMonthDaysCount = prevMonth.getDate()
  const days = []
  
  for (let i = 0; i < firstDayOfMonth.value; i++) {
    days.push(prevMonthDaysCount - firstDayOfMonth.value + i + 1)
  }
  
  return days
})

// 获取下个月的开始几天（用于填充日历）
const nextMonthDays = computed(() => {
  const totalDays = daysInMonth.value + prevMonthDays.value.length
  const remainingDays = 42 - totalDays // 6行7列 = 42个格子
  const days = []
  
  for (let i = 1; i <= remainingDays; i++) {
    days.push(i)
  }
  
  return days
})

// 方法
const previousMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

const isToday = (day) => {
  const today = new Date()
  return (
    today.getFullYear() === currentYear.value &&
    today.getMonth() === currentMonth.value &&
    today.getDate() === day
  )
}

// 获取指定日期的待办事项
const getTodosForDay = (day) => {
  const targetDate = new Date(currentYear.value, currentMonth.value, day)
  const dateStr = targetDate.toDateString()
  
  return todoStore.todos.filter(todo => {
    const todoDate = new Date(todo.created_at)
    return todoDate.toDateString() === dateStr
  })
}

// === 农历转换功能 ===
// 农历数据，支持2023-2030年
const lunarCalendarData = {
  // 农历月份大小（0表示小月，1表示大月）
  lunarMonthDays: {
    2023: [0, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30],
    2024: [0, 30, 29, 30, 29, 30, 29, 30, 30, 29, 30, 29, 30], // 2024年农历月份天数
    2025: [0, 30, 29, 30, 29, 30, 29, 30, 30, 29, 30, 29, 30],
    2026: [0, 30, 29, 30, 29, 29, 30, 29, 30, 30, 29, 30, 29],
    2027: [0, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30],
    2028: [0, 30, 29, 30, 29, 30, 30, 29, 30, 29, 30, 29, 30],
    2029: [0, 30, 29, 30, 29, 30, 29, 30, 30, 29, 30, 29, 30],
    2030: [0, 29, 30, 29, 30, 29, 30, 29, 30, 30, 29, 30, 29]
  },
  // 农历每月第一天对应的公历日期
  lunarMonthStart: {
    2023: {
      1: new Date(2023, 0, 22), // 2023年正月初一
      2: new Date(2023, 1, 20),
      3: new Date(2023, 2, 22),
      4: new Date(2023, 3, 20),
      5: new Date(2023, 4, 21),
      6: new Date(2023, 5, 20),
      7: new Date(2023, 6, 20),
      8: new Date(2023, 7, 18),
      9: new Date(2023, 8, 17),
      10: new Date(2023, 9, 17),
      11: new Date(2023, 10, 15),
      12: new Date(2023, 11, 14)
    },
    2024: {
      1: new Date(2024, 1, 10), // 2024年正月初一
      2: new Date(2024, 2, 11),
      3: new Date(2024, 3, 10),
      4: new Date(2024, 4, 10),
      5: new Date(2024, 5, 8),
      6: new Date(2024, 6, 7),
      7: new Date(2024, 7, 6),
      8: new Date(2024, 8, 4),
      9: new Date(2024, 9, 4),
      10: new Date(2024, 10, 2),
      11: new Date(2024, 11, 2),
      12: new Date(2025, 0, 1)
    },
    2025: {
      1: new Date(2025, 0, 28), // 2025年正月初一
      2: new Date(2025, 1, 26),
      3: new Date(2025, 2, 28),
      4: new Date(2025, 3, 27),
      5: new Date(2025, 4, 26),
      6: new Date(2025, 5, 24),
      7: new Date(2025, 6, 24),
      8: new Date(2025, 7, 22),
      9: new Date(2025, 8, 21),
      10: new Date(2025, 9, 20),
      11: new Date(2025, 10, 19),
      12: new Date(2025, 11, 17)
    },
    2026: {
      1: new Date(2026, 0, 26), // 2026年正月初一
      2: new Date(2026, 1, 24),
      3: new Date(2026, 2, 26),
      4: new Date(2026, 3, 25),
      5: new Date(2026, 4, 24),
      6: new Date(2026, 5, 23),
      7: new Date(2026, 6, 22),
      8: new Date(2026, 7, 21),
      9: new Date(2026, 8, 19),
      10: new Date(2026, 9, 19),
      11: new Date(2026, 10, 17),
      12: new Date(2026, 11, 17)
    },
    2027: {
      1: new Date(2027, 0, 15), // 2027年正月初一
      2: new Date(2027, 1, 13),
      3: new Date(2027, 2, 15),
      4: new Date(2027, 3, 14),
      5: new Date(2027, 4, 13),
      6: new Date(2027, 5, 12),
      7: new Date(2027, 6, 11),
      8: new Date(2027, 7, 10),
      9: new Date(2027, 8, 8),
      10: new Date(2027, 9, 8),
      11: new Date(2027, 10, 6),
      12: new Date(2027, 11, 6)
    },
    2028: {
      1: new Date(2028, 0, 24), // 2028年正月初一
      2: new Date(2028, 1, 22),
      3: new Date(2028, 2, 23),
      4: new Date(2028, 3, 22),
      5: new Date(2028, 4, 21),
      6: new Date(2028, 5, 20),
      7: new Date(2028, 6, 19),
      8: new Date(2028, 7, 18),
      9: new Date(2028, 8, 16),
      10: new Date(2028, 9, 15),
      11: new Date(2028, 10, 14),
      12: new Date(2028, 11, 14)
    },
    2029: {
      1: new Date(2029, 0, 13), // 2029年正月初一
      2: new Date(2029, 1, 12),
      3: new Date(2029, 2, 13),
      4: new Date(2029, 3, 13),
      5: new Date(2029, 4, 12),
      6: new Date(2029, 5, 10),
      7: new Date(2029, 6, 10),
      8: new Date(2029, 7, 8),
      9: new Date(2029, 8, 7),
      10: new Date(2029, 9, 6),
      11: new Date(2029, 10, 5),
      12: new Date(2029, 11, 5)
    },
    2030: {
      1: new Date(2030, 0, 31), // 2030年正月初一
      2: new Date(2030, 1, 28),
      3: new Date(2030, 2, 30),
      4: new Date(2030, 3, 29),
      5: new Date(2030, 4, 28),
      6: new Date(2030, 5, 27),
      7: new Date(2030, 6, 26),
      8: new Date(2030, 7, 25),
      9: new Date(2030, 8, 23),
      10: new Date(2030, 9, 23),
      11: new Date(2030, 10, 21),
      12: new Date(2030, 11, 20)
    }
  },
  // 节气数据（每年24节气）
  solarTerms: {
    2023: {
      2: { 4: '立春' },   // 2月4日
      2: { 19: '雨水' },  // 2月19日
      3: { 6: '惊蛰' },   // 3月6日
      3: { 21: '春分' },  // 3月21日
      4: { 5: '清明' },   // 4月5日
      4: { 20: '谷雨' },  // 4月20日
      5: { 6: '立夏' },   // 5月6日
      5: { 21: '小满' },  // 5月21日
      6: { 6: '芒种' },   // 6月6日
      6: { 21: '夏至' },  // 6月21日
      7: { 7: '小暑' },   // 7月7日
      7: { 23: '大暑' },  // 7月23日
      8: { 8: '立秋' },   // 8月8日
      8: { 23: '处暑' },  // 8月23日
      9: { 8: '白露' },   // 9月8日
      9: { 23: '秋分' },  // 9月23日
      10: { 8: '寒露' },  // 10月8日
      10: { 24: '霜降' }, // 10月24日
      11: { 8: '立冬' },  // 11月8日
      11: { 22: '小雪' }, // 11月22日
      12: { 7: '大雪' },  // 12月7日
      12: { 22: '冬至' }  // 12月22日
    },
    2024: {
      2: { 4: '立春' },   // 2月4日
      2: { 19: '雨水' },  // 2月19日
      3: { 5: '惊蛰' },   // 3月5日
      3: { 20: '春分' },  // 3月20日
      4: { 4: '清明' },   // 4月4日
      4: { 19: '谷雨' },  // 4月19日
      5: { 5: '立夏' },   // 5月5日
      5: { 20: '小满' },  // 5月20日
      6: { 5: '芒种' },   // 6月5日
      6: { 21: '夏至' },  // 6月21日
      7: { 6: '小暑' },   // 7月6日
      7: { 22: '大暑' },  // 7月22日
      8: { 6: '立秋' },   // 8月6日
      8: { 22: '处暑' },  // 8月22日
      9: { 7: '白露' },   // 9月7日
      9: { 22: '秋分' },  // 9月22日
      10: { 8: '寒露' },  // 10月8日
      10: { 23: '霜降' }, // 10月23日
      11: { 7: '立冬' },  // 11月7日
      11: { 21: '小雪' }, // 11月21日
      12: { 6: '大雪' },  // 12月6日
      12: { 21: '冬至' }  // 12月21日
    },
    2025: {
      2: { 3: '立春' },   // 2月3日
      2: { 18: '雨水' },  // 2月18日
      3: { 5: '惊蛰' },   // 3月5日
      3: { 20: '春分' },  // 3月20日
      4: { 4: '清明' },   // 4月4日
      4: { 20: '谷雨' },  // 4月20日
      5: { 5: '立夏' },   // 5月5日
      5: { 21: '小满' },  // 5月21日
      6: { 5: '芒种' },   // 6月5日
      6: { 21: '夏至' },  // 6月21日
      7: { 6: '小暑' },   // 7月6日
      7: { 22: '大暑' },  // 7月22日
      8: { 7: '立秋' },   // 8月7日
      8: { 23: '处暑' },  // 8月23日
      9: { 7: '白露' },   // 9月7日
      9: { 23: '秋分' },  // 9月23日
      10: { 8: '寒露' },  // 10月8日
      10: { 23: '霜降' }, // 10月23日
      11: { 7: '立冬' },  // 11月7日
      11: { 22: '小雪' }, // 11月22日
      12: { 7: '大雪' },  // 12月7日
      12: { 22: '冬至' }  // 12月22日
    },
    2026: {
      2: { 4: '立春' },   // 2月4日
      2: { 19: '雨水' },  // 2月19日
      3: { 6: '惊蛰' },   // 3月6日
      3: { 21: '春分' },  // 3月21日
      4: { 5: '清明' },   // 4月5日
      4: { 20: '谷雨' },  // 4月20日
      5: { 6: '立夏' },   // 5月6日
      5: { 21: '小满' },  // 5月21日
      6: { 6: '芒种' },   // 6月6日
      6: { 22: '夏至' },  // 6月22日
      7: { 7: '小暑' },   // 7月7日
      7: { 23: '大暑' },  // 7月23日
      8: { 7: '立秋' },   // 8月7日
      8: { 23: '处暑' },  // 8月23日
      9: { 8: '白露' },   // 9月8日
      9: { 23: '秋分' },  // 9月23日
      10: { 9: '寒露' },  // 10月9日
      10: { 24: '霜降' }, // 10月24日
      11: { 8: '立冬' },  // 11月8日
      11: { 22: '小雪' }, // 11月22日
      12: { 7: '大雪' },  // 12月7日
      12: { 22: '冬至' }  // 12月22日
    },
    2027: {
      2: { 4: '立春' },   // 2月4日
      2: { 19: '雨水' },  // 2月19日
      3: { 6: '惊蛰' },   // 3月6日
      3: { 21: '春分' },  // 3月21日
      4: { 5: '清明' },   // 4月5日
      4: { 20: '谷雨' },  // 4月20日
      5: { 6: '立夏' },   // 5月6日
      5: { 21: '小满' },  // 5月21日
      6: { 6: '芒种' },   // 6月6日
      6: { 22: '夏至' },  // 6月22日
      7: { 7: '小暑' },   // 7月7日
      7: { 23: '大暑' },  // 7月23日
      8: { 8: '立秋' },   // 8月8日
      8: { 24: '处暑' },  // 8月24日
      9: { 8: '白露' },   // 9月8日
      9: { 24: '秋分' },  // 9月24日
      10: { 9: '寒露' },  // 10月9日
      10: { 25: '霜降' }, // 10月25日
      11: { 8: '立冬' },  // 11月8日
      11: { 23: '小雪' }, // 11月23日
      12: { 8: '大雪' },  // 12月8日
      12: { 23: '冬至' }  // 12月23日
    },
    2028: {
      2: { 4: '立春' },   // 2月4日
      2: { 18: '雨水' },  // 2月18日
      3: { 5: '惊蛰' },   // 3月5日
      3: { 20: '春分' },  // 3月20日
      4: { 4: '清明' },   // 4月4日
      4: { 19: '谷雨' },  // 4月19日
      5: { 5: '立夏' },   // 5月5日
      5: { 20: '小满' },  // 5月20日
      6: { 5: '芒种' },   // 6月5日
      6: { 21: '夏至' },  // 6月21日
      7: { 6: '小暑' },   // 7月6日
      7: { 22: '大暑' },  // 7月22日
      8: { 7: '立秋' },   // 8月7日
      8: { 23: '处暑' },  // 8月23日
      9: { 7: '白露' },   // 9月7日
      9: { 22: '秋分' },  // 9月22日
      10: { 8: '寒露' },  // 10月8日
      10: { 23: '霜降' }, // 10月23日
      11: { 7: '立冬' },  // 11月7日
      11: { 22: '小雪' }, // 11月22日
      12: { 6: '大雪' },  // 12月6日
      12: { 21: '冬至' }  // 12月21日
    },
    2029: {
      2: { 3: '立春' },   // 2月3日
      2: { 18: '雨水' },  // 2月18日
      3: { 5: '惊蛰' },   // 3月5日
      3: { 20: '春分' },  // 3月20日
      4: { 4: '清明' },   // 4月4日
      4: { 20: '谷雨' },  // 4月20日
      5: { 5: '立夏' },   // 5月5日
      5: { 21: '小满' },  // 5月21日
      6: { 5: '芒种' },   // 6月5日
      6: { 21: '夏至' },  // 6月21日
      7: { 6: '小暑' },   // 7月6日
      7: { 22: '大暑' },  // 7月22日
      8: { 7: '立秋' },   // 8月7日
      8: { 23: '处暑' },  // 8月23日
      9: { 7: '白露' },   // 9月7日
      9: { 23: '秋分' },  // 9月23日
      10: { 8: '寒露' },  // 10月8日
      10: { 23: '霜降' }, // 10月23日
      11: { 7: '立冬' },  // 11月7日
      11: { 22: '小雪' }, // 11月22日
      12: { 7: '大雪' },  // 12月7日
      12: { 22: '冬至' }  // 12月22日
    },
    2030: {
      2: { 4: '立春' },   // 2月4日
      2: { 19: '雨水' },  // 2月19日
      3: { 6: '惊蛰' },   // 3月6日
      3: { 21: '春分' },  // 3月21日
      4: { 5: '清明' },   // 4月5日
      4: { 20: '谷雨' },  // 4月20日
      5: { 6: '立夏' },   // 5月6日
      5: { 21: '小满' },  // 5月21日
      6: { 6: '芒种' },   // 6月6日
      6: { 22: '夏至' },  // 6月22日
      7: { 7: '小暑' },   // 7月7日
      7: { 23: '大暑' },  // 7月23日
      8: { 7: '立秋' },   // 8月7日
      8: { 23: '处暑' },  // 8月23日
      9: { 8: '白露' },   // 9月8日
      9: { 23: '秋分' },  // 9月23日
      10: { 9: '寒露' },  // 10月9日
      10: { 24: '霜降' }, // 10月24日
      11: { 8: '立冬' },  // 11月8日
      11: { 22: '小雪' }, // 11月22日
      12: { 7: '大雪' },  // 12月7日
      12: { 22: '冬至' }  // 12月22日
    }
  }
}

// 公历转农历
const solarToLunar = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // 确保有农历数据支持
  if (!lunarCalendarData.lunarMonthStart || !lunarCalendarData.lunarMonthStart[year]) {
    console.warn(`No lunar calendar data for year: ${year}`);
    return {
      year: year - 1900,
      month: 1,
      day: 1,
      isLeap: false,
      chineseDate: '暂无农历',
      festival: '',
      solarTerm: ''
    }
  }
  
  const lunarMonths = lunarCalendarData.lunarMonthStart[year]
  let lunarMonth = 0
  let lunarDay = 0
  let isLeap = false
  let solarTerm = ''
  
  // 查找对应的农历月份和日期
  for (let i = 1; i <= 12; i++) {
    const monthStart = lunarMonths[i]
    const nextMonth = i === 12 ? 
      new Date(year + 1, 0, 1) : 
      lunarMonths[i + 1]
    
    if (date >= monthStart && date < nextMonth) {
      lunarMonth = i
      // 计算农历日
      const diffTime = date - monthStart
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      lunarDay = diffDays + 1
      break
    }
  }
  
  // 检查是否为节气
  if (lunarCalendarData.solarTerms[year] && lunarCalendarData.solarTerms[year][month] && 
      lunarCalendarData.solarTerms[year][month][day]) {
    solarTerm = lunarCalendarData.solarTerms[year][month][day]
  }
  
  // 生成农历中文表示，确保lunarMonth和lunarDay有效
  const chineseNumbers = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
  
  const chineseMonths = ['', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
  
  // 确保生成有效的中文日期
  let chineseDate = ''
  if (lunarMonth > 0 && lunarDay > 0 && lunarDay <= 30) {
    chineseDate = `${isLeap ? '闰' : ''}${chineseMonths[lunarMonth] || ''}${chineseNumbers[lunarDay] || ''}`
  } else {
    chineseDate = '农历'
  }
  
  // 检查是否为农历节日
  const lunarDateKey = `${String(lunarMonth).padStart(2, '0')}-${String(lunarDay).padStart(2, '0')}`
  const festival = lunarHolidays[lunarDateKey] ? lunarHolidays[lunarDateKey][0].name : ''
  
  return {
    year: year - 1900,
    month: lunarMonth,
    day: lunarDay,
    isLeap: isLeap,
    chineseDate: chineseDate,
    festival: festival,
    solarTerm: solarTerm
  }
}

// 获取指定日期的农历信息
const getLunarInfo = (year, month, day) => {
  const date = new Date(year, month, day)
  return solarToLunar(date)
}

// 获取指定日期的节日和纪念日
const getHolidaysForDay = (day) => {
  const year = currentYear.value
  const month = currentMonth.value
  const date = new Date(year, month, day)
  
  // 公历节日
  const monthStr = String(month + 1).padStart(2, '0')
  const dayStr = String(day).padStart(2, '0')
  const solarDateKey = `${monthStr}-${dayStr}`
  const solarHolidayItems = solarHolidays[solarDateKey] || []
  
  // 农历节日
  const lunarInfo = getLunarInfo(year, month, day)
  const lunarMonthStr = String(lunarInfo.month).padStart(2, '0')
  const lunarDayStr = String(lunarInfo.day).padStart(2, '0')
  const lunarDateKey = `${lunarMonthStr}-${lunarDayStr}`
  const lunarHolidayItems = lunarHolidays[lunarDateKey] || []
  
  // 可变日期节日
  const variableHolidayItems = []
  
  // 清明节特殊处理
  const qingmingDate = variableHolidays.qingming.getDate(year)
  if (qingmingDate.getDate() === day && qingmingDate.getMonth() === month) {
    variableHolidayItems.push({ name: variableHolidays.qingming.name, type: variableHolidays.qingming.type })
  }
  
  // 母亲节处理
  if (variableHolidays.mother && currentYear.value >= 2023) {
    const motherDate = variableHolidays.mother.getDate(year)
    if (motherDate.getDate() === day && motherDate.getMonth() === month) {
      variableHolidayItems.push({ name: variableHolidays.mother.name, type: variableHolidays.mother.type })
    }
  }
  
  // 父亲节处理
  if (variableHolidays.father && currentYear.value >= 2023) {
    const fatherDate = variableHolidays.father.getDate(year)
    if (fatherDate.getDate() === day && fatherDate.getMonth() === month) {
      variableHolidayItems.push({ name: variableHolidays.father.name, type: variableHolidays.father.type })
    }
  }
  
  // 青年节处理
  if (variableHolidays.youth.month === month + 1 && variableHolidays.youth.day === day) {
    variableHolidayItems.push({ name: variableHolidays.youth.name, type: variableHolidays.youth.type })
  }
  
  // 节气处理
  if (lunarInfo.solarTerm) {
    variableHolidayItems.push({ name: lunarInfo.solarTerm, type: 'solar-term' })
  }
  
  return [...solarHolidayItems, ...lunarHolidayItems, ...variableHolidayItems]
}

// 切换待办事项的完成状态
const toggleTodo = async (id) => {
  await todoStore.toggleTodo(id)
}

// 加载待办事项
onMounted(() => {
  todoStore.loadTodos()
})

// 监听待办事项变化，自动更新日历
watch(() => todoStore.todos, () => {
  // 待办事项变化时自动更新日历
}, { deep: true })
</script>

<style scoped>
.calendar-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-header h2 {
  margin: 0;
  color: #303133;
}

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.calendar-controls h3 {
  margin: 0;
  color: #606266;
  font-size: 16px;
  font-weight: normal;
}

.holiday-toggle {
  margin-left: 20px;
}

.holiday-label {
  margin-left: 5px;
  color: #606266;
  font-size: 14px;
}

.calendar-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e6e6e6;
  margin-bottom: 1px;
}

.weekday {
  background-color: #f5f7fa;
  padding: 10px;
  text-align: center;
  font-weight: bold;
  color: #606266;
  font-size: 14px;
}

.calendar-days {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 1px;
  background-color: #e6e6e6;
  overflow-y: auto;
}

.calendar-day {
  background-color: #fff;
  padding: 8px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.calendar-day.prev-month,
.calendar-day.next-month {
  background-color: #fafafa;
}

.calendar-day.prev-month .day-number,
.calendar-day.next-month .day-number {
  color: #c0c4cc;
}

.calendar-day.today {
  background-color: #e6f7ff;
}

.day-number {
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
  padding: 2px 5px;
  border-radius: 4px;
  align-self: flex-start;
}

.lunar-date {
  font-size: 10px;
  color: #909399;
  margin-bottom: 3px;
  text-align: center;
  padding: 1px 3px;
  border-radius: 3px;
  background-color: #fafafa;
}

.calendar-day.today .day-number {
  background-color: #1890ff;
  color: white;
}

.day-holidays {
  margin-bottom: 5px;
}

.holiday-item {
  font-size: 10px;
  padding: 1px 3px;
  border-radius: 3px;
  margin-bottom: 1px;
  text-align: center;
}

.holiday-item.chinese-holiday {
  background-color: #fff1f0;
  color: #cf1322;
  border: 1px solid #ffccc7;
}

.holiday-item.world-holiday {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.holiday-item.chinese-memorial {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.holiday-item.world-memorial {
    background-color: #fff7e6;
    color: #fa8c16;
    border: 1px solid #ffd591;
  }
  
  .holiday-item.solar-term {
    background-color: #f0f5ff;
    color: #4096ff;
    border: 1px solid #bae7ff;
  }

.day-todos {
  flex: 1;
  overflow-y: auto;
  font-size: 12px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px;
  margin-bottom: 2px;
  border-radius: 4px;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.todo-item:hover {
  background-color: #e9ecef;
}

.todo-item.todo-completed {
  background-color: #f0f9ff;
  opacity: 0.7;
}

.todo-content {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #e6e6e6;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #606266;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 4px;
}

.legend-dot.pending {
  background-color: #f8f9fa;
  border: 1px solid #dcdfe6;
}

.legend-dot.completed {
  background-color: #f0f9ff;
  border: 1px solid #91d5ff;
}

.legend-dot.lunar-date {
  background-color: #fafafa;
  border: 1px solid #dcdfe6;
}

.legend-dot.chinese-holiday {
  background-color: #fff1f0;
  border: 1px solid #ffccc7;
}

.legend-dot.world-holiday {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
}

.legend-dot.chinese-memorial {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
}

.legend-dot.world-memorial {
    background-color: #fff7e6;
    border: 1px solid #ffd591;
  }
  
  .legend-dot.solar-term {
    background-color: #f0f5ff;
    border: 1px solid #bae7ff;
  }

/* 滚动条样式 */
.calendar-days::-webkit-scrollbar,
.day-todos::-webkit-scrollbar {
  width: 4px;
}

.calendar-days::-webkit-scrollbar-track,
.day-todos::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.calendar-days::-webkit-scrollbar-thumb,
.day-todos::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 2px;
}

.calendar-days::-webkit-scrollbar-thumb:hover,
.day-todos::-webkit-scrollbar-thumb:hover {
  background: #909399;
}
</style>