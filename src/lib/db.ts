/**
 * IndexedDB 数据库操作模块
 * 使用 idb 库封装，提供笔记的增删改查功能
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Note, NoteVersion, NoteLink } from '../types'

// 数据库配置
const DB_NAME = 'compiler-db'
const DB_VERSION = 2  // 版本升级
const NOTES_STORE = 'notes'
const VERSIONS_STORE = 'versions'  // 新增：版本历史
const LINKS_STORE = 'links'  // 新增：笔记链接

// 数据库 schema 定义
interface CompilerDB extends DBSchema {
  notes: {
    key: string
    value: Note
    indexes: {
      'by-created': number
      'by-updated': number
      'by-title': string
      'by-favorite': number  // 新增：收藏索引
    }
  }
  versions: {
    key: string
    value: NoteVersion
    indexes: {
      'by-note': string
      'by-created': number
    }
  }
  links: {
    key: string
    value: NoteLink
    indexes: {
      'by-source': string
      'by-target': string
    }
  }
}

// 数据库单例
let dbInstance: IDBPDatabase<CompilerDB> | null = null

/**
 * 初始化数据库连接
 * @returns 数据库实例
 */
export async function initDB(): Promise<IDBPDatabase<CompilerDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<CompilerDB>(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion, _newVersion, _transaction) {
      // 创建 notes 对象仓库
      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        const noteStore = db.createObjectStore(NOTES_STORE, { keyPath: 'id' })
        // 创建索引用于排序
        noteStore.createIndex('by-created', 'createdAt')
        noteStore.createIndex('by-updated', 'updatedAt')
        noteStore.createIndex('by-title', 'title')
        noteStore.createIndex('by-favorite', 'isFavorite')
      }
      
      // 创建版本历史仓库
      if (!db.objectStoreNames.contains(VERSIONS_STORE)) {
        const versionStore = db.createObjectStore(VERSIONS_STORE, { keyPath: 'id' })
        versionStore.createIndex('by-note', 'noteId')
        versionStore.createIndex('by-created', 'createdAt')
      }
      
      // 创建链接仓库
      if (!db.objectStoreNames.contains(LINKS_STORE)) {
        const linkStore = db.createObjectStore(LINKS_STORE, { keyPath: 'id' })
        linkStore.createIndex('by-source', 'sourceId')
        linkStore.createIndex('by-target', 'targetId')
      }
    },
  })

  return dbInstance
}

/**
 * 生成唯一 ID
 * @returns UUID 格式的字符串
 */
export function generateId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// ==================== 笔记操作 ====================

/**
 * 创建笔记
 * @param note 笔记数据（不包含 id, createdAt, updatedAt）
 * @returns 创建后的完整笔记
 */
export async function createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
  const db = await initDB()
  const now = Date.now()
  
  const newNote: Note = {
    ...note,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  await db.put(NOTES_STORE, newNote)
  return newNote
}

/**
 * 获取所有笔记（按更新时间倒序，置顶优先）
 * @returns 笔记列表
 */
export async function getAllNotes(): Promise<Note[]> {
  const db = await initDB()
  const notes = await db.getAllFromIndex(NOTES_STORE, 'by-updated')
  // 置顶笔记优先，然后按更新时间倒序
  return notes.reverse().sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return b.updatedAt - a.updatedAt
  })
}

/**
 * 获取收藏的笔记
 * @returns 收藏笔记列表
 */
