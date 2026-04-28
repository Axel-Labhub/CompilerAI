/**
 * TagInput 组件
 * 增强的标签输入组件，支持颜色、确认删除、自动补全
 */

import React, { useState, useRef, useEffect } from 'react'
import { ALL_TAGS, getTagColor } from '../types'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
}

export const TagInput: React.FC<TagInputProps> = ({ tags, onChange, disabled }) => {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 过滤建议
  const suggestions = ALL_TAGS.filter(tag => 
    !tags.includes(tag) && 
    tag.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 6)

  // 点击外部关闭建议列表
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 添加标签
  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInputValue('')
    setShowSuggestions(false)
  }

  // 移除标签
  const removeTag = (tag: string) => {
    // 如果正在确认删除，直接删除
    if (deleteConfirm === tag) {
      onChange(tags.filter(t => t !== tag))
      setDeleteConfirm(null)
    } else {
      // 显示确认
      setDeleteConfirm(tag)
      setTimeout(() => setDeleteConfirm(null), 2000)
    }
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0) {
        addTag(suggestions[0])
      } else if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* 标签显示区 */}
      <div className="flex items-center gap-2 flex-wrap">
        {tags.map(tag => {
          const colors = getTagColor(tag)
          return (
            <span
              key={tag}
              onClick={() => !disabled && removeTag(tag)}
              className={`${colors.bg} ${colors.text} inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity`}
              title={deleteConfirm === tag ? '再次点击删除' : '点击删除'}
            >
              {tag}
              {deleteConfirm === tag ? (
                <span className="text-red-300 font-bold">×</span>
              ) : (
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </span>
          )
        })}

        {/* 输入框 */}
        {!disabled && (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 ? '添加标签...' : ''}
              className="bg-transparent border-none text-sm text-app-text placeholder-app-muted focus:outline-none w-24"
              list="tag-suggestions-list"
            />
            <datalist id="tag-suggestions-list">
              {ALL_TAGS.filter(t => !tags.includes(t)).map(t => (
                <option key={t} value={t} />
              ))}
            </datalist>

            {/* 建议下拉列表 */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-app-card border border-app-border rounded-lg shadow-lg py-1 z-50">
                {suggestions.map(tag => {
                  const colors = getTagColor(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className="w-full px-3 py-1.5 text-sm text-left flex items-center gap-2 hover:bg-app-border transition-colors"
                    >
                      <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
                      <span className={colors.text}>{tag}</span>
                    </button>
                  )
                })}
                {inputValue.trim() && !ALL_TAGS.includes(inputValue.trim()) && (
                  <>
                    <div className="border-t border-app-border my-1" />
                    <button
                      onClick={() => addTag(inputValue)}
                      className="w-full px-3 py-1.5 text-sm text-left text-primary-400 hover:bg-app-border flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      创建 "{inputValue}"
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TagInput
