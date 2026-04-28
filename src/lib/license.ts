/**
 * 激活码管理系统
 * 支持本地离线验证，存储在 IndexedDB
 * 
 * 激活码格式：XXXX-XXXX-XXXX-XXXX（16位）
 * 存储内容：类型、激活时间、有效期、设备标识
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'

// ==================== 类型定义 ====================

export type LicenseType = 'monthly' | 'yearly' | 'lifetime'

export interface LicenseInfo {
  code: string           // 激活码
  type: LicenseType      // 许可证类型
  activatedAt: number   // 激活时间（时间戳）
  expiresAt: number     // 过期时间（时间戳，永久会员为 -1）
  deviceId: string      // 设备标识
}

export interface LicenseStatus {
  isActivated: boolean          // 是否已激活
  type: LicenseType | null      // 许可证类型
  activatedAt: number | null    // 激活时间
  expiresAt: number | null      // 过期时间
  daysRemaining: number | null  // 剩余天数（永久会员为 Infinity）
  isExpired: boolean             // 是否过期
}

// ==================== 常量定义 ====================

const DB_NAME = 'compiler-license-db'
const DB_VERSION = 1
const LICENSE_STORE = 'license'

// 许可证有效期（毫秒）
const MONTH_MS = 30 * 24 * 60 * 60 * 1000  // 30天
const YEAR_MS = 365 * 24 * 60 * 60 * 1000  // 365天

// 价格配置（用于显示）
export const LICENSE_PRICES = {
  monthly: { price: 9.9, period: '月', original: null },
  yearly: { price: 99, period: '年', original: 99, discounted: 49, discountNote: '首年限时' },
  lifetime: { price: 199, period: '终身', original: null },
} as const

// ==================== 数据库操作 ====================

interface LicenseDB extends DBSchema {
  license: {
    key: string
    value: LicenseInfo
  }
}

let dbInstance: IDBPDatabase<LicenseDB> | null = null

/**
 * 初始化许可证数据库
 */
async function initLicenseDB(): Promise<IDBPDatabase<LicenseDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<LicenseDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(LICENSE_STORE)) {
        db.createObjectStore(LICENSE_STORE, { keyPath: 'code' })
      }
    },
  })

  return dbInstance
}

/**
 * 获取设备标识
 * 优先从 localStorage 获取，生成后缓存
 */
