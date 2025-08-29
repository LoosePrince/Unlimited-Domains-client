import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconFileText, IconChevronUp, IconChevronLeft, IconClock, IconChevronRight, IconChevronDown, IconEye, IconTrash, IconX } from '@tabler/icons-react';

const NovelEditView = ({ novel, chapters, linkMode = 'detail', currentChapterId, isDark = false }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const zoomRef = useRef(null); // 保存zoom对象的引用
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [viewMode, setViewMode] = useState('hierarchical'); // hierarchical, force, circular
  const [isPanelOpen, setIsPanelOpen] = useState(false); // 控制右侧栏动画状态

  // 当选中章节时，延迟设置面板为打开状态以触发动画
  useEffect(() => {
    if (selectedChapter) {
      // 先设置章节，然后延迟设置面板状态以触发动画
      setTimeout(() => setIsPanelOpen(true), 10);
    } else {
      setIsPanelOpen(false);
    }
  }, [selectedChapter]);

  // 关闭面板的函数
  const closePanel = () => {
    setIsPanelOpen(false);
    // 延迟清除选中的章节，让动画完成
    setTimeout(() => setSelectedChapter(null), 300);
  };

  useEffect(() => {
    if (!chapters || chapters.length === 0) return;

    // 动态导入D3.js
    const initD3Graph = async () => {
      try {
        const d3Module = await import('d3');
        const d3 = d3Module.default || d3Module;

        if (!d3 || !d3.select) {
          throw new Error('D3.js加载失败：无法获取d3.select方法');
        }

        // 清除之前的SVG内容
        if (svgRef.current) {
          svgRef.current.innerHTML = '';
        }

        // 构建图形数据
        const graphData = buildGraphData(chapters);

        // 创建SVG
        const svg = d3.select(svgRef.current)
          .append('svg')
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('viewBox', '0 0 1200 800')
          .style('display', 'block');

        // 创建图形组
        const g = svg.append('g');

        // 创建缩放功能
        const zoom = d3.zoom()
          .on('zoom', (event) => {
            g.attr('transform', event.transform);
          });

        // 保存zoom引用
        zoomRef.current = zoom;
        svg.call(zoom);

        // 手机端触摸事件优化
        if (window.innerWidth < 768) {
          svg.style('touch-action', 'pan-x pan-y');
        }

        // 确保SVG占满容器高度
        svg.style('height', '100%');
        svg.style('min-height', '600px');
        svg.style('display', 'block');

        // 根据视图模式选择布局
        let layout;
        switch (viewMode) {
          case 'hierarchical':
            layout = createHierarchicalLayout(graphData, d3);
            break;
          case 'circular':
            layout = createCircularLayout(graphData, d3);
            break;
          default:
            layout = createHierarchicalLayout(graphData, d3);
        }

        // 渲染节点
        const nodes = g.selectAll('.node')
          .data(layout.nodes)
          .enter()
          .append('g')
          .attr('class', 'node')
          .attr('transform', d => `translate(${d.x}, ${d.y})`)
          .style('cursor', 'pointer')
          .on('click', (event, d) => {
            setSelectedChapter({
              id: d.id,
              title: d.title,
              type: d.type,
              content: d.content,
              chapterType: d.chapterType,
              authorId: d.authorId,
              authorUsername: d.authorUsername
            });
          });

        // 绘制节点形状
        nodes.append('rect')
          .attr('width', d => d.width || 120)
          .attr('height', d => d.height || 60)
          .attr('rx', 8)
          .attr('ry', 8)
          .attr('fill', d => getNodeColor(d.type, d.chapterType))
          .attr('stroke', d => getNodeBorderColor(d.type, d.chapterType))
          .attr('stroke-width', d => (currentChapterId && d.id === currentChapterId ? 4 : 2));

        // 绘制节点标签
        nodes.append('text')
          .attr('x', d => (d.width || 120) / 2)
          .attr('y', d => (d.height || 60) / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', 'white')
          .attr('font-size', d => d.type === 'root' ? '12px' : '10px')
          .attr('font-weight', 'bold')
          .text(d => d.title.length > 12 ? d.title.substring(0, 12) + '...' : d.title);

        // 渲染边
        const edges = g.selectAll('.edge')
          .data(layout.edges)
          .enter()
          .append('g')
          .attr('class', 'edge');

        // 绘制边线
        edges.append('path')
          .attr('d', d => createEdgePath(d, layout.nodes))
          .attr('fill', 'none')
          .attr('stroke', isDark ? '#94a3b8' : '#6b7280')
          .attr('stroke-width', 2)
          .attr('marker-end', 'url(#arrowhead)');

        // 创建箭头标记
        svg.append('defs').append('marker')
          .attr('id', 'arrowhead')
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 8)
          .attr('refY', 0)
          .attr('orient', 'auto')
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .append('path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('fill', isDark ? '#94a3b8' : '#6b7280');

        // 自动适应视图
        const bounds = g.node().getBBox();
        const fullWidth = containerRef.current.clientWidth;
        const fullHeight = containerRef.current.clientHeight;
        const width = bounds.width;
        const height = bounds.height;
        const midX = bounds.x + width / 2;
        const midY = bounds.y + height / 2;

        if (width === 0 || height === 0) return;

        // 计算合适的缩放比例
        let scale;
        // 设置固定的默认缩放值
        if (graphData.nodes.length === 1) {
          // 单个节点时，缩放为1，居中显示
          scale = 1;
        } else {
          // 多个节点时，使用固定缩放值
          scale = 1; // 电脑端默认缩放为1
        }

        // 手机端使用3倍缩放
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          scale = 3;
        }

        const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

        svg.call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));

      } catch (error) {
        console.error('D3.js加载失败:', error);
      }
    };

    initD3Graph();

  }, [chapters, viewMode]);

  // 构建图形数据
  const buildGraphData = (chapters) => {
    const nodes = [];
    const edges = [];

    chapters.forEach(chapter => {
      nodes.push({
        id: chapter.id,
        title: chapter.title,
        type: chapter.parent_chapter_id ? 'normal' : 'root',
        content: chapter.content,
        chapterType: chapter.chapter_type,
        authorId: chapter.author_id,
        authorUsername: chapter.author_username
      });

      if (chapter.parent_chapter_id) {
        edges.push({
          source: chapter.parent_chapter_id,
          target: chapter.id
        });
      }
    });

    return { nodes, edges };
  };

  // 创建层级布局（设置最短边长限制，避免节点过近）
  const createHierarchicalLayout = (graphData, d3) => {
    const nodes = [...graphData.nodes];
    const edges = [...graphData.edges];

    // 找到根节点
    const rootNode = nodes.find(n => n.type === 'root');
    if (!rootNode) return { nodes: [], edges: [] };

    if (nodes.length === 1) {
      // 单个节点时，居中显示
      return {
        nodes: [{
          ...rootNode,
          x: 600,
          y: 400,
          width: rootNode.type === 'root' ? 140 : 120,
          height: rootNode.type === 'root' ? 70 : 60
        }],
        edges: []
      };
    }

    // 通过 nodeSize 设置固定的节点间距
    // 垂直间距: 80px；水平方向最短边长: 160px（可根据需要微调）
    const tree = d3.tree().nodeSize([80, 160]);
    const hierarchy = d3.stratify()
      .id(d => d.id)
      .parentId(d => {
        const edge = edges.find(e => e.target === d.id);
        return edge ? edge.source : null;
      })(nodes);

    const treeData = tree(hierarchy);

    // 转换坐标 - 交换x和y，让树形向右发展
    const layoutNodes = treeData.descendants().map(d => ({
      ...d.data,
      x: d.y + 150, // 使用 d.y 作为 x 坐标，结合 nodeSize 保证最短长度
      y: d.x + 200, // 使用 d.x 作为 y 坐标，垂直分布
      width: d.data.type === 'root' ? 140 : 120,
      height: d.data.type === 'root' ? 70 : 60
    }));

    const layoutEdges = treeData.links().map(d => ({
      source: d.source.id,
      target: d.target.id
    }));

    return { nodes: layoutNodes, edges: layoutEdges };
  };

  // 已移除力导向布局

  // 创建环形布局
  const createCircularLayout = (graphData, d3) => {
    const centerX = 600;
    const centerY = 400;
    const radius = 180; // 减少半径，让节点更紧凑

    const layoutNodes = graphData.nodes.map((node, index) => {
      const angle = (index / graphData.nodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      return {
        ...node,
        x,
        y,
        width: node.type === 'root' ? 140 : 120,
        height: node.type === 'root' ? 70 : 60
      };
    });

    return { nodes: layoutNodes, edges: graphData.edges };
  };

  // 创建边路径
  const createEdgePath = (edge, nodes) => {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);

    if (!source || !target) return '';

    // 计算连线起点和终点在节点边缘的位置
    const sourceWidth = source.width || 120;
    const sourceHeight = source.height || 60;
    const targetWidth = target.width || 120;
    const targetHeight = target.height || 60;

    // 计算连线的方向向量
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return '';

    // 归一化方向向量
    const dirX = dx / distance;
    const dirY = dy / distance;

    // 计算连线起点（从源节点边缘出发）
    const sourceX = source.x + (sourceWidth / 2) * dirX + sourceWidth / 2;
    const sourceY = source.y + (sourceHeight / 2) * dirY + sourceHeight / 2;

    // 计算连线终点（到达目标节点边缘）
    const targetX = target.x - (targetWidth / 2) * dirX + targetWidth / 2;
    const targetY = target.y - (targetHeight / 2) * dirY + targetHeight / 2;

    // 层级布局使用直线，其他布局使用曲线
    if (viewMode === 'hierarchical') {
      // 直线连接
      return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    } else {
      // 曲线连接（力导向和环形布局）
      const midX = (sourceX + targetX) / 2;
      const midY = (sourceY + targetY) / 2;
      const offset = Math.abs(targetX - sourceX) * 0.3;
      return `M ${sourceX} ${sourceY} Q ${midX} ${midY - offset} ${targetX} ${targetY}`;
    }
  };

  // 获取节点颜色
  const getNodeColor = (type, chapterType) => {
    if (type === 'root') return '#10b981';
    if (chapterType === 'ending') return '#ef4444';
    if (chapterType === 'tail_connection') return '#8b5cf6';
    return '#3b82f6';
  };

  // 获取节点边框颜色
  const getNodeBorderColor = (type, chapterType) => {
    if (type === 'root') return '#059669';
    if (chapterType === 'ending') return '#dc2626';
    if (chapterType === 'tail_connection') return '#7c3aed';
    return '#1e40af';
  };

  // 切换视图模式
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // 重置视图
  const resetView = async () => {
    if (svgRef.current && zoomRef.current) {
      try {
        const d3Module = await import('d3');
        const d3 = d3Module.default || d3Module;

        if (d3 && d3.select) {
          const svg = d3.select(svgRef.current);
          // 重置缩放和平移
          svg.transition().duration(750).call(
            zoomRef.current.transform,
            d3.zoomIdentity
          );
        }
      } catch (error) {
        console.error('重置视图失败:', error);
      }
    }
  };

  // 视图控制：缩放与移动
  const handleZoomIn = async () => {
    if (!svgRef.current || !zoomRef.current) return;
    const d3Module = await import('d3');
    const d3 = d3Module.default || d3Module;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(200).call(zoomRef.current.scaleBy, 1.2);
  };

  const handleZoomOut = async () => {
    if (!svgRef.current || !zoomRef.current) return;
    const d3Module = await import('d3');
    const d3 = d3Module.default || d3Module;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(200).call(zoomRef.current.scaleBy, 0.8);
  };

  const handlePan = async (dx, dy) => {
    if (!svgRef.current || !zoomRef.current) return;
    const d3Module = await import('d3');
    const d3 = d3Module.default || d3Module;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(200).call(zoomRef.current.translateBy, dx, dy);
  };

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
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <span className={`text-sm font-medium whitespace-nowrap ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>视图模式：</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleViewModeChange('hierarchical')}
                className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap ${viewMode === 'hierarchical' ? 'bg-blue-600 text-white' : (isDark ? 'text-slate-200 hover:text-slate-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}`}
                style={viewMode !== 'hierarchical' && isDark ? { backgroundColor: '#1a2223', ':hover': { backgroundColor: '#232c2e' } } : {}}
              >
                层级布局
              </button>
              {/* 力导向布局已移除 */}
              <button
                onClick={() => handleViewModeChange('circular')}
                className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap ${viewMode === 'circular' ? 'bg-blue-600 text-white' : (isDark ? 'text-slate-200 hover:text-slate-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}`}
                style={viewMode !== 'circular' && isDark ? { backgroundColor: '#1a2223' } : {}}
              >
                环形布局
              </button>
            </div>
          </div>

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
      <div className="flex-1 flex flex-col lg:flex-row lg:space-x-6 min-h-0">
        {/* 思维导图区域 */}
        <div className={`flex-1 ${isDark ? 'border rounded-lg overflow-hidden min-h-0' : 'bg-white border-slate-200 border rounded-lg overflow-hidden min-h-0'}`} style={isDark ? { backgroundColor: '#0e1516', borderColor: '#1a2223' } : {}}>
          <div
            ref={containerRef}
            className="w-full h-full relative"
            style={{
              minHeight: '600px',
              height: '100%'
            }}
          >
            <div
              ref={svgRef}
              className="w-full h-full"
              style={{
                height: '100%',
                minHeight: '600px'
              }}
            />

            {/* 右下角视图控制按钮 */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-2">
              <div className={`${isDark ? 'border rounded-lg shadow-md p-1 grid grid-cols-3 grid-rows-3 gap-1' : 'bg-white border-slate-200 border rounded-lg shadow-md p-1 grid grid-cols-3 grid-rows-3 gap-1'}`} style={isDark ? { backgroundColor: '#1a2223', borderColor: '#232c2e' } : {}}>
                {/* 第一行：放大 / 上 / 缩小 */}
                <button onClick={handleZoomIn} className={`w-8 h-8 flex items-center justify-center rounded ${isDark ? 'text-slate-200' : 'text-slate-700 hover:bg-slate-50'}`} style={isDark ? { ':hover': { backgroundColor: '#232c2e' } } : {}} title="放大">
                  <span className="text-base leading-none">＋</span>
                </button>
                <button onClick={() => handlePan(0, -50)} className={`w-8 h-8 flex items-center justify-center rounded ${isDark ? 'text-slate-200' : 'text-slate-700 hover:bg-slate-50'}`} onMouseEnter={isDark ? (e) => e.target.style.backgroundColor = '#232c2e' : null} onMouseLeave={isDark ? (e) => e.target.style.backgroundColor = 'transparent' : null} title="上">
                  <IconChevronUp className="w-4 h-4" stroke={1.8} />
                </button>
                <button onClick={handleZoomOut} className={`w-8 h-8 flex items-center justify-center rounded ${isDark ? 'text-slate-200' : 'text-slate-700 hover:bg-slate-50'}`} onMouseEnter={isDark ? (e) => e.target.style.backgroundColor = '#232c2e' : null} onMouseLeave={isDark ? (e) => e.target.style.backgroundColor = 'transparent' : null} title="缩小">
                  <span className="text-base leading-none">－</span>
                </button>

                {/* 第二行：左 / 重置 / 右 */}
                <button onClick={() => handlePan(-50, 0)} className={`w-8 h-8 flex items-center justify-center rounded ${isDark ? 'text-slate-200' : 'text-slate-700 hover:bg-slate-50'}`} onMouseEnter={isDark ? (e) => e.target.style.backgroundColor = '#232c2e' : null} onMouseLeave={isDark ? (e) => e.target.style.backgroundColor = 'transparent' : null} title="左">
                  <IconChevronLeft className="w-4 h-4" stroke={1.8} />
                </button>
                <button onClick={resetView} className={`w-8 h-8 flex items-center justify-center rounded ${isDark ? 'text-slate-200' : 'text-slate-700 hover:bg-slate-50'}`} onMouseEnter={isDark ? (e) => e.target.style.backgroundColor = '#232c2e' : null} onMouseLeave={isDark ? (e) => e.target.style.backgroundColor = 'transparent' : null} title="重置">
                  <IconClock className="w-4 h-4" stroke={1.8} />
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

        {/* 右侧信息面板 - 手机端侧边栏效果 */}
        {selectedChapter && (
          <div className={`fixed inset-y-0 right-0 z-50 w-80 ${isDark ? 'border-l shadow-xl transform transition-all duration-300 ease-in-out lg:relative lg:inset-auto lg:z-auto lg:w-80 lg:max-w-none lg:shadow-none lg:border-l-0 lg:border lg:rounded-lg' : 'bg-white border-slate-200 border-l shadow-xl transform transition-all duration-300 ease-in-out lg:relative lg:inset-auto lg:z-auto lg:w-80 lg:max-w-none lg:shadow-none lg:border-l-0 lg:border lg:rounded-lg'} ${isPanelOpen
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
