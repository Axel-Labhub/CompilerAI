/**
 * LicenseStatus 组件
 * 显示当前激活状态
 */

import React, { useState, useEffect } from 'react'
import { 
  getLicenseStatus, 
  getLicenseTypeName, 
  formatDaysRemaining,
  type LicenseStatus as LicenseStatusType,
} from '../lib/license'

interface LicenseStatusProps {
  onActivateClick: () => void
  compact?: boolean  // 紧凑模式（用于工具栏）
}

export const LicenseStatus: React.FC<LicenseStatusProps> = ({
  onActivateClick,
  compact = false,
}) => {
  const [status, setStatus] = useState<LicenseStatusType | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载状态
  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    setLoading(true)
    try {
      const result = await getLicenseStatus()
      setStatus(result)
    } catch (err) {
      console.error('加载激活状态失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 刷新状态（供父组件调用）
  const refresh = () => loadStatus()

  // 暴露刷新方法
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__refreshLicenseStatus = refresh
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__refreshLicenseStatus
      }
    }
  }, [])

  // 加载中
  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} text-dark-muted`}>
        <div className="w-4 h-4 border-2 border-dark-border border-t-primary-400 rounded-full animate-spin" />
        <span>检查中...</span>
      </div>
    )
  }

  // 未激活
  if (!status?.isActivated) {
    return (
      <button
        onClick={onActivateClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
          compact
            ? 'text-xs bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
            : 'text-sm bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>解锁 AI 功能</span>
      </button>
    )
  }

  // 已激活 - 紧凑模式
  if (compact) {
    const statusColor = status.isExpired
      ? 'text-red-400'
      : status.type === 'lifetime'
        ? 'text-purple-400'
        : status.daysRemaining !== null && status.daysRemaining < 7
          ? 'text-yellow-400'
          : 'text-green-400'

    return (
      <div className={`flex items-center gap-2 ${statusColor}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs">
          {getLicenseTypeName(status.type!)}
          {status.daysRemaining !== null && status.daysRemaining !== Infinity && (
            <span className="ml-1 opacity-75">
              · {formatDaysRemaining(status.daysRemaining)}
            </span>
          )}
          {status.type === 'lifetime' && (
            <span className="ml-1 opacity-75">· 永久有效</span>
          )}
        </span>
      </div>
    )
  }

  // 已激活 - 完整模式
  return (
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-green-400">
              {getLicenseTypeName(status.type!)}
            </div>
            <div className="text-xs text-dark-muted">
              {status.daysRemaining === Infinity
                ? '永久有效'
                : formatDaysRemaining(status.daysRemaining)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status.type !== 'lifetime' && status.expiresAt && status.expiresAt !== -1 && (
            <div className="text-right mr-2">
              <div className="text-xs text-dark-muted">到期时间</div>
              <div className="text-sm text-dark-text">
                {new Date(status.expiresAt).toLocaleDateString('zh-CN')}
              </div>
            </div>
          )}
          <button
            onClick={onActivateClick}
            className="px-3 py-1.5 text-xs bg-dark-border hover:bg-dark-muted text-dark-text rounded-lg transition-colors"
          >
            续费
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * 激活状态检查钩子
 * 用于在需要的地方检查是否需要显示激活提示
 */
export const useLicenseCheck = () => {
  const [status, setStatus] = useState<LicenseStatusType | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      const result = await getLicenseStatus()
      setStatus(result)
    }
    checkStatus()
  }, [])

  return {
    isActivated: status?.isActivated ?? false,
    isExpired: status?.isExpired ?? false,
    licenseType: status?.type ?? null,
    daysRemaining: status?.daysRemaining ?? null,
  }
}

/**
 * 功能锁定提示组件
 * 当用户尝试使用付费功能但未激活时显示
 */
interface FeatureLockedProps {
  featureName: string
  onActivateClick: () => void
}

export const FeatureLocked: React.FC<FeatureLockedProps> = ({
  featureName,
  onActivateClick,
}) => {
  return (
    <div className="flex items-center gap-3 p-4 bg-dark-card/50 border border-dark-border rounded-xl">
      <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div className="flex-1">
        <div className="text-sm text-dark-text font-medium">{featureName}</div>
        <div className="text-xs text-dark-muted">需要激活才能使用</div>
      </div>
      <button
        onClick={onActivateClick}
        className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded-lg transition-colors"
      >
        激活
      </button>
    </div>
  )
}

export default LicenseStatus
