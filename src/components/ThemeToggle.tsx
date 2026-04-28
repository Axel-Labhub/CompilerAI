/**
 * ThemeToggle 组件
 * 主题切换开关
 */

import React from 'react'
import type { Theme } from '../types'

interface ThemeToggleProps {
  theme: Theme
  onToggle: () => void
  onSetTheme: (theme: Theme) => void
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onSetTheme }) => {
  const [showMenu, setShowMenu] = React.useState(false)

  const themeIcon = {
    dark: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
    light: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    system: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-lg hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
        title="切换主题"
      >
        {themeIcon[theme]}
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-36 bg-app-card border border-app-border rounded-lg shadow-lg py-1 z-50">
            <button
              onClick={() => { onSetTheme('light'); setShowMenu(false) }}
              className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-app-border transition-colors ${
                theme === 'light' ? 'text-primary-400 bg-primary-500/10' : 'text-app-text'
              }`}
            >
              {themeIcon.light}
              浅色
            </button>
            <button
              onClick={() => { onSetTheme('dark'); setShowMenu(false) }}
              className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-app-border transition-colors ${
                theme === 'dark' ? 'text-primary-400 bg-primary-500/10' : 'text-app-text'
              }`}
            >
              {themeIcon.dark}
              深色
            </button>
            <button
              onClick={() => { onSetTheme('system'); setShowMenu(false) }}
              className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-app-border transition-colors ${
                theme === 'system' ? 'text-primary-400 bg-primary-500/10' : 'text-app-text'
              }`}
            >
              {themeIcon.system}
              跟随系统
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ThemeToggle
