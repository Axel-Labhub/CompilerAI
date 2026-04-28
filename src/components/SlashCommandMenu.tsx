/**
 * SlashCommandMenu 组件
 * 斜杠命令菜单
 */

import React, { useState, useEffect, useRef } from 'react'
import { SLASH_COMMANDS, SlashCommand } from '../types'

interface SlashCommandMenuProps {
  isOpen: boolean
  position: { top: number; left: number }
  onSelect: (command: SlashCommand, value?: string) => void
  onClose: () => void
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({ isOpen, position, onSelect, onClose }) => {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // 过滤命令
  const filteredCommands = SLASH_COMMANDS.filter(cmd =>
    cmd.name.includes(search) || cmd.description.includes(search)
  )

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            handleSelect(filteredCommands[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  const handleSelect = (command: SlashCommand) => {
    // 如果有模板命令，提示用户选择模板
    if (command.id === 'template') {
      onSelect(command, 'show-templates')
    } else {
      onSelect(command)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-app-card border border-app-border rounded-lg shadow-xl w-64 overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* 搜索框 */}
      <div className="p-2 border-b border-app-border">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setSelectedIndex(0)
          }}
          placeholder="搜索命令..."
          className="w-full px-3 py-1.5 bg-app-bg border border-app-border rounded text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500"
          autoFocus
        />
      </div>

      {/* 命令列表 */}
      <div className="max-h-64 overflow-y-auto py-1">
        {filteredCommands.length === 0 ? (
          <div className="px-3 py-2 text-sm text-app-muted text-center">
            未找到匹配的命令
          </div>
        ) : (
          filteredCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              onClick={() => handleSelect(cmd)}
              className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'hover:bg-app-border/50 text-app-text'
              }`}
            >
              <div className="w-8 h-8 rounded bg-app-bg flex items-center justify-center text-sm font-mono">
                {cmd.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{cmd.name}</div>
                <div className="text-xs text-app-muted truncate">{cmd.description}</div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* 提示 */}
      <div className="px-3 py-2 bg-app-bg/50 border-t border-app-border text-xs text-app-muted">
        <span>↑↓ 选择</span>
        <span className="mx-2">·</span>
        <span>Enter 确认</span>
        <span className="mx-2">·</span>
        <span>Esc 关闭</span>
      </div>
    </div>
  )
}

export default SlashCommandMenu
