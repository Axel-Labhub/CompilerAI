# 编译器职场知识库 - 功能增强说明

## 概述

本次更新为"编译器"职场知识库完成了4项核心功能优化：

1. **搜索增强** - 全文搜索、实时建议、关键词高亮
2. **历史版本** - 版本快照、版本比较、版本恢复
3. **笔记关联** - 双向链接、链接建议、快速跳转
4. **激活码系统** - 会员激活、权限管理、功能锁定

---

## 1. 搜索增强

### 功能特性

- **全文搜索**：支持笔记标题、内容、标签的全文检索
- **实时建议**：输入时自动显示搜索建议和历史记录
- **关键词高亮**：搜索结果中匹配关键词高亮显示
- **匹配类型标识**：区分标题匹配、标签匹配、内容匹配
- **搜索历史**：保存最近搜索记录，方便快速重复搜索

### 新增文件

- `src/components/AdvancedSearch.tsx` - 高级搜索弹窗组件
- `src/lib/search.ts` - 搜索工具库

### 使用方法

```tsx
import { AdvancedSearch } from './components'

function App() {
  const [showSearch, setShowSearch] = useState(false)
  
  // 打开搜索
  const openSearch = () => setShowSearch(true)
  
  // 选择笔记
  const handleSelectNote = (note) => {
    setShowSearch(false)
    openNote(note)
  }
  
  return (
    <>
      {/* 搜索按钮 */}
      <button onClick={openSearch}>搜索</button>
      
      {/* 搜索弹窗 */}
      <AdvancedSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectNote={handleSelectNote}
      />
    </>
  )
}
```

### 快捷键

- `Ctrl/Cmd + F` - 打开搜索
- `↑/↓` - 导航搜索结果
- `Enter` - 选择当前结果
- `Tab` - 快速插入建议词
- `Esc` - 关闭搜索

---

## 2. 历史版本

### 功能特性

- **版本快照**：每次保存时自动创建版本快照
- **最多20个版本**：超过后自动删除最旧版本
- **版本预览**：可预览任意历史版本内容
- **版本比较**：选择两个版本进行对比，查看差异
- **版本恢复**：一键恢复到任意历史版本

### 新增文件

- `src/components/VersionHistoryPanel.tsx` - 增强版版本历史面板
- `src/lib/versions.ts` - 版本历史工具库

### 使用方法

```tsx
import { VersionHistoryPanel } from './components'

function NoteEditor({ note }) {
  const [showHistory, setShowHistory] = useState(false)
  
  return (
    <>
      {/* 版本历史按钮 */}
      <button onClick={() => setShowHistory(true)}>
        📜 版本历史
      </button>
      
      {/* 版本历史面板 */}
      <VersionHistoryPanel
        noteId={note?.id}
        noteTitle={note?.title}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onRestore={(restoredNote) => {
          // 更新编辑器内容
          setTitle(restoredNote.title)
          setContent(restoredNote.content)
          setTags(restoredNote.tags)
        }}
      />
    </>
  )
}
```

### 版本比较模式

1. 点击「版本比较」按钮进入比较模式
2. 选择两个要比较的版本（最多2个）
3. 系统自动计算差异并高亮显示

---

## 3. 笔记关联（双向链接）

### 功能特性

- **双向链接语法**：使用 `[[笔记标题]]` 创建链接
- **链接建议**：输入 `[[` 时自动弹出笔记建议
- **关联笔记展示**：笔记底部显示被哪些笔记引用
- **快速跳转**：点击链接或反向链接跳转到目标笔记
- **链接验证**：自动检测无效链接（指向不存在的笔记）

### 新增文件

- `src/components/LinkSuggestion.tsx` - 链接建议组件
- `src/components/BacklinksPanel.tsx` - 增强版反向链接面板
- `src/lib/links.ts` - 链接工具库

### 使用方法

#### 1. 在编辑器中使用链接

```tsx
import { LinkSuggestion } from './components'

function NoteEditor() {
  const [showLinkSuggestions, setShowLinkSuggestions] = useState(false)
  const [linkQuery, setLinkQuery] = useState('')
  const [linkPosition, setLinkPosition] = useState({ top: 0, left: 0 })
  
  // 检测 [[ 输入
  const handleContentChange = (e) => {
    const content = e.target.value
    const cursorPos = e.target.selectionStart
    
    // 检查是否输入了 [[
    const beforeCursor = content.substring(0, cursorPos)
    const lastLinkStart = beforeCursor.lastIndexOf('[[')
    const lastLinkEnd = beforeCursor.lastIndexOf(']]')
    
    if (lastLinkStart > lastLinkEnd) {
      // 正在输入链接
      const query = beforeCursor.substring(lastLinkStart + 2)
      setLinkQuery(query)
      setLinkPosition({ top: cursorPos, left: lastLinkStart })
      setShowLinkSuggestions(true)
    } else {
      setShowLinkSuggestions(false)
    }
  }
  
  // 选择建议的笔记
  const handleSelectLink = (title) => {
    // 在内容中插入 [[title]]
    insertLink(title)
    setShowLinkSuggestions(false)
  }
  
  return (
    <>
      <textarea onChange={handleContentChange} />
      
      <LinkSuggestion
        isOpen={showLinkSuggestions}
        position={linkPosition}
        query={linkQuery}
        notes={allNotes}
        onSelect={handleSelectLink}
        onClose={() => setShowLinkSuggestions(false)}
      />
    </>
  )
}
```

#### 2. 显示反向链接

```tsx
import { BacklinksPanel } from './components'

function NoteEditor({ note }) {
  const [showBacklinks, setShowBacklinks] = useState(false)
  
  return (
    <>
      {/* 查看反向链接按钮 */}
      <button onClick={() => setShowBacklinks(true)}>
        🔗 查看引用 ({backlinks.length})
      </button>
      
      <BacklinksPanel
        noteId={note?.id}
        noteTitle={note?.title}
        onClose={() => setShowBacklinks(false)}
        onNavigate={(sourceNote) => {
          // 跳转到引用当前笔记的笔记
          openNote(sourceNote)
        }}
      />
    </>
  )
}
```

### 链接语法示例

```
# 我的笔记

这是一段普通的笔记内容。

## 引用其他笔记

参考 [[项目需求文档]] 获取更多信息。
也可以参考 [[会议纪要 - 2024-01-15]]。

## 链接到不存在的笔记

如果笔记不存在，链接会以不同颜色显示。
[[待创建的笔记]]
```

---

## 数据库结构

### 新增字段（已有）

```typescript
// NoteVersion - 版本历史
interface NoteVersion {
  id: string
  noteId: string
  title: string
  content: string
  tags: string[]
  createdAt: number
}

// NoteLink - 双向链接
interface NoteLink {
  id: string
  sourceId: string  // 来源笔记 ID
  targetTitle: string  // 目标笔记标题
  targetId?: string  // 目标笔记 ID（如果存在）
}
```

### IndexedDB 仓库

- `notes` - 笔记数据
- `versions` - 版本历史
- `links` - 双向链接关系

---

## 工具函数

### 搜索工具 (`src/lib/search.ts`)

```typescript
import { 
  searchNotes, 
  highlightKeywords, 
  generateSuggestions,
  getSearchHistory,
  addToSearchHistory 
} from './lib/search'

// 执行搜索
const results = searchNotes(notes, '关键词')

// 高亮关键词
const html = highlightKeywords(text, query)

// 生成建议
const suggestions = generateSuggestions(notes, query)
```

### 链接工具 (`src/lib/links.ts`)

```typescript
import { 
  extractLinks, 
  generateLinkSuggestions, 
  parseContentWithLinks,
  autocompleteLink 
} from './lib/links'

// 提取内容中的链接
const links = extractLinks(content)

// 生成链接建议
const suggestions = generateLinkSuggestions(notes, query)

// 解析内容中的链接
const parts = parseContentWithLinks(content, notes)

// 链接自动补全
const result = autocompleteLink(content, cursorPos, notes)
```

