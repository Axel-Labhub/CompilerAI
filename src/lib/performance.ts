/**
 * 性能监控工具
 * 用于追踪和优化应用性能
 */

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private startTimes: Map<string, number> = new Map()

  /**
   * 开始计时
   */
  start(label: string) {
    this.startTimes.set(label, performance.now())
  }

  /**
   * 结束计时并记录
   */
  end(label: string) {
    const startTime = this.startTimes.get(label)
    if (!startTime) return

    const duration = performance.now() - startTime
    this.startTimes.delete(label)

    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label)!.push(duration)
  }

  /**
   * 获取平均耗时
   */
  getAverage(label: string): number {
    const values = this.metrics.get(label)
    if (!values || values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  /**
   * 获取最新耗时
   */
  getLatest(label: string): number {
    const values = this.metrics.get(label)
    if (!values || values.length === 0) return 0
    return values[values.length - 1]
  }

  /**
   * 获取所有指标
   */
  getAllMetrics(): Record<string, { avg: number; latest: number; count: number }> {
    const result: Record<string, { avg: number; latest: number; count: number }> = {}
    
    this.metrics.forEach((values, label) => {
      result[label] = {
        avg: this.getAverage(label),
        latest: this.getLatest(label),
        count: values.length
      }
    })

    return result
  }

  /**
   * 清空所有指标
   */
  clear() {
    this.metrics.clear()
    this.startTimes.clear()
  }
}

// 导出单例
export const perfMonitor = new PerformanceMonitor()

/**
 * React 性能追踪 Hook 辅助函数
 */
export function measureRender<P extends object>(
  componentName: string,
  _props?: P
): () => void {
  const startTime = performance.now()
  
  return () => {
    const duration = performance.now() - startTime
    if (duration > 16.67) { // 超过一帧的时间
      console.warn(`[Performance] ${componentName} 渲染耗时 ${duration.toFixed(2)}ms`)
    }
  }
}

/**
 * 数据库操作性能追踪
 */
export async function measureDBOperation<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  
  try {
    const result = await fn()
    const duration = performance.now() - start
    
    if (duration > 100) {
      console.warn(`[DB Performance] ${operation} 耗时 ${duration.toFixed(2)}ms`)
    }
    
    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`[DB Performance] ${operation} 失败 (${duration.toFixed(2)}ms):`, error)
    throw error
  }
}
