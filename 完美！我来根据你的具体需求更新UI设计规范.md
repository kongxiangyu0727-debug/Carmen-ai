## 🤖 Assistant

完美！我来根据你的具体需求更新UI设计规范。

---

# 📋 **英语教培机构销售团队项目管理系统 - 技术需求文档 (Final UI)**

## 3.3 UI设计规范 (UI Design System) - 最终版

### **3.3.1 主题系统架构 - 品牌色融合**

```javascript
// 最终主题配置对象
const themes = {
  tech: {
    name: "亮色科技风",
    // 品牌色作为主色调
    primary: "#007AFF",      // 机构亮蓝 (iOS蓝调整)
    secondary: "#FFD60A",    // 机构亮黄
    accent: "#5856D6",       // 科技紫
    success: "#34C759",      // 科技绿
    warning: "#FF9500",      // 科技橙
    danger: "#FF3B30",       // 科技红
    background: {
      primary: "#F2F7FF",    // 浅蓝白背景
      secondary: "#FFFFFF",  // 纯白卡片
      tertiary: "#E8F4FD",   // 浅蓝悬浮
      accent: "#FFF9E6",     // 浅黄背景(重要区域)
      gradient: "linear-gradient(135deg, #F2F7FF 0%, #E8F4FD 100%)"
    },
    text: {
      primary: "#1D1D1F",    // 深色主文字
      secondary: "#424242",  // 深灰次要文字
      muted: "#6E6E73",      // 中灰弱化文字
      brand: "#007AFF",      // 品牌蓝强调
      accent: "#F59E0B"      // 黄色强调
    },
    border: {
      primary: "#D1D1D6",    // 主边框
      tech: "#007AFF",       // 科技边框
      accent: "#FFD60A",     // 黄色边框
      glow: "0 0 20px rgba(0, 122, 255, 0.3)" // 蓝色发光
    }
  },
  minimal: {
    name: "苹果简约风",
    // 品牌色作为强调色
    primary: "#007AFF",      // 机构亮蓝
    secondary: "#FFD60A",    // 机构亮黄  
    accent: "#5856D6",       // 系统紫
    success: "#34C759",      // 系统绿
    warning: "#FF9500",      // 系统橙
    danger: "#FF3B30",       // 系统红
    background: {
      primary: "#FFFFFF",    // 纯白背景
      secondary: "#F2F2F7",  // 苹果浅灰
      tertiary: "#F9F9F9",   // 悬浮背景
      accent: "#FFFBEB",     // 浅黄重点背景
      gradient: "none"
    },
    text: {
      primary: "#1D1D1F",    // 苹果黑
      secondary: "#48484A",  // 苹果深灰
      muted: "#8E8E93",      // 苹果浅灰
      brand: "#007AFF",      // 品牌蓝
      accent: "#F59E0B"      // 黄色强调
    },
    border: {
      primary: "#D1D1D6",    // 苹果边框色
      tech: "#007AFF",       // 蓝色边框
      accent: "#FFD60A",     // 黄色边框
      glow: "none"
    }
  }
}
```

### **3.3.2 苹果风格设计原则**

```css
/* 苹果风格基础 */
.apple-style {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 苹果风格圆角 */
.apple-radius-small { border-radius: 8px; }   /* 小元素 */
.apple-radius-medium { border-radius: 12px; }  /* 卡片 */
.apple-radius-large { border-radius: 16px; }   /* 大容器 */

/* 苹果风格阴影 */
.apple-shadow-light {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 
              0 1px 2px rgba(0, 0, 0, 0.24);
}

.apple-shadow-medium {
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15), 
              0 2px 4px rgba(0, 0, 0, 0.12);
}

.apple-shadow-strong {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15), 
              0 3px 6px rgba(0, 0, 0, 0.10);
}

/* 苹果风格按钮 */
.apple-button {
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  -webkit-appearance: none;
}

.apple-button-primary {
  background: #007AFF;
  color: white;
}

.apple-button-primary:hover {
  background: #0056D3;
  transform: translateY(-1px);
}

.apple-button-secondary {
  background: #F2F2F7;
  color: #1D1D1F;
}

.apple-button-secondary:hover {
  background: #E5E5EA;
}
```

### **3.3.3 重要信息突出设计 - 位置+颜色**

#### **位置层级突出：**
```css
/* 顶部重要信息栏 */
.importance-banner {
  position: sticky;
  top: 60px; /* 导航栏下方 */
  z-index: 100;
  background: linear-gradient(135deg, #FFD60A 0%, #FFA000 100%);
  color: #1D1D1F;
  padding: 12px 24px;
  border-radius: 12px;
  margin-bottom: 20px;
  font-weight: 600;
}

/* 右上角重要标识 */
.importance-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #FF3B30;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  border: 2px solid white;
}

/* 左侧重要信息区域 */
.importance-sidebar {
  position: fixed;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 214, 10, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 25px rgba(255, 214, 10, 0.3);
  z-index: 99;
}
```