### 版本工具 (`src/lib/versions.ts`)

```typescript
import { 
  computeDiff, 
  getVersionSummary, 
  hasSignificantChanges,
  cleanupOldVersions 
} from './lib/versions'

// 计算版本差异
const diff = computeDiff(versionA, versionB)

// 获取版本摘要
const summary = getVersionSummary(versions)

// 检查是否有实质性变化
const hasChanges = hasSignificantChanges(oldContent, newContent)

// 清理旧版本
const kept = cleanupOldVersions(versions, 20)
```

---

## Hooks

### useAdvancedSearch

```typescript
import { useAdvancedSearch } from './hooks'

function SearchPage() {
  const { results, loading, search, clearResults } = useAdvancedSearch()
  
  const handleSearch = () => {
    search('关键词', { tags: ['React'], favoritesOnly: true })
  }
  
  return (
    <>
      {results.map(note => (
        <NoteCard key={note.id} note={note} />
      ))}
    </>
  )
}
```

### useLinkSuggestions

```typescript
import { useLinkSuggestions } from './hooks'

function Editor() {
  const { suggestions, isOpen, updateSuggestions, close } = useLinkSuggestions()
  
  // ...
}
```

### useVersionCompare

```typescript
import { useVersionCompare } from './hooks'

function VersionHistory({ noteId }) {
  const { versions, selectedVersions, toggleSelection, compareSelected } = useVersionCompare(noteId)
  
  const diff = compareSelected()
  // diff?.older - 较旧版本
  // diff?.newer - 较新版本
}
```

---

## 集成到现有代码

### 在 App.tsx 中集成

```tsx
import { 
  AdvancedSearch,
  VersionHistoryPanel,
  BacklinksPanel 
} from './components'

function App() {
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  
  // 快捷键打开搜索
  useKeyboardShortcuts({
    onSearch: () => setShowAdvancedSearch(true),
    // ...
  })
  
  return (
    <div>
      {/* 搜索弹窗 */}
      <AdvancedSearch
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSelectNote={handleOpenNote}
      />
      
      {/* 编辑器中使用 */}
      <NoteEditor
        note={currentNote}
        onShowVersionHistory={() => setShowVersionHistory(true)}
        onShowBacklinks={() => setShowBacklinks(true)}
        // ...
      />
      
      {/* 版本历史面板 */}
      <VersionHistoryPanel
        noteId={currentNote?.id}
        noteTitle={currentNote?.title}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onRestore={handleVersionRestore}
      />
      
      {/* 反向链接面板 */}
      <BacklinksPanel
        noteId={currentNote?.id}
        noteTitle={currentNote?.title}
        isOpen={showBacklinks}
        onClose={() => setShowBacklinks(false)}
        onNavigate={handleOpenNote}
      />
    </div>
  )
}
```

---

## 技术实现细节

### 搜索算法

1. **优先级排序**：标题匹配 > 标签匹配 > 内容匹配
2. **分数计算**：考虑匹配位置、匹配次数、精确程度
3. **防抖处理**：150ms 防抖避免频繁搜索
4. **结果限制**：最多返回 20 条结果

### 版本管理

1. **自动快照**：保存笔记时检测内容变化，变化超过阈值才创建版本
2. **智能清理**：采用指数衰减策略保留版本，优先保留近期版本
3. **差异计算**：使用 Levenshtein 距离算法计算内容差异

### 双向链接

1. **语法解析**：正则表达式 `\[\[([^\]]+)\]\]` 提取链接
2. **关系维护**：保存时更新 links 表，删除笔记时清理关联
3. **实时验证**：检测链接指向的笔记是否存在

---

## 未来扩展

- [x] 版本内容搜索
- [x] 版本标签/分类
- [x] 版本评论/备注
- [x] 链接图谱可视化
- [x] 笔记模板中的链接

