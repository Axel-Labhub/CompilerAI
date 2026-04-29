/**
 * useModal Hook
 * 弹窗通用逻辑封装
 * - 入场/退场动画状态管理
 * - ESC 键关闭
 * - 点击外部关闭
 * - 动画完成回调
 */

import { useState, useEffect, useRef, useCallback, RefObject } from 'react'

export interface UseModalOptions {
  /** 关闭回调 */
  onClose: () => void
  /** 动画时长(ms)，默认 200 */
  animationDuration?: number
  /** 是否启用 ESC 关闭，默认 true */
  enableEscClose?: boolean
  /** 是否启用点击外部关闭，默认 true */
  enableClickOutside?: boolean
  /** 关闭前回调，返回 true 可阻止关闭 */
  beforeClose?: () => boolean | void
}

export interface UseModalReturn {
  /** 是否可见（入场动画完成后） */
  isVisible: boolean
  /** 是否正在执行退场动画 */
  isAnimating: boolean
  /** 手动触发出场动画 */
  handleClose: () => void
  /** Modal 容器 ref */
  modalRef: RefObject<HTMLDivElement | null>
  /** 立即关闭，不执行动画 */
  closeImmediate: () => void
}

/**
 * 弹窗状态管理 Hook
 */
export function useModal(options: UseModalOptions): UseModalReturn {
  const {
    onClose,
    animationDuration = 200,
    enableEscClose = true,
    enableClickOutside = true,
    beforeClose,
  } = options

  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // 入场动画
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true)
      setIsAnimating(true)
    })
  }, [])

  // ESC 键关闭
  useEffect(() => {
    if (!enableEscClose) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [enableEscClose])

  // 点击外部关闭
  useEffect(() => {
    if (!enableClickOutside) return

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }

    // 延迟绑定，避免点击打开按钮时触发
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [enableClickOutside])

  // 关闭处理
  const handleClose = useCallback(() => {
    // 执行关闭前回调
    if (beforeClose?.() === true) {
      return
    }

    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, animationDuration)
  }, [onClose, animationDuration, beforeClose])

  // 立即关闭
  const closeImmediate = useCallback(() => {
    onClose()
  }, [onClose])

  return {
    isVisible,
    isAnimating,
    handleClose,
    modalRef,
    closeImmediate,
  }
}

/**
 * useModalPortal Hook
 * 用于渲染 Modal 到 body 的 Portal
 */
export function useModalPortal() {
  const [portalContainer] = useState(() => {
    const container = document.createElement('div')
    container.id = `modal-portal-${Date.now()}`
    return container
  })

  useEffect(() => {
    document.body.appendChild(portalContainer)
    return () => {
      document.body.removeChild(portalContainer)
    }
  }, [portalContainer])

  return portalContainer
}
