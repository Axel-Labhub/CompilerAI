/**
 * BaseModal 组件
 * 统一弹窗基组件
 * - 统一的弹窗背景样式
 * - 统一的动画效果
 * - 统一的关闭逻辑
 * - 统一的 Header 样式
 */

import React, { ReactNode } from 'react'
import { useModal, UseModalReturn } from '../hooks/useModal'

export interface BaseModalProps {
  /** 是否显示 */
  isOpen: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 标题 */
  title: string
  /** 副标题/描述 */
  description?: string
  /** 头部图标 */
  icon?: ReactNode
  /** 头部图标背景色 */
  iconBgClass?: string
  /** 头部图标颜色类 */
  iconColorClass?: string
  /** 内容区域 */
  children: ReactNode
  /** 最大宽度 */
  maxWidth?: string
  /** 高度限制 */
  maxHeight?: string
  /** 自定义样式 */
  className?: string
  /** 动画时长 */
  animationDuration?: number
  /** 是否启用 ESC 关闭 */
  enableEscClose?: boolean
  /** 是否启用点击外部关闭 */
  enableClickOutside?: boolean
  /** 自定义关闭按钮 */
  customCloseButton?: ReactNode
  /** 底部区域 */
  footer?: ReactNode
  /** 关闭前回调 */
  beforeClose?: () => boolean | void
}

/**
 * 基础弹窗组件
 */
export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  iconBgClass = 'bg-primary-500/20',
  iconColorClass = 'text-primary-400',
  children,
  maxWidth = 'max-w-2xl',
  maxHeight = 'max-h-[90vh]',
  className = '',
  animationDuration = 200,
  enableEscClose = true,
  enableClickOutside = true,
  customCloseButton,
  footer,
  beforeClose,
}) => {
  const modal = useModal({
    onClose,
    animationDuration,
    enableEscClose,
    enableClickOutside,
    beforeClose,
  })

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-${animationDuration} ${
        modal.isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        ref={modal.modalRef as React.RefObject<HTMLDivElement>}
        className={`bg-app-card border border-app-border rounded-xl shadow-2xl w-full ${maxWidth} ${maxHeight} overflow-hidden flex flex-col transition-all duration-${animationDuration} ${
          modal.isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${className}`}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`w-10 h-10 ${iconBgClass} rounded-lg flex items-center justify-center`}>
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-app-text">{title}</h2>
              {description && (
                <p className="text-xs text-app-muted">{description}</p>
              )}
            </div>
          </div>
          {customCloseButton || (
            <button
              onClick={modal.handleClose}
              className="p-2 rounded-lg hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
              aria-label="关闭"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* 底部区域 */}
        {footer && (
          <div className="px-5 py-4 border-t border-app-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * BaseModal 包装组件
 * 用于不需要 isOpen 控制的场景
 */
export interface ModalWrapperProps {
  /** 弹窗内容 */
  children: ReactNode
  /** 自定义 modal hook 返回值 */
  modal: UseModalReturn
  /** 头部配置 */
  header?: {
    title: string
    description?: string
    icon?: ReactNode
    iconBgClass?: string
    iconColorClass?: string
  }
  /** 最大宽度 */
  maxWidth?: string
  /** 高度限制 */
  maxHeight?: string
  /** 自定义样式 */
  className?: string
  /** 动画时长 */
  animationDuration?: number
  /** 底部区域 */
  footer?: ReactNode
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  children,
  modal,
  header,
  maxWidth = 'max-w-2xl',
  maxHeight = 'max-h-[90vh]',
  className = '',
  animationDuration = 200,
  footer,
}) => {
  const { isVisible, isAnimating, modalRef, handleClose } = modal

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-${animationDuration} ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        ref={modalRef as React.RefObject<HTMLDivElement>}
        className={`bg-app-card border border-app-border rounded-xl shadow-2xl w-full ${maxWidth} ${maxHeight} overflow-hidden flex flex-col transition-all duration-${animationDuration} ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${className}`}
      >
        {header && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
            <div className="flex items-center gap-3">
              {header.icon && (
                <div className={`w-10 h-10 ${header.iconBgClass || 'bg-primary-500/20'} rounded-lg flex items-center justify-center`}>
                  {header.icon}
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-app-text">{header.title}</h2>
                {header.description && (
                  <p className="text-xs text-app-muted">{header.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
              aria-label="关闭"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-4 border-t border-app-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default BaseModal