export async function getFavoriteNotes(): Promise<Note[]> {
  const db = await initDB()
  const notes = await db.getAll(NOTES_STORE)
  return notes.filter(note => note.isFavorite).sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * 获取单个笔记
 * @param id 笔记 ID
 * @returns 笔记数据或 undefined
 */
export async function getNote(id: string): Promise<Note | undefined> {
  const db = await initDB()
  return db.get(NOTES_STORE, id)
}

/**
 * 获取单个笔记（按标题）
 * @param title 笔记标题
 * @returns 笔记数据或 undefined
 */
export async function getNoteByTitle(title: string): Promise<Note | undefined> {
  const db = await initDB()
  const notes = await db.getAllFromIndex(NOTES_STORE, 'by-title', title)
  return notes[0]
}

/**
 * 更新笔记
 * @param id 笔记 ID
 * @param updates 更新字段
 * @returns 更新后的笔记
 */
export async function updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note | undefined> {
  const db = await initDB()
  const note = await db.get(NOTES_STORE, id)
  
  if (!note) return undefined

  // 如果内容有变化，创建版本快照
  if (updates.content !== undefined && updates.content !== note.content) {
    await createVersion(note)
  }

  const updatedNote: Note = {
    ...note,
    ...updates,
    updatedAt: Date.now(),
  }

  await db.put(NOTES_STORE, updatedNote)
  
  // 更新链接关系
  if (updates.content !== undefined) {
    await updateLinks(id, updates.content)
  }
  
  return updatedNote
}

/**
 * 删除笔记
 * @param id 笔记 ID
 */
export async function deleteNote(id: string): Promise<void> {
  const db = await initDB()
  
  // 删除关联的版本
  const versions = await db.getAllFromIndex(VERSIONS_STORE, 'by-note', id)
  const tx = db.transaction([NOTES_STORE, VERSIONS_STORE, LINKS_STORE], 'readwrite')
  await Promise.all([
    tx.objectStore(NOTES_STORE).delete(id),
    ...versions.map(v => tx.objectStore(VERSIONS_STORE).delete(v.id)),
    ...(await db.getAllFromIndex(LINKS_STORE, 'by-source', id)).map(l => tx.objectStore(LINKS_STORE).delete(l.id)),
  ])
  await tx.done
}

/**
 * 搜索笔记（按标题和内容）
 * @param query 搜索关键词
 * @returns 匹配的笔记列表
 */
export async function searchNotes(query: string): Promise<Note[]> {
  const notes = await getAllNotes()
  const lowerQuery = query.toLowerCase()
  
  return notes.filter(note => 
    note.title.toLowerCase().includes(lowerQuery) ||
    note.content.toLowerCase().includes(lowerQuery) ||
    note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * 按标签筛选笔记
 * @param tag 标签名
 * @returns 匹配该标签的笔记
 */
export async function getNotesByTag(tag: string): Promise<Note[]> {
  const notes = await getAllNotes()
  return notes.filter(note => note.tags.includes(tag))
}

/**
 * 切换笔记置顶状态
 * @param id 笔记 ID
 */
export async function togglePinNote(id: string): Promise<Note | undefined> {
  const note = await getNote(id)
  if (!note) return undefined
  return updateNote(id, { isPinned: !note.isPinned })
}

/**
 * 切换笔记收藏状态
 * @param id 笔记 ID
 */
export async function toggleFavoriteNote(id: string): Promise<Note | undefined> {
  const note = await getNote(id)
  if (!note) return undefined
  return updateNote(id, { isFavorite: !note.isFavorite })
}

/**
 * 批量获取笔记
 * @param ids 笔记 ID 数组
 * @returns 笔记列表
 */
export async function getNotesByIds(ids: string[]): Promise<Note[]> {
  const db = await initDB()
  const notes: Note[] = []
  
  for (const id of ids) {
    const note = await db.get(NOTES_STORE, id)
    if (note) notes.push(note)
  }
  
  return notes
}

/**
 * 清空所有笔记（谨慎使用）
 */
export async function clearAllNotes(): Promise<void> {
  const db = await initDB()
  await db.clear(NOTES_STORE)
  await db.clear(VERSIONS_STORE)
  await db.clear(LINKS_STORE)
}

// ==================== 版本历史 ====================

const MAX_VERSIONS = 20  // 最多保留版本数

/**
 * 创建版本快照
 */
async function createVersion(note: Note): Promise<void> {
  const db = await initDB()
  const version: NoteVersion = {
    id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    noteId: note.id,
    title: note.title,
    content: note.content,
    tags: [...note.tags],
    createdAt: Date.now(),
  }
  
  await db.put(VERSIONS_STORE, version)
  
  // 清理旧版本，只保留最近 MAX_VERSIONS 个
  const versions = await db.getAllFromIndex(VERSIONS_STORE, 'by-note', note.id)
  if (versions.length > MAX_VERSIONS) {
    const sortedVersions = versions.sort((a, b) => b.createdAt - a.createdAt)
    const toDelete = sortedVersions.slice(MAX_VERSIONS)
    const tx = db.transaction(VERSIONS_STORE, 'readwrite')
    await Promise.all(toDelete.map(v => tx.store.delete(v.id)))
    await tx.done
  }
}

/**
 * 获取笔记的版本历史
 * @param noteId 笔记 ID
 * @returns 版本列表
 */
export async function getNoteVersions(noteId: string): Promise<NoteVersion[]> {
  const db = await initDB()
  const versions = await db.getAllFromIndex(VERSIONS_STORE, 'by-note', noteId)
  return versions.sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * 恢复到指定版本
 * @param versionId 版本 ID
 * @returns 更新后的笔记
 */
export async function restoreVersion(versionId: string): Promise<Note | undefined> {
  const db = await initDB()
  const version = await db.get(VERSIONS_STORE, versionId)
  if (!version) return undefined
  
  return updateNote(version.noteId, {
    title: version.title,
    content: version.content,
    tags: version.tags,
  })
}

// ==================== 双向链接 ====================

/**
 * 从内容中提取 [[链接]]
 * @param content 笔记内容
 * @returns 链接标题列表
 */
export function extractLinks(content: string): string[] {
  const linkRegex = /\[\[([^\]]+)\]\]/g
  const links: string[] = []
  let match
  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[1])
  }
  return [...new Set(links)]  // 去重
}

/**
 * 更新笔记的链接关系
 * @param noteId 笔记 ID
 * @param content 笔记内容
 */
async function updateLinks(noteId: string, content: string): Promise<void> {
  const db = await initDB()
  
  // 删除旧的链接
  const oldLinks = await db.getAllFromIndex(LINKS_STORE, 'by-source', noteId)
  const tx = db.transaction(LINKS_STORE, 'readwrite')
  await Promise.all(oldLinks.map(l => tx.store.delete(l.id)))
  await tx.done
  
  // 创建新链接
  const linkTitles = extractLinks(content)
  const tx2 = db.transaction(LINKS_STORE, 'readwrite')
  for (const title of linkTitles) {
    const targetNote = await getNoteByTitle(title)
    const link: NoteLink = {
      id: `link_${noteId}_${title}_${Date.now()}`,
      sourceId: noteId,
      targetTitle: title,
      targetId: targetNote?.id,
    }
    await tx2.store.put(link)
  }
  await tx2.done
}

/**
 * 获取引用了指定笔记的所有笔记
 * @param noteId 笔记 ID
 * @returns 引用该笔记的笔记列表
 */
export async function getBacklinks(noteId: string): Promise<Note[]> {
  const db = await initDB()
  const links = await db.getAll(LINKS_STORE)
  const sourceNotes: Note[] = []
  
  for (const link of links) {
    if (link.targetId === noteId) {
      const note = await getNote(link.sourceId)
      if (note) sourceNotes.push(note)
    }
  }
  
  return sourceNotes
}

/**
 * 解析内容中的链接并获取目标笔记
 * @param content 笔记内容
 * @returns 带有效链接的笔记列表
 */
export async function resolveLinks(content: string): Promise<Note[]> {
  const linkTitles = extractLinks(content)
  const notes: Note[] = []
  
  for (const title of linkTitles) {
    const note = await getNoteByTitle(title)
    if (note) notes.push(note)
  }
  
  return notes
}

// ==================== 高级搜索 ====================

export interface AdvancedSearchOptions {
  query?: string
  dateRange?: {
    start: number
    end: number
  }
  tags?: string[]
  favoritesOnly?: boolean
  sortBy?: 'updatedAt' | 'createdAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

/**
 * 高级搜索
 * @param options 搜索选项
 * @returns 匹配的笔记列表
 */
export async function advancedSearch(options: AdvancedSearchOptions): Promise<Note[]> {
  let notes = await getAllNotes()
  
  // 关键词过滤
  if (options.query) {
    const lowerQuery = options.query.toLowerCase()
    notes = notes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }
  
  // 日期范围过滤
  if (options.dateRange) {
    const { start, end } = options.dateRange
    notes = notes.filter(note =>
      note.updatedAt >= start && note.updatedAt <= end
    )
  }
  
  // 标签过滤
  if (options.tags && options.tags.length > 0) {
    notes = notes.filter(note =>
      options.tags!.some(tag => note.tags.includes(tag))
    )
  }
  
  // 收藏过滤
  if (options.favoritesOnly) {
    notes = notes.filter(note => note.isFavorite)
  }
  
  // 排序
  const sortBy = options.sortBy || 'updatedAt'
  const sortOrder = options.sortOrder || 'desc'
  notes.sort((a, b) => {
    let comparison = 0
    if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title)
    } else {
      comparison = a[sortBy] - b[sortBy]
    }
    return sortOrder === 'desc' ? -comparison : comparison
  })
  
  return notes
}