---

# 6. 关系图谱可视化

## 功能特性

- **力导向布局**：使用物理模拟算法自动布局节点，关联紧密的笔记自动聚集
- **交互式图谱**：
  - 点击节点跳转到对应笔记
  - 拖拽节点自由调整位置
  - 滚轮缩放图谱
  - 拖拽空白区域平移视图
- **高亮显示**：
  - 紫色节点表示当前查看的笔记
  - 蓝色节点表示与当前笔记关联的笔记
  - 青色节点表示有链接的笔记
  - 灰色节点表示无链接的孤立笔记
- **性能优化**：支持 100+ 节点的流畅渲染

### 新增文件

- `src/components/GraphView.tsx` - 关系图谱可视化组件

### 使用方法

#### 在侧边栏打开图谱

图谱入口已集成到侧边栏的导航菜单中，位于「生成周报」和「梦境循环」之间。

#### 在代码中使用

```tsx
import { GraphView } from './components'

function App() {
  const [showGraph, setShowGraph] = useState(false)

  return (
    <>
      {/* 侧边栏中已自动添加图谱入口按钮 */}

      {/* 也可通过其他方式打开 */}
      <button onClick={() => setShowGraph(true)}>
        打开关系图谱
      </button>

      {/* 关系图谱弹窗 */}
      <GraphView
        notes={notes}
        currentNoteId={currentNote?.id}
        isOpen={showGraph}
        onClose={() => setShowGraph(false)}
        onNavigate={(noteId) => {
          const note = notes.find(n => n.id === noteId)
          if (note) {
            openNote(note)
            setShowGraph(false)
          }
        }}
      />
    </>
  )
}
```

### 组件 Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `notes` | `Note[]` | ✅ | 所有笔记数据 |
| `currentNoteId` | `string \| null` | - | 当前选中的笔记 ID，用于高亮 |
| `isOpen` | `boolean` | ✅ | 是否显示图谱 |
| `onClose` | `() => void` | ✅ | 关闭图谱的回调 |
| `onNavigate` | `(noteId: string) => void` | ✅ | 点击节点时的跳转回调 |

### 交互说明

| 操作 | 效果 |
|------|------|
| 点击节点 | 跳转到对应笔记 |
| 拖拽节点 | 调整节点位置 |
| 拖拽空白区域 | 平移整个图谱 |
| 滚轮 | 缩放图谱 |
| 鼠标悬停 | 显示节点标题 |
| 点击放大/缩小按钮 | 调整缩放比例 |
| 点击重置视图 | 恢复默认缩放和位置 |

### 技术实现

1. **布局算法**：力导向布局（Force-Directed Layout）
   - 节点间存在排斥力，防止重叠
   - 有链接的节点间存在吸引力，保持关联
   - 向心力将节点聚集在中心区域

2. **渲染方式**：SVG 矢量渲染
   - 支持任意缩放不失真
   - 轻量高效，支持大量节点

3. **动画系统**：requestAnimationFrame 驱动的持续动画
   - 节点位置平滑过渡
   - 拖拽时暂停自动布局

---

---

# 5. 激活码系统

## 功能特性

- **离线验证**：激活码验证优先本地，无需联网
- **多种套餐**：月度会员（9.9元/月）、年度会员（99元/年，限时49元）、终身会员（199元）
- **功能锁定**：AI 功能需要激活后才能使用，免费功能始终可用
- **状态显示**：侧边栏显示激活状态和剩余天数
- **设备绑定**：基于设备标识的激活码管理

### 受保护的功能

以下 AI 功能需要激活才能使用：

| 功能 | 说明 |
|------|------|
| 情绪清洗 | 一键将情绪化表达转为专业表述 |
| 智能标签 | AI 自动推荐相关标签 |
| 一键周报 | 从笔记自动生成工作周报 |
| 夜间整理 | 梦境循环，AI 整理今日要点 |
| AI 提炼 | 编译真相架构的核心结论生成 |

### 免费功能

基础功能完全免费，无需激活：

- 笔记创建、编辑、删除
- Markdown 语法支持
- 双向链接（`[[笔记标题]]`）
- 版本历史
- 全文搜索
- 数据导出（Markdown/HTML/PDF）

## 新增文件

- `src/lib/license.ts` - 激活码管理逻辑库
- `src/components/ActivationModal.tsx` - 激活码输入弹窗组件
- `src/components/LicenseStatus.tsx` - 激活状态显示组件

## 数据结构

### 激活码格式

```
XXXX-XXXX-XXXX-XXXX（16位，大写字母或数字）
```

### 存储内容

```typescript
interface LicenseInfo {
  code: string           // 激活码
  type: LicenseType      // 许可证类型: 'monthly' | 'yearly' | 'lifetime'
  activatedAt: number    // 激活时间（时间戳）
  expiresAt: number      // 过期时间（时间戳，永久会员为 -1）
  deviceId: string       // 设备标识
}

interface LicenseStatus {
  isActivated: boolean          // 是否已激活
  type: LicenseType | null      // 许可证类型
  activatedAt: number | null   // 激活时间
  expiresAt: number | null     // 过期时间
  daysRemaining: number | null  // 剩余天数（永久会员为 Infinity）
  isExpired: boolean             // 是否过期
}
```

## 使用方法

### 1. 导入组件

```tsx
import { ActivationModal, LicenseStatus } from './components'
import { getLicenseStatus } from './lib/license'
```

### 2. 在 App.tsx 中集成激活弹窗

```tsx
function App() {
  const [showActivation, setShowActivation] = useState(false)
  const [isLicenseActive, setIsLicenseActive] = useState(false)

  // 检查激活状态
  const checkLicense = async () => {
    const status = await getLicenseStatus()
    setIsLicenseActive(status.isActivated)
  }

  useEffect(() => {
    checkLicense()
  }, [])

  // 需要激活的功能入口
  const handleOpenPremiumFeature = () => {
    if (!isLicenseActive) {
      setShowActivation(true)
      return
    }
    // 执行功能逻辑
  }

  return (
    <div>
      {/* 侧边栏激活按钮 */}
      <Sidebar
        onActivate={() => setShowActivation(true)}
        // ...
      />

      {/* 激活码弹窗 */}
      <ActivationModal
        isOpen={showActivation}
        onClose={() => setShowActivation(false)}
        onSuccess={() => {
          setShowActivation(false)
          checkLicense()
        }}
      />
    </div>
  )
}
```

### 3. 在编辑器中添加权限检查

```tsx
<NoteEditor
  note={currentNote}
  onSave={handleSave}
  onActivate={() => setShowActivation(true)}
  // ...
/>
```

### 4. 使用状态检查 Hook

```tsx
import { useLicenseCheck, FeatureLocked } from './components'

function PremiumFeature() {
  const { isActivated } = useLicenseCheck()

  if (!isActivated) {
    return (
      <FeatureLocked
        featureName="情绪清洗"
        onActivateClick={() => setShowActivation(true)}
      />
    )
  }

  return <AIFeaturePanel />
}
```

## 激活码验证流程

1. **格式检查**：验证是否为 `XXXX-XXXX-XXXX-XXXX` 格式
2. **类型解析**：从激活码中解析许可证类型（月度/年度/终身）
3. **校验位验证**：验证激活码校验位是否正确
4. **存储激活**：将激活信息存储到 IndexedDB
5. **状态更新**：更新内存中的激活状态

## 价格配置

```typescript
export const LICENSE_PRICES = {
  monthly: { price: 9.9, period: '月' },
  yearly: { price: 99, discounted: 49, discountNote: '首年限时' },
  lifetime: { price: 199, period: '终身' },
}
```

## 数据库

新增 IndexedDB 仓库：`compiler-license-db`

- `license` - 存储激活码信息
- [ ] 搜索结果分页
