import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { IconFileText, IconChevronUp, IconChevronLeft, IconClock, IconChevronRight, IconChevronDown, IconEye, IconTrash, IconX, IconZoomIn, IconZoomOut, IconArrowsMaximize } from '@tabler/icons-react';

const NovelEditView = ({ novel, chapters, linkMode = 'detail', currentChapterId, isDark = false }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [canvasState, setCanvasState] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    isPanning: false,
    lastMouseX: 0,
    lastMouseY: 0,
    dragStartX: 0,
    dragStartY: 0
  });

  // 节点数据
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);

  // 当选中章节时，延迟设置面板为打开状态以触发动画
  useEffect(() => {
    if (selectedChapter) {
      setTimeout(() => setIsPanelOpen(true), 10);
    } else {
      setIsPanelOpen(false);
    }
  }, [selectedChapter]);

  // 关闭面板的函数
  const closePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedChapter(null), 300);
  };

  // 构建节点数据
  useEffect(() => {
    if (!chapters || chapters.length === 0) return;

    const buildNodes = () => {
      const nodeList = [];
      const connectionList = [];

      chapters.forEach(chapter => {
        nodeList.push({
          id: chapter.id,
          title: chapter.title,
          type: chapter.parent_chapter_id ? 'normal' : 'root',
          content: chapter.content,
          chapterType: chapter.chapter_type,
          authorId: chapter.author_id,
          authorUsername: chapter.author_username,
          x: 0,
          y: 0,
          width: 160,
          height: 80,
          isSelected: false
        });

        if (chapter.parent_chapter_id) {
          connectionList.push({
            id: `${chapter.parent_chapter_id}-${chapter.id}`,
            source: chapter.parent_chapter_id,
            target: chapter.id,
            sourcePort: 'right',
            targetPort: 'left'
          });
        }
      });

      // 计算节点位置
      const positionedNodes = calculateNodePositions(nodeList, connectionList);
      setNodes(positionedNodes);
      setConnections(connectionList);
    };

    buildNodes();
  }, [chapters]);

  // 计算节点位置 - 只保留默认的层级布局
  const calculateNodePositions = (nodeList, connectionList) => {
    const rootNodes = nodeList.filter(n => n.type === 'root');
    const positionedNodes = [...nodeList];
    
    if (rootNodes.length === 0) return nodeList;

    const rootNode = rootNodes[0];
    rootNode.x = 100;
    rootNode.y = 200;

    const visited = new Set();
    const queue = [{ node: rootNode, level: 0 }];
    visited.add(rootNode.id);

    while (queue.length > 0) {
      const { node, level } = queue.shift();
      const children = connectionList
        .filter(conn => conn.source === node.id)
        .map(conn => nodeList.find(n => n.id === conn.target))
        .filter(Boolean);

      children.forEach((child, index) => {
        if (!visited.has(child.id)) {
          child.x = node.x + 200;
          child.y = node.y + (index - (children.length - 1) / 2) * 120;
          visited.add(child.id);
          queue.push({ node: child, level: level + 1 });
        }
      });
    }

    return positionedNodes;
  };

  // Canvas渲染
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // 设置canvas尺寸
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 清空画布
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 应用变换
    ctx.save();
    ctx.translate(canvasState.offsetX, canvasState.offsetY);
    ctx.scale(canvasState.scale, canvasState.scale);

    // 绘制网格背景
    drawGrid(ctx, rect.width, rect.height);

    // 绘制连接线
    drawConnections(ctx);

    // 绘制节点
    drawNodes(ctx);

    ctx.restore();
  }, [nodes, connections, canvasState, hoveredNode]);

  // 绘制网格
  const drawGrid = (ctx, width, height) => {
    const gridSize = 20;
    const offsetX = -canvasState.offsetX / canvasState.scale;
    const offsetY = -canvasState.offsetY / canvasState.scale;
    
    ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;

    // 垂直线
    for (let x = offsetX - (offsetX % gridSize); x < width + offsetX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, offsetY);
      ctx.lineTo(x, height + offsetY);
      ctx.stroke();
    }

    // 水平线
    for (let y = offsetY - (offsetY % gridSize); y < height + offsetY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(offsetX, y);
      ctx.lineTo(width + offsetX, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  // 绘制连接线
  const drawConnections = (ctx) => {
    ctx.strokeStyle = isDark ? '#6b7280' : '#9ca3af';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    connections.forEach(connection => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      if (!sourceNode || !targetNode) return;

      const sourcePort = getPortPosition(sourceNode, connection.sourcePort);
      const targetPort = getPortPosition(targetNode, connection.targetPort);

      // 绘制贝塞尔曲线
      ctx.beginPath();
      ctx.moveTo(sourcePort.x, sourcePort.y);
      
      const controlPoint1 = {
        x: sourcePort.x + (targetPort.x - sourcePort.x) * 0.5,
        y: sourcePort.y
      };
      const controlPoint2 = {
        x: sourcePort.x + (targetPort.x - sourcePort.x) * 0.5,
        y: targetPort.y
      };
      
      ctx.bezierCurveTo(
        controlPoint1.x, controlPoint1.y,
        controlPoint2.x, controlPoint2.y,
        targetPort.x, targetPort.y
      );
      
      ctx.stroke();

      // 绘制箭头
      drawArrow(ctx, targetPort, controlPoint2);
    });
  };

  // 获取端口位置
  const getPortPosition = (node, port) => {
    switch (port) {
      case 'left':
        return { x: node.x, y: node.y + node.height / 2 };
      case 'right':
        return { x: node.x + node.width, y: node.y + node.height / 2 };
      case 'top':
        return { x: node.x + node.width / 2, y: node.y };
      case 'bottom':
        return { x: node.x + node.width / 2, y: node.y + node.height };
      default:
        return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
    }
  };

  // 绘制箭头
  const drawArrow = (ctx, point, controlPoint) => {
    const angle = Math.atan2(point.y - controlPoint.y, point.x - controlPoint.x);
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(
      point.x - arrowLength * Math.cos(angle - arrowAngle),
      point.y - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(
      point.x - arrowLength * Math.cos(angle + arrowAngle),
      point.y - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();
  };

  // 绘制节点
  const drawNodes = (ctx) => {
    nodes.forEach(node => {
      // 节点阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // 节点背景
      const colors = getNodeColors(node.type, node.chapterType);
      ctx.fillStyle = colors.fill;
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = node.isSelected ? 3 : 2;

      // 圆角矩形
      roundRect(ctx, node.x, node.y, node.width, node.height, 8);
      ctx.fill();
      ctx.stroke();

      // 重置阴影
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 节点标题
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const title = node.title.length > 15 ? node.title.substring(0, 15) + '...' : node.title;
      ctx.fillText(title, node.x + node.width / 2, node.y + node.height / 2);

      // 绘制端口
      drawPorts(ctx, node);
    });
  };

  // 绘制端口 - 只显示有连线的端口
  const drawPorts = (ctx, node) => {
    // 检查节点是否有连线
    const hasConnections = connections.some(conn => 
      conn.source === node.id || conn.target === node.id
    );
    
    if (!hasConnections) return; // 如果没有连线，不绘制任何端口
    
    // 只绘制有连线的端口
    const usedPorts = new Set();
    
    // 检查作为源节点的端口
    connections.forEach(conn => {
      if (conn.source === node.id) {
        usedPorts.add(conn.sourcePort);
      }
    });
    
    // 检查作为目标节点的端口
    connections.forEach(conn => {
      if (conn.target === node.id) {
        usedPorts.add(conn.targetPort);
      }
    });
    
    // 只绘制被使用的端口
    usedPorts.forEach(port => {
      const portPos = getPortPosition(node, port);
      ctx.fillStyle = isDark ? '#4b5563' : '#d1d5db';
      ctx.strokeStyle = isDark ? '#6b7280' : '#9ca3af';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.arc(portPos.x, portPos.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
  };

  // 圆角矩形绘制
  const roundRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // 获取节点颜色
  const getNodeColors = (type, chapterType) => {
    if (type === 'root') {
      return { fill: '#10b981', stroke: '#059669' };
    }
    if (chapterType === 'ending') {
      return { fill: '#ef4444', stroke: '#dc2626' };
    }
    if (chapterType === 'tail_connection') {
      return { fill: '#8b5cf6', stroke: '#7c3aed' };
    }
    return { fill: '#3b82f6', stroke: '#1e40af' };
  };

  // 鼠标事件处理
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasState.offsetX) / canvasState.scale;
    const y = (e.clientY - rect.top - canvasState.offsetY) / canvasState.scale;

    // 检查是否点击了节点
    const clickedNode = nodes.find(node => 
      x >= node.x && x <= node.x + node.width &&
      y >= node.y && y <= node.y + node.height
    );

    if (clickedNode) {
      // 开始拖拽节点
      setDraggedNode(clickedNode);
      setCanvasState(prev => ({
        ...prev,
        isDragging: true,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));

      // 选中节点
      setSelectedChapter({
        id: clickedNode.id,
        title: clickedNode.title,
        type: clickedNode.type,
        content: clickedNode.content,
        chapterType: clickedNode.chapterType,
        authorId: clickedNode.authorId,
        authorUsername: clickedNode.authorUsername
      });
      
      // 更新节点选中状态
      setNodes(prev => prev.map(n => ({
        ...n,
        isSelected: n.id === clickedNode.id
      })));
    } else {
      // 开始平移画布
      setCanvasState(prev => ({
        ...prev,
        isPanning: true,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
    }
  };

  const handleMouseMove = (e) => {
    if (canvasState.isDragging && draggedNode) {
      // 拖拽节点
      const deltaX = (e.clientX - canvasState.lastMouseX) / canvasState.scale;
      const deltaY = (e.clientY - canvasState.lastMouseY) / canvasState.scale;
      
      setNodes(prev => prev.map(n => 
        n.id === draggedNode.id 
          ? { ...n, x: n.x + deltaX, y: n.y + deltaY }
          : n
      ));
      
      setCanvasState(prev => ({
        ...prev,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
    } else if (canvasState.isPanning) {
      // 平移画布
      const deltaX = e.clientX - canvasState.lastMouseX;
      const deltaY = e.clientY - canvasState.lastMouseY;
      
      setCanvasState(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY
      }));
    }

    // 检查悬停
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasState.offsetX) / canvasState.scale;
    const y = (e.clientY - rect.top - canvasState.offsetY) / canvasState.scale;

    const hovered = nodes.find(node => 
      x >= node.x && x <= node.x + node.width &&
      y >= node.y && y <= node.y + node.height
    );

    setHoveredNode(hovered);
    
    if (hovered) {
      canvasRef.current.style.cursor = 'pointer';
    } else {
      canvasRef.current.style.cursor = canvasState.isPanning ? 'grabbing' : 'grab';
    }
  };

  const handleMouseUp = () => {
    setCanvasState(prev => ({
      ...prev,
      isDragging: false,
      isPanning: false
    }));
    setDraggedNode(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, canvasState.scale * scaleFactor));

    // 计算新的偏移量以保持鼠标位置不变
    const newOffsetX = mouseX - (mouseX - canvasState.offsetX) * (newScale / canvasState.scale);
    const newOffsetY = mouseY - (mouseY - canvasState.offsetY) * (newScale / canvasState.scale);

    setCanvasState(prev => ({
      ...prev,
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    }));
  };

  // 重置视图
  const resetView = () => {
    // 重置画布状态
    setCanvasState({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      isPanning: false,
      lastMouseX: 0,
      lastMouseY: 0,
      dragStartX: 0,
      dragStartY: 0
    });
    
    // 重置节点位置到初始状态
    if (chapters && chapters.length > 0) {
      const nodeList = [];
      const connectionList = [];

      chapters.forEach(chapter => {
        nodeList.push({
          id: chapter.id,
          title: chapter.title,
          type: chapter.parent_chapter_id ? 'normal' : 'root',
          content: chapter.content,
          chapterType: chapter.chapter_type,
          authorId: chapter.author_id,
          authorUsername: chapter.author_username,
          x: 0,
          y: 0,
          width: 160,
          height: 80,
          isSelected: false
        });

        if (chapter.parent_chapter_id) {
          connectionList.push({
            id: `${chapter.parent_chapter_id}-${chapter.id}`,
            source: chapter.parent_chapter_id,
            target: chapter.id,
            sourcePort: 'right',
            targetPort: 'left'
          });
        }
      });

      // 重新计算节点位置
      const positionedNodes = calculateNodePositions(nodeList, connectionList);
      setNodes(positionedNodes);
      setConnections(connectionList);
    }
    
    // 清除选中的章节
    setSelectedChapter(null);
  };

  // 缩放控制
  const handleZoomIn = () => {
    setCanvasState(prev => ({
      ...prev,
      scale: Math.min(3, prev.scale * 1.2)
    }));
  };

  const handleZoomOut = () => {
    setCanvasState(prev => ({
      ...prev,
      scale: Math.max(0.1, prev.scale / 1.2)
    }));
  };

  // 平移控制
  const handlePan = (dx, dy) => {
    setCanvasState(prev => ({
      ...prev,
      offsetX: prev.offsetX + dx,
      offsetY: prev.offsetY + dy
    }));
  };

  // 渲染循环
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // 获取章节类型中文名称
  const getChapterTypeName = (type) => {
    const typeMap = {
      'normal': '普通章节',
      'ending': '结局章节',
      'tail_connection': '尾接章节'
    };
    return typeMap[type] || type;
  };

  if (!chapters || chapters.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <IconFileText className="w-12 h-12 text-slate-400" stroke={1.8} />
        </div>
        <h3 className="text-lg font-medium text-slate-700 mb-2">还没有章节</h3>
        <p className="text-slate-500 mb-4">创建章节后可以在这里查看思维导图结构</p>
        <Link
          to={`/novel/${novel.id}/create-chapter`}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          创建章节
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* 控制栏 */}
      <div className={`${isDark ? 'border rounded-lg p-4 mb-4 lg:mb-6' : 'bg-white border-slate-200 border rounded-lg p-4 mb-4 lg:mb-6'}`} style={isDark ? { backgroundColor: '#0e1516', borderColor: '#1a2223' } : {}}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => resetView()}
              className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap ${isDark ? 'text-slate-200 hover:text-slate-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              style={isDark ? { backgroundColor: '#1a2223' } : {}}
            >
              重置视图
            </button>

            {/* 只在传统模式下显示创建新章节按钮 */}
            {novel.novel_type === 'traditional' && (
              <Link
                to={`/novel/${novel.id}/create-chapter`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap text-center"
              >
                创建新章节
              </Link>
            )}
          </div>
        </div>

        {/* 图例 */}
        <div className="mt-4 flex flex-wrap items-center gap-4 lg:gap-6 text-sm">
          <div className="flex items-center space-x-2 whitespace-nowrap">
            <div className="w-4 h-4 bg-green-500 rounded flex-shrink-0"></div>
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>根章节</span>
          </div>
          <div className="flex items-center space-x-2 whitespace-nowrap">
            <div className="w-4 h-4 bg-blue-500 rounded flex-shrink-0"></div>
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>普通章节</span>
          </div>
          <div className="flex items-center space-x-2 whitespace-nowrap">
            <div className="w-4 h-4 bg-red-500 rounded flex-shrink-0"></div>
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>结局章节</span>
          </div>
          <div className="flex items-center space-x-2 whitespace-nowrap">
            <div className="w-4 h-4 bg-purple-500 rounded flex-shrink-0"></div>
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>尾接章节</span>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 relative min-h-0">
        {/* Canvas画布区域 */}
        <div className={`w-full h-full ${isDark ? 'border rounded-lg overflow-hidden' : 'bg-white border-slate-200 border rounded-lg overflow-hidden'}`} style={isDark ? { backgroundColor: '#0e1516', borderColor: '#1a2223' } : {}}>
          <div
            ref={containerRef}
            className="w-full h-full relative"
            style={{
              minHeight: '600px',
              height: '100%'
            }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-grab"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              onMouseLeave={handleMouseUp}
            />

            {/* 右下角视图控制按钮 */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-2">
              <div className={`${isDark ? 'border rounded-lg shadow-md p-1 grid grid-cols-3 grid-rows-3 gap-1' : 'bg-white border-slate-200 border rounded-lg shadow-md p-1 grid grid-cols-3 grid-rows-3 gap-1'}`} style={isDark ? { backgroundColor: '#1a2223', borderColor: '#232c2e' } : {}}>
                {/* 第一行：放大 / 上 / 缩小 */}
                <button onClick={handleZoomIn} className={`w-8 h-8 flex items-center justify-center rounded ${isDark ? 'text-slate-200' : 'text-slate-700 hover:bg-slate-50'}`} style={isDark ? { ':hover': { backgroundColor: '#232c2e' } } : {}} title="放大">
                  <IconZoomIn className="w-4 h-4" stroke={1.8} />
                </button>
                <button onClick={() => handlePan(0, -50)} className={`w-8 h-8 flex items-center justify-center rounded ${isDark ? 'text-slate-200' : 'text-slate-700 hover:bg-slate-50'}`} onMouseEnter={isDark ? (e) => e.target.style.backgroundColor = '#232c2e' : null} onMouseLeave={isDark ? (e) => e.target.style.backgroundColor = 'transparent' : null} title="上">
                  <IconChevronUp className="w-4 h-4" stroke={1.8} />
                </button>
                <button onClick={handleZoomOut} className={`w-8 h-8 flex items-center justify-center rounded ${isDark ? 'text-slate-200' : 'text-slate-700 hover:bg-slate-50'}`} onMouseEnter={isDark ? (e) => e.target.style.backgroundColor = '#232c2e' : null} onMouseLeave={isDark ? (e) => e.target.style.backgroundColor = 'transparent' : null} title="缩小">
                  <IconZoomOut className="w-4 h-4" stroke={1.8} />
                </button>

                {/* 第二行：左 / 重置 / 右 */}
                <button onClick={() => handlePan(-50, 0)} className={`w-8 h-8 flex items-center justify-center rounded ${isDark ? 'text-slate-200' : 'text-slate-700 hover:bg-slate-50'}`} onMouseEnter={isDark ? (e) => e.target.style.backgroundColor = '#232c2e' : null} onMouseLeave={isDark ? (e) => e.target.style.backgroundColor = 'transparent' : null} title="左">
                  <IconChevronLeft className="w-4 h-4" stroke={1.8} />
                </button>
                <button onClick={resetView} className={`w-8 h-8 flex items-center justify-center rounded ${isDark ? 'text-slate-200' : 'text-slate-700 hover:bg-slate-50'}`} onMouseEnter={isDark ? (e) => e.target.style.backgroundColor = '#232c2e' : null} onMouseLeave={isDark ? (e) => e.target.style.backgroundColor = 'transparent' : null} title="重置">
                  <IconArrowsMaximize className="w-4 h-4" stroke={1.8} />
                </button>
                <button onClick={() => handlePan(50, 0)} className={`w-8 h-8 flex items-center justify-center rounded ${isDark ? 'text-slate-200' : 'text-slate-700 hover:bg-slate-50'}`} onMouseEnter={isDark ? (e) => e.target.style.backgroundColor = '#232c2e' : null} onMouseLeave={isDark ? (e) => e.target.style.backgroundColor = 'transparent' : null} title="右">
                  <IconChevronRight className="w-4 h-4" stroke={1.8} />
                </button>

                {/* 第三行：空 / 下 / 空 */}
                <div />
                <button onClick={() => handlePan(0, 50)} className={`w-8 h-8 flex items-center justify-center rounded ${isDark ? 'text-slate-200' : 'text-slate-700 hover:bg-slate-50'}`} onMouseEnter={isDark ? (e) => e.target.style.backgroundColor = '#232c2e' : null} onMouseLeave={isDark ? (e) => e.target.style.backgroundColor = 'transparent' : null} title="下">
                  <IconChevronDown className="w-4 h-4" stroke={1.8} />
                </button>
                <div />
              </div>
            </div>
          </div>
        </div>

        {/* 手机端遮罩层 */}
        {selectedChapter && (
          <div
            className={`fixed inset-0 bg-black z-40 lg:hidden transition-opacity duration-300 ease-in-out ${isPanelOpen ? 'bg-opacity-50' : 'bg-opacity-0'
              }`}
            onClick={closePanel}
          />
        )}

        {/* 右侧信息面板 - PC端悬浮在画布上，手机端侧边栏效果 */}
        {selectedChapter && (
          <div className={`fixed inset-y-0 right-0 z-50 w-80 ${isDark ? 'border-l shadow-xl transform transition-all duration-300 ease-in-out lg:absolute lg:inset-auto lg:z-auto lg:w-80 lg:max-w-none lg:shadow-none lg:border lg:rounded-lg lg:top-4 lg:right-4 lg:bottom-4' : 'bg-white border-slate-200 border-l shadow-xl transform transition-all duration-300 ease-in-out lg:absolute lg:inset-auto lg:z-auto lg:w-80 lg:max-w-none lg:shadow-none lg:border lg:rounded-lg lg:top-4 lg:right-4 lg:bottom-4'} ${isPanelOpen
              ? 'translate-x-0 opacity-100'
              : 'translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100'
            }`} style={isDark ? { backgroundColor: '#0e1516', borderColor: '#1a2223' } : {}}>
            <div className="h-full overflow-y-auto p-4 lg:p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className={`text-lg font-medium ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>章节详情</h3>
                <button
                  onClick={closePanel}
                  className={`${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <IconX className="w-5 h-5" stroke={1.8} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>章节标题</label>
                  <p className={isDark ? 'text-slate-100' : 'text-slate-800'}>{selectedChapter.title}</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>章节类型</label>
                  <span className={`px-2 py-1 text-xs rounded-full ${selectedChapter.type === 'root' ? 'bg-green-100 text-green-700' :
                      selectedChapter.chapterType === 'ending' ? 'bg-red-100 text-red-700' :
                        selectedChapter.chapterType === 'tail_connection' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                    }`}>
                    {selectedChapter.type === 'root' ? '根章节' : getChapterTypeName(selectedChapter.chapterType)}
                  </span>
                </div>
                {(novel.novel_type !== 'traditional' && novel.novel_type !== 'author_original') && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>章节作者</label>
                    <p className={`${isDark ? 'text-slate-100' : 'text-slate-800'} text-sm`}>{selectedChapter.authorUsername || '未知'}</p>
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>章节内容</label>
                  <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} text-sm line-clamp-6`}>
                    {selectedChapter.content}
                  </p>
                </div>

                <div className={`pt-4 border-t space-y-3`} style={isDark ? { borderColor: '#1a2223' } : { borderColor: '#e2e8f0' }}>
                  <Link
                    to={linkMode === 'read' ? `/novel/${novel.id}/read/${selectedChapter.id}` : `/novel/${novel.id}/chapter/${selectedChapter.id}`}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center block"
                  >
                    查看完整章节
                  </Link>

                  {/* 新建章节按钮 - 只在非结局章节和尾接章节时显示 */}
                  {selectedChapter.chapterType !== 'ending' && selectedChapter.chapterType !== 'tail_connection' && (
                    <Link
                      to={`/novel/${novel.id}/create-chapter?parentChapterId=${selectedChapter.id}`}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center block"
                    >
                      在此章节后新建章节
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NovelEditView;
