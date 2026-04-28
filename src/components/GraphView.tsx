/**
 * GraphView 组件
 * 关系图谱可视化 - 以力导向图形式展示笔记之间的链接关系
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { Note } from '../types'
import { extractLinks } from '../lib/links'

// 图谱节点
interface GraphNode {
  id: string
  title: string
  x: number
  y: number
  vx: number  // 速度 x
  vy: number  // 速度 y
  linkCount: number  // 链接数量（影响节点大小）
  isHighlighted: boolean  // 是否高亮
  isConnected: boolean  // 是否与高亮节点相连
}

// 图谱边（连线）
interface GraphEdge {
  source: string  // 源节点 ID
  target: string  // 目标节点 ID
}

// 图谱数据
interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

interface GraphViewProps {
  notes: Note[]
  currentNoteId?: string | null
  onClose: () => void
  onNavigate: (noteId: string) => void
  isOpen: boolean
}

// 从笔记中构建图谱数据
function buildGraphData(notes: Note[], currentNoteId?: string | null): GraphData {
  const titleToId = new Map<string, string>()
  notes.forEach(note => {
    titleToId.set(note.title.toLowerCase(), note.id)
  })

  // 统计每个笔记的链接数量
  const linkCounts = new Map<string, number>()
  notes.forEach(note => {
    const links = extractLinks(note.content)
    linkCounts.set(note.id, links.length)
  })

  // 创建节点
  const nodes: GraphNode[] = notes.map((note, index) => {
    const angle = (2 * Math.PI * index) / notes.length
    const radius = 200
    return {
      id: note.id,
      title: note.title,
      x: Math.cos(angle) * radius + 300 + (Math.random() - 0.5) * 50,
      y: Math.sin(angle) * radius + 300 + (Math.random() - 0.5) * 50,
      vx: 0,
      vy: 0,
      linkCount: linkCounts.get(note.id) || 0,
      isHighlighted: note.id === currentNoteId,
      isConnected: false,
    }
  })

  // 创建边
  const edges: GraphEdge[] = []
  const nodeIds = new Set(nodes.map(n => n.id))
  
  notes.forEach(note => {
    const links = extractLinks(note.content)
    links.forEach(linkTitle => {
      const targetId = titleToId.get(linkTitle.toLowerCase())
      if (targetId && targetId !== note.id && nodeIds.has(targetId)) {
        // 避免重复边
        const exists = edges.some(
          e => (e.source === note.id && e.target === targetId) ||
               (e.source === targetId && e.target === note.id)
        )
        if (!exists) {
          edges.push({ source: note.id, target: targetId })
        }
      }
    })
  })

  // 计算连接状态
  const connectedIds = new Set<string>()
  if (currentNoteId) {
    edges.forEach(edge => {
      if (edge.source === currentNoteId || edge.target === currentNoteId) {
        connectedIds.add(edge.source)
        connectedIds.add(edge.target)
      }
    })
  }

  nodes.forEach(node => {
    if (connectedIds.has(node.id)) {
      node.isConnected = true
    }
  })

  return { nodes, edges }
}

// 力导向布局模拟
function simulateForces(
  nodes: GraphNode[],
  edges: GraphEdge[],
  iterations: number = 100
): GraphNode[] {
  const nodesCopy = nodes.map(n => ({ ...n }))
  const nodeMap = new Map(nodesCopy.map(n => [n.id, n]))
  
  // 迭代模拟
  for (let i = 0; i < iterations; i++) {
    const alpha = 1 - i / iterations  // 退火因子
    
    // 计算排斥力（所有节点互相排斥）
    for (let j = 0; j < nodesCopy.length; j++) {
      for (let k = j + 1; k < nodesCopy.length; k++) {
        const nodeA = nodesCopy[j]
        const nodeB = nodesCopy[k]
        
        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = -500 / (dist * dist)  // 排斥力
        
        const fx = (dx / dist) * force * alpha
        const fy = (dy / dist) * force * alpha
        
        nodeA.vx += fx
        nodeA.vy += fy
        nodeB.vx -= fx
        nodeB.vy -= fy
      }
    }
    
    // 计算吸引力（连接的节点互相吸引）
    edges.forEach(edge => {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      if (!source || !target) return
      
      const dx = target.x - source.x
      const dy = target.y - source.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const force = (dist - 100) * 0.05 * alpha  // 吸引力
      
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      
      source.vx += fx
      source.vy += fy
      target.vx -= fx
      target.vy -= fy
    })
    
    // 向中心引力（防止节点散开太远）
    nodesCopy.forEach(node => {
      const dx = 300 - node.x
      const dy = 300 - node.y
      node.vx += dx * 0.001 * alpha
      node.vy += dy * 0.001 * alpha
    })
    
    // 更新位置
    nodesCopy.forEach(node => {
      node.x += node.vx * 0.1
      node.y += node.vy * 0.1
      node.vx *= 0.9  // 阻尼
      node.vy *= 0.9
      
      // 边界约束
      node.x = Math.max(50, Math.min(550, node.x))
      node.y = Math.max(50, Math.min(550, node.y))
    })
  }
  
  return nodesCopy
}

export const GraphView: React.FC<GraphViewProps> = ({
  notes,
  currentNoteId,
  onClose,
  onNavigate,
  isOpen,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const animationRef = useRef<number | null>(null)

  // 构建和布局图谱
  useEffect(() => {
    if (!isOpen || notes.length === 0) return
    
    const graphData = buildGraphData(notes, currentNoteId)
    const layoutedNodes = simulateForces(graphData.nodes, graphData.edges, 150)
    
    setNodes(layoutedNodes)
    setEdges(graphData.edges)
  }, [notes, currentNoteId, isOpen])

  // 动画循环
  useEffect(() => {
    if (nodes.length === 0 || edges.length === 0) return
    
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    
    const animate = () => {
      setNodes(prevNodes => {
        const nodesCopy = prevNodes.map(n => ({ ...n, vx: 0, vy: 0 }))
        const nodeMapCopy = new Map(nodesCopy.map(n => [n.id, n]))
        
        // 轻微的持续力模拟
        nodesCopy.forEach(node => {
          // 向中心引力
          const dx = 300 - node.x
          const dy = 300 - node.y
          node.vx += dx * 0.002
          node.vy += dy * 0.002
        })
        
        // 边的吸引力
        edges.forEach(edge => {
          const source = nodeMapCopy.get(edge.source)
          const target = nodeMapCopy.get(edge.target)
          if (!source || !target) return
          
          const dx = target.x - source.x
          const dy = target.y - source.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = (dist - 120) * 0.01
          
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          
          source.vx += fx
          source.vy += fy
          target.vx -= fx
          target.vy -= fy
        })
        
        // 节点排斥
        for (let j = 0; j < nodesCopy.length; j++) {
          for (let k = j + 1; k < nodesCopy.length; k++) {
            const nodeA = nodesCopy[j]
            const nodeB = nodesCopy[k]
            
            const dx = nodeB.x - nodeA.x
            const dy = nodeB.y - nodeA.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const force = -100 / (dist * dist)
            
            const fx = (dx / dist) * force
            const fy = (dy / dist) * force
            
            nodeA.vx += fx
            nodeA.vy += fy
            nodeB.vx -= fx
            nodeB.vy -= fy
          }
        }
        
        // 更新位置
        nodesCopy.forEach(node => {
          if (node.id === draggedNode) return  // 拖拽中的节点不更新
          
          node.x += node.vx * 0.5
          node.y += node.vy * 0.5
          node.vx *= 0.8
          node.vy *= 0.8
          
          // 边界
          node.x = Math.max(30, Math.min(570, node.x))
          node.y = Math.max(30, Math.min(570, node.y))
        })
        
        return nodesCopy
      })
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [edges, nodes.length, draggedNode])

  // 鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.max(0.3, Math.min(3, prev * delta)))
  }, [])

  // 鼠标拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId?: string) => {
    if (nodeId) {
      setDraggedNode(nodeId)
    } else {
      setIsDragging(true)
    }
  }, [])

  // 鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedNode && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - translate.x) / scale
      const y = (e.clientY - rect.top - translate.y) / scale
      
      setNodes(prev => prev.map(node => 
        node.id === draggedNode 
          ? { ...node, x, y, vx: 0, vy: 0 }
          : node
      ))
    } else if (isDragging) {
      setTranslate(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }))
    }
  }, [draggedNode, isDragging, scale, translate])

  // 鼠标释放
  const handleMouseUp = useCallback(() => {
    setDraggedNode(null)
    setIsDragging(false)
  }, [])

  // 点击节点
  const handleNodeClick = useCallback((nodeId: string) => {
    onNavigate(nodeId)
  }, [onNavigate])

  // 节点颜色
  const getNodeColor = (node: GraphNode): string => {
    if (node.isHighlighted) return '#8b5cf6'  // 紫色 - 当前笔记
    if (node.isConnected) return '#3b82f6'  // 蓝色 - 关联笔记
    if (node.linkCount > 0) return '#06b6d4'  // 青色 - 有链接
    return '#64748b'  // 灰色 - 无链接
  }

  // 节点大小
  const getNodeRadius = (node: GraphNode): number => {
    const base = 8
    const extra = Math.min(node.linkCount * 2, 12)
    if (node.isHighlighted) return base + extra + 4
    if (node.isConnected) return base + extra + 2
    return base + extra
  }

  // 获取边颜色
  const getEdgeColor = (edge: GraphEdge): string => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)
    
    if (sourceNode?.isHighlighted || targetNode?.isHighlighted) {
      return 'rgba(139, 92, 246, 0.6)'  // 高亮边
    }
    return 'rgba(100, 116, 139, 0.3)'  // 普通边
  }

  if (!isOpen) return null

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === containerRef.current || e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-dark-card rounded-xl shadow-2xl w-[700px] h-[650px] flex flex-col overflow-hidden border border-dark-border">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h2 className="text-lg font-semibold text-dark-text">关系图谱</h2>
            <span className="text-sm text-dark-muted">
              {nodes.length} 个笔记 · {edges.length} 条链接
            </span>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-dark-border/50 rounded-lg transition-colors text-dark-muted hover:text-dark-text"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 图谱区域 */}
        <div 
          className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={(e) => handleMouseDown(e)}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox="0 0 600 600"
            className="select-none"
          >
            <g transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}>
              {/* 边 */}
              <g>
                {edges.map((edge, index) => {
                  const source = nodes.find(n => n.id === edge.source)
                  const target = nodes.find(n => n.id === edge.target)
                  if (!source || !target) return null
                  
                  return (
                    <line
                      key={`edge-${index}`}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={getEdgeColor(edge)}
                      strokeWidth={source.isHighlighted || target.isHighlighted ? 2 : 1}
                    />
                  )
                })}
              </g>
              
              {/* 节点 */}
              <g>
                {nodes.map(node => (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      handleMouseDown(e as unknown as React.MouseEvent, node.id)
                    }}
                    onClick={() => handleNodeClick(node.id)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* 节点光晕 */}
                    {(node.isHighlighted || node.isConnected || hoveredNode === node.id) && (
                      <circle
                        r={getNodeRadius(node) + 8}
                        fill={getNodeColor(node)}
                        opacity={0.15}
                      />
                    )}
                    
                    {/* 节点主体 */}
                    <circle
                      r={getNodeRadius(node)}
                      fill={getNodeColor(node)}
                      stroke={hoveredNode === node.id ? '#fff' : 'transparent'}
                      strokeWidth={2}
                      opacity={node.isHighlighted || node.isConnected ? 1 : 0.7}
                    />
                    
                    {/* 节点标签 */}
                    {(hoveredNode === node.id || node.isHighlighted || node.isConnected) && (
                      <text
                        y={getNodeRadius(node) + 14}
                        textAnchor="middle"
                        className="text-[10px] fill-dark-text pointer-events-none"
                        style={{ 
                          fontSize: '10px',
                          fill: node.isHighlighted ? '#8b5cf6' : '#94a3b8'
                        }}
                      >
                        {node.title.length > 15 ? node.title.slice(0, 15) + '...' : node.title}
                      </text>
                    )}
                  </g>
                ))}
              </g>
            </g>
          </svg>
        </div>
        
        {/* 底部控制栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border bg-dark-bg/50">
          <div className="flex items-center gap-4 text-xs text-dark-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>当前笔记</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>关联笔记</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>有链接</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale(prev => Math.min(3, prev * 1.2))}
              className="p-1.5 hover:bg-dark-border/50 rounded-lg transition-colors text-dark-muted hover:text-dark-text"
              title="放大"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <span className="text-xs text-dark-muted w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(prev => Math.max(0.3, prev * 0.8))}
              className="p-1.5 hover:bg-dark-border/50 rounded-lg transition-colors text-dark-muted hover:text-dark-text"
              title="缩小"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={() => {
                setScale(1)
                setTranslate({ x: 0, y: 0 })
              }}
              className="p-1.5 hover:bg-dark-border/50 rounded-lg transition-colors text-dark-muted hover:text-dark-text ml-2"
              title="重置视图"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GraphView