export function getDeviceId(): string {
  const STORAGE_KEY = 'compiler_device_id'
  let deviceId = localStorage.getItem(STORAGE_KEY)
  
  if (!deviceId) {
    // 生成设备标识：前缀 + 随机字符串
    deviceId = `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem(STORAGE_KEY, deviceId)
  }
  
  return deviceId
}

// ==================== 激活码验证与解析 ====================

/**
 * 验证激活码格式
 * 格式：XXXX-XXXX-XXXX-XXXX（大写字母或数字）
 */
export function validateLicenseFormat(code: string): boolean {
  // 移除空格和连字符
  const normalized = code.replace(/[\s-]/g, '').toUpperCase()
  
  // 长度检查
  if (normalized.length !== 16) return false
  
  // 格式检查：只允许字母和数字
  if (!/^[A-Z0-9]{16}$/.test(normalized)) return false
  
  return true
}

/**
 * 标准化激活码格式
 * 返回标准格式：XXXX-XXXX-XXXX-XXXX
 */
export function normalizeLicenseCode(code: string): string {
  const normalized = code.replace(/[\s-]/g, '').toUpperCase()
  return normalized.replace(/(.{4})(?=.)/g, '$1-')
}

/**
 * 生成激活码校验位
 * 简单校验：前12位计算校验和
 */
function generateChecksum(partialCode: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 排除易混淆字符
  let sum = 0
  
  for (let i = 0; i < partialCode.length; i++) {
    sum += partialCode.charCodeAt(i) * (i + 1)
  }
  
  return chars[sum % chars.length]
}

/**
 * 从激活码解析许可证类型
 * 规则：激活码第14-15位标识类型
 * 0-9 = 月度, A-Z (排除O) = 年度, 特殊前缀 = 终身
 */
export function parseLicenseType(code: string): LicenseType | null {
  const normalized = code.replace(/[\s-]/g, '').toUpperCase()
  
  // 终身会员前缀：LT-开头
  if (normalized.startsWith('LT')) {
    return 'lifetime'
  }
  
  // 从第13位读取类型标识
  const typeChar = normalized.charAt(13)
  
  // 数字 = 月度会员
  if (/[0-9]/.test(typeChar)) {
    return 'monthly'
  }
  
  // 字母 = 年度会员
  if (/[A-Z]/.test(typeChar) && typeChar !== 'O') {
    return 'yearly'
  }
  
  return null
}

/**
 * 计算许可证有效期
 */
export function calculateExpiresAt(type: LicenseType, activatedAt: number = Date.now()): number {
  switch (type) {
    case 'monthly':
      return activatedAt + MONTH_MS
    case 'yearly':
      return activatedAt + YEAR_MS
    case 'lifetime':
      return -1 // 永久有效
    default:
      return -1
  }
}

/**
 * 验证激活码是否有效
 * 支持本地离线验证
 */
export async function validateLicenseCode(code: string): Promise<{
  isValid: boolean
  type: LicenseType | null
  error?: string
}> {
  // 格式验证
  if (!validateLicenseFormat(code)) {
    return { isValid: false, type: null, error: '激活码格式不正确' }
  }
  
  // 解析类型
  const type = parseLicenseType(code)
  if (!type) {
    return { isValid: false, type: null, error: '无效的激活码类型' }
  }
  
  // 校验位验证
  const normalized = code.replace(/[\s-]/g, '').toUpperCase()
  const expectedChecksum = generateChecksum(normalized.substring(0, 12))
  const actualChecksum = normalized.charAt(12)
  
  if (expectedChecksum !== actualChecksum) {
    return { isValid: false, type: null, error: '激活码校验失败' }
  }
  
  return { isValid: true, type }
}

// ==================== 许可证存储操作 ====================

/**
 * 激活许可证
 */
export async function activateLicense(code: string): Promise<{
  success: boolean
  license?: LicenseInfo
  error?: string
}> {
  // 验证激活码
  const validation = await validateLicenseCode(code)
  if (!validation.isValid) {
    return { success: false, error: validation.error }
  }
  
  const type = validation.type!
  const normalizedCode = normalizeLicenseCode(code)
  const activatedAt = Date.now()
  
  const licenseInfo: LicenseInfo = {
    code: normalizedCode,
    type,
    activatedAt,
    expiresAt: calculateExpiresAt(type, activatedAt),
    deviceId: getDeviceId(),
  }
  
  try {
    const db = await initLicenseDB()
    
    // 检查是否已存在相同设备的不同激活码
    const tx = db.transaction(LICENSE_STORE, 'readwrite')
    const store = tx.objectStore(LICENSE_STORE)
    
    // 获取所有激活码
    const allLicenses = await store.getAll()
    
    // 检查设备是否已有激活码
    const existingLicense = allLicenses.find(l => l.deviceId === licenseInfo.deviceId)
    
    if (existingLicense) {
      // 更新现有激活码
      await store.put({
        ...licenseInfo,
        code: existingLicense.code, // 保留原激活码
      })
    } else {
      // 新增激活码
      await store.put(licenseInfo)
    }
    
    await tx.done
    
    return { success: true, license: licenseInfo }
  } catch (err) {
    console.error('激活失败:', err)
    return { success: false, error: '激活失败，请重试' }
  }
}

/**
 * 获取当前许可证状态
 */
export async function getLicenseStatus(): Promise<LicenseStatus> {
  try {
    const db = await initLicenseDB()
    const allLicenses = await db.getAll(LICENSE_STORE)
    
    // 查找当前设备的激活码
    const deviceId = getDeviceId()
    const license = allLicenses.find(l => l.deviceId === deviceId)
    
    if (!license) {
      return {
        isActivated: false,
        type: null,
        activatedAt: null,
        expiresAt: null,
        daysRemaining: null,
        isExpired: false,
      }
    }
    
    // 检查是否过期
    const now = Date.now()
    const isExpired = license.expiresAt !== -1 && license.expiresAt < now
    
    // 计算剩余天数
    let daysRemaining: number | null = null
    if (!isExpired) {
      if (license.expiresAt === -1) {
        daysRemaining = Infinity // 永久会员
      } else {
        daysRemaining = Math.ceil((license.expiresAt - now) / (24 * 60 * 60 * 1000))
      }
    }
    
    return {
      isActivated: !isExpired,
      type: license.type,
      activatedAt: license.activatedAt,
      expiresAt: license.expiresAt,
      daysRemaining,
      isExpired,
    }
  } catch (err) {
    console.error('获取许可证状态失败:', err)
    return {
      isActivated: false,
      type: null,
      activatedAt: null,
      expiresAt: null,
      daysRemaining: null,
      isExpired: false,
    }
  }
}

/**
 * 清除激活码
 */
export async function clearLicense(): Promise<boolean> {
  try {
    const db = await initLicenseDB()
    const deviceId = getDeviceId()
    
    const allLicenses = await db.getAll(LICENSE_STORE)
    const license = allLicenses.find(l => l.deviceId === deviceId)
    
    if (license) {
      await db.delete(LICENSE_STORE, license.code)
    }
    
    return true
  } catch (err) {
    console.error('清除激活码失败:', err)
    return false
  }
}

// ==================== 权限检查 ====================

/**
 * 需要付费的功能列表
 */
export const PREMIUM_FEATURES = {
  // AI 功能
  aiClean: '情绪清洗',
  aiTags: '智能标签',
  weeklyReport: '一键周报',
  dreamCycle: '夜间整理（梦境循环）',
  aiRefine: 'AI提炼',
} as const

export type PremiumFeature = keyof typeof PREMIUM_FEATURES

/**
 * 检查功能是否可用
 */
export async function isFeatureAvailable(feature: PremiumFeature): Promise<boolean> {
  const status = await getLicenseStatus()
  return status.isActivated
}

/**
 * 批量检查功能可用性
 */
export async function checkFeaturesAvailable(features: PremiumFeature[]): Promise<Record<PremiumFeature, boolean>> {
  const status = await getLicenseStatus()
  const isAvailable = status.isActivated
  
  return features.reduce((acc, feature) => {
    acc[feature] = isAvailable
    return acc
  }, {} as Record<PremiumFeature, boolean>)
}

/**
 * 获取许可证类型的中文名称
 */
export function getLicenseTypeName(type: LicenseType): string {
  switch (type) {
    case 'monthly':
      return '月度会员'
    case 'yearly':
      return '年度会员'
    case 'lifetime':
      return '终身会员'
    default:
      return '未知'
  }
}

/**
 * 格式化剩余时间
 */
export function formatDaysRemaining(days: number | null): string {
  if (days === null) return ''
  if (days === Infinity) return '永久有效'
  if (days < 0) return '已过期'
  if (days === 0) return '今日到期'
  if (days === 1) return '剩余 1 天'
  return `剩余 ${days} 天`
}

// ==================== 激活码生成（供测试/管理员使用）====================

/**
 * 生成测试用激活码
 * 格式：前缀-类型标识-校验位-随机位
 */
export function generateTestLicense(type: LicenseType): string {
  const prefix = type === 'lifetime' ? 'LT' : 'CB' // CB = Compiler
  const typeCode = type === 'monthly' ? 'M' : type === 'yearly' ? 'Y' : 'L'
  
  // 生成12位随机字符
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let randomPart = ''
  for (let i = 0; i < 12; i++) {
    randomPart += chars[Math.floor(Math.random() * chars.length)]
  }
  
  const partialCode = prefix + randomPart.substring(0, 10) + typeCode + randomPart.substring(11)
  const checksum = generateChecksum(partialCode)
  const last3 = randomPart.substring(10) + chars[Math.floor(Math.random() * chars.length)]
  
  return normalizeLicenseCode(partialCode + checksum + last3)
}

// 示例激活码（用于测试）
export const DEMO_LICENSES = {
  monthly: 'CBAA-BBCC-DDEE-FF11', // 示例月度
  yearly: 'CB12-3456-789A-BCDE',  // 示例年度
  lifetime: 'LT01-2345-6789-0XYZ', // 示例终身
}