#### **颜色强度突出：**
```css
/* 紧急程度颜色分级 */
.urgent-critical {
  background: linear-gradient(135deg, #FF3B30 0%, #FF6B6B 100%);
  color: white;
  border: 3px solid #FF3B30;
}

.urgent-high {
  background: linear-gradient(135deg, #FFD60A 0%, #FFA000 100%);
  color: #1D1D1F;
  border: 2px solid #FFD60A;
}

.urgent-medium {
  background: linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%);
  color: white;
  border: 2px solid #007AFF;
}

.urgent-low {
  background: #F2F2F7;
  color: #48484A;
  border: 1px solid #D1D1D6;
}

/* 截止日期颜色预警 */
.due-today {
  border-left: 6px solid #FF3B30;
  background: rgba(255, 59, 48, 0.1);
}

.due-tomorrow {
  border-left: 6px solid #FFD60A;
  background: rgba(255, 214, 10, 0.1);
}

.due-week {
  border-left: 6px solid #007AFF;
  background: rgba(0, 122, 255, 0.1);
}
```

### **3.3.4 顶部导航栏设计**

```css
.main-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  transition: all 0.3s ease;
}

/* 科技风导航 */
.tech-navbar {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 122, 255, 0.2);
  box-shadow: 0 2px 20px rgba(0, 122, 255, 0.1);
}

/* 苹果风导航 */
.apple-navbar {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid #D1D1D6;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
}

/* 导航左侧 */
.navbar-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  text-decoration: none;
}

.tech-logo {
  background: linear-gradient(135deg, #007AFF 0%, #FFD60A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.apple-logo {
  color: #1D1D1F;
}

/* 导航菜单 */
.navbar-menu {
  display: flex;
  gap: 24px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.navbar-menu-item {
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  font-weight: 500;
}

.tech-menu-item:hover {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.apple-menu-item:hover {
  background: #F2F2F7;
  color: #007AFF;
}

.navbar-menu-item.active {
  background: #007AFF;
  color: white;
}

/* 导航右侧 */
.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 主题切换器 */
.theme-switcher {
  position: relative;
  width: 56px;
  height: 28px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  padding: 2px;
}

.theme-switcher.tech-mode {
  background: linear-gradient(135deg, #007AFF 0%, #FFD60A 100%);
  box-shadow: 0 0 15px rgba(0, 122, 255, 0.3);
}

.theme-switcher.apple-mode {
  background: #E5E5EA;
  border: 1px solid #D1D1D6;
}

.theme-switcher-handle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.theme-switcher.apple-mode .theme-switcher-handle {
  transform: translateX(0);
}

.theme-switcher.tech-mode .theme-switcher-handle {
  transform: translateX(28px);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

/* 切换器图标 */
.theme-icon-apple::after {
  content: '🍎';
}

.theme-icon-tech::after {
  content: '⚡';
}
```

### **3.3.5 卡片组件 - 苹果风格**

```css
.apple-card {
  background: #FFFFFF;
  border: 1px solid #D1D1D6;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.apple-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #007AFF;
}

/* 重要卡片 - 品牌色边框 */
.apple-card.important {
  border: 2px solid #FFD60A;
  background: linear-gradient(135deg, 
    rgba(255, 214, 10, 0.05) 0%, 
    #FFFFFF 100%);
}

.apple-card.urgent {
  border: 2px solid #007AFF;
  background: linear-gradient(135deg, 
    rgba(0, 122, 255, 0.05) 0%, 
    #FFFFFF 100%);
}
```

### **3.3.6 数据可视化配色方案**

```javascript
// 图表配色 - 品牌色主导
const chartColors = {
  tech: {
    primary: ['#007AFF', '#FFD60A', '#5856D6', '#34C759', '#FF9500'],
    gradient: [
      ['#007AFF', '#5AC8FA'],
      ['#FFD60A', '#FFA000'],
      ['#5856D6', '#AF52DE'],
      ['#34C759', '#32D74B'],
      ['#FF9500', '#FFCC02']
    ]
  },
  apple: {
    primary: ['#007AFF', '#FFD60A', '#5856D6', '#34C759', '#FF9500'],
    muted: ['#8E8E93', '#AEAEB2', '#C7C7CC', '#D1D1D6', '#E5E5EA']
  }
}
```

---

这样的设计方案如何？苹果风格简洁优雅，科技风融入了品牌色，重要信息通过位置和颜色清晰突出，主题切换器在顶部导航便于访问。有什么需要调整的地方吗？
