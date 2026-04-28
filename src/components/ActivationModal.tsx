/**
 * ActivationModal 组件
 * 激活码输入弹窗
 */

import React, { useState, useEffect } from 'react'
import { 
  activateLicense, 
  validateLicenseFormat, 
  normalizeLicenseCode,
  LICENSE_PRICES,
  getLicenseTypeName,
  type LicenseType,
} from '../lib/license'

interface ActivationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = 'input' | 'success' | 'error'

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('input')
  const [code, setCode] = useState('')
  const [formattedCode, setFormattedCode] = useState('')
  const [isActivating, setIsActivating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedType, setSelectedType] = useState<LicenseType | null>(null)

  // 监听打开状态
  useEffect(() => {
    if (isOpen) {
      setStep('input')
      setCode('')
      setFormattedCode('')
      setErrorMessage('')
      setSelectedType(null)
    }
  }, [isOpen])

  // 格式化激活码输入
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setCode(value)
    
    // 自动添加连字符
    const formatted = normalizeLicenseCode(value)
    setFormattedCode(formatted)
    
    // 清除错误
    if (errorMessage) setErrorMessage('')
  }

  // 粘贴处理
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '')
    setCode(pasted)
    setFormattedCode(normalizeLicenseCode(pasted))
  }

  // 激活处理
  const handleActivate = async () => {
    if (!code.trim()) {
      setErrorMessage('请输入激活码')
      return
    }

    if (!validateLicenseFormat(code)) {
      setErrorMessage('激活码格式不正确')
      return
    }

    setIsActivating(true)
    setErrorMessage('')

    try {
      const result = await activateLicense(code)
      
      if (result.success) {
        setSelectedType(result.license?.type || null)
        setStep('success')
        // 延迟关闭，让用户看到成功提示
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setStep('error')
        setErrorMessage(result.error || '激活失败')
      }
    } catch (err) {
      setStep('error')
      setErrorMessage('激活过程出错，请重试')
    } finally {
      setIsActivating(false)
    }
  }

  // 重新输入
  const handleRetry = () => {
    setStep('input')
    setCode('')
    setFormattedCode('')
    setErrorMessage('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-app-card border border-app-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* 头部 */}
        <div className="relative p-6 pb-4">
          {step === 'success' ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-app-text mb-2">激活成功！</h2>
              <p className="text-app-muted">
                欢迎成为{selectedType ? getLicenseTypeName(selectedType) : '会员'}
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-primary-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-app-text mb-1">激活专业版</h2>
                <p className="text-sm text-app-muted">解锁所有 AI 功能，开启高效工作</p>
              </div>
            </>
          )}
        </div>

        {/* 内容 */}
        <div className="px-6 pb-6">
          {step === 'input' && (
            <>
              {/* 价格套餐 */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {Object.entries(LICENSE_PRICES).map(([type, info]) => (
                  <button
                    key={type}
                    onClick={() => {}}
                    className={`p-3 rounded-xl border transition-all ${
                      type === 'yearly'
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-app-border hover:border-app-muted'
                    }`}
                  >
                    <div className="text-xs text-app-muted mb-1">{info.period}</div>
                    <div className="text-lg font-bold text-app-text">
                      ¥{'discounted' in info ? info.discounted : info.price}
                    </div>
                    {'discountNote' in info && info.discountNote && (
                      <div className="text-[10px] text-primary-400 mt-0.5">
                        {info.discountNote}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* 激活码输入 */}
              <div className="mb-4">
                <label className="block text-sm text-app-muted mb-2">
                  输入激活码
                </label>
                <input
                  type="text"
                  value={formattedCode}
                  onChange={handleCodeChange}
                  onPaste={handlePaste}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  maxLength={19}
                  className={`w-full px-4 py-3 bg-app-bg border rounded-xl text-center text-lg font-mono tracking-wider text-app-text placeholder-app-muted focus:outline-none transition-colors ${
                    errorMessage
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-app-border focus:border-primary-500'
                  }`}
                />
                {errorMessage && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errorMessage}
                  </p>
                )}
              </div>

              {/* 激活按钮 */}
              <button
                onClick={handleActivate}
                disabled={isActivating || !code.trim()}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-app-border disabled:text-app-muted text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isActivating ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    激活中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    立即激活
                  </>
                )}
              </button>

              {/* 提示 */}
              <p className="mt-4 text-xs text-center text-app-muted">
                激活码可在购买后获取，如有问题请联系客服
              </p>
            </>
          )}

          {step === 'error' && (
            <>
              {/* 错误提示 */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-app-text mb-2">激活失败</h3>
                <p className="text-red-400 text-sm">{errorMessage}</p>
              </div>

              {/* 重试按钮 */}
              <button
                onClick={handleRetry}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
              >
                重新输入
              </button>
            </>
          )}

          {step === 'success' && (
            <div className="text-center">
              <p className="text-app-muted text-sm mb-4">
                所有 AI 功能已解锁，立即体验吧！
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
              >
                开始使用
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivationModal
