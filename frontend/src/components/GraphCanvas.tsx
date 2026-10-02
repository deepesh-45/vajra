import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import type { NodeData, EdgeData } from '../types';

interface GraphCanvasProps {
  nodes: NodeData[];
  edges: EdgeData[];
  selectedNode: NodeData | null;
  onSelectNode: (node: NodeData | null) => void;
  maxTimestamp: number;
  minTimestamp?: number;
  timeMode?: 'cumulative' | 'slice';
  activeMotif?: 'all' | 'fan-out' | 'fan-in' | 'long-chain';
  clustersCollapsed?: boolean;
  onToggleClustering?: () => void;
  isolatedPathNodeIds?: Set<string> | null;
  layoutMode?: 'flow' | 'force';
  onNavigateToLegal?: (victim: string) => void;
}

// OSINT Entity Card Dimensions
const CARD_WIDTH = 210;
const CARD_HEIGHT = 76;
const CARD_RADIUS = 8;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
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
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  selectedNode,
  onSelectNode,
  maxTimestamp,
  minTimestamp: _minTimestamp = 0,
  timeMode = 'cumulative',
  activeMotif = 'all',
  clustersCollapsed: _clustersCollapsed = true,
  onToggleClustering: _onToggleClustering,
  isolatedPathNodeIds = null,
  layoutMode: _layoutMode = 'flow',
  onNavigateToLegal
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan & Zoom
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 70 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [animTime, setAnimTime] = useState<number>(0);
  const [edgeViewMode, setEdgeViewMode] = useState<'focused' | 'all'>('focused');
  const [nodeDetail, setNodeDetail] = useState<any>(null);

  useEffect(() => {
    if (!selectedNode) {
      setNodeDetail(null);
      return;
    }
    fetch(`/api/accounts/${selectedNode.acct_no}`)
      .then(res => res.json())
      .then(data => setNodeDetail(data))
      .catch(() => setNodeDetail(null));
  }, [selectedNode?.acct_no]);

  // OSINT Dynamic Expansion State (Nodes expand on click to eliminate clutter)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Adjacency maps for OSINT hierarchical expansion
  const { childrenMap } = useMemo(() => {
    const cMap = new Map<string, Set<string>>();
    edges.forEach(e => {
      if (!cMap.has(e.src_acct)) cMap.set(e.src_acct, new Set());
      cMap.get(e.src_acct)!.add(e.dst_acct);
    });
    return { childrenMap: cMap };
  }, [edges]);

  // Initialize expansion: Roots (Victim) & Layer 1 expanded by default
  useEffect(() => {
    if (nodes.length === 0) return;
    const initial = new Set<string>();

    if (nodes.length <= 16) {
      // Small graphs: expand all
      nodes.forEach(n => initial.add(n.acct_no));
    } else {
      // Large graphs: expand victim and Layer 1 nodes so initial fraud flow is visible
      nodes.forEach(n => {
        if (n.hop <= 1) {
          initial.add(n.acct_no);
        }
      });
    }
    setExpandedNodes(initial);
  }, [nodes]);

  // Animation loop for currency flow particles
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setAnimTime(t => (t + 0.02) % 1.0);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Container resize observer with high-DPR canvas scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Filter edges based on temporal slider & motifs
  const visibleEdges = useMemo(() => {
    return edges.filter(e => {
      if (timeMode === 'cumulative') {
        if (e.ts_epoch > maxTimestamp) return false;
      } else {
        if (Math.abs(e.ts_epoch - maxTimestamp) > 14400) return false;
      }

      if (activeMotif === 'fan-out') {
        if (e.hop > 2 || (e.hop === 2 && e.amount_paise > 5000000)) return false;
      } else if (activeMotif === 'fan-in') {
        if (e.hop < 2) return false;
      } else if (activeMotif === 'long-chain') {
        if (e.hop === 0) return false;
      }

      if (isolatedPathNodeIds) {
        if (!isolatedPathNodeIds.has(e.src_acct) || !isolatedPathNodeIds.has(e.dst_acct)) {
          return false;
        }
      }

      return true;
    });
  }, [edges, maxTimestamp, timeMode, activeMotif, isolatedPathNodeIds]);

  // OSINT Node Visibility Computation (Nodes expand on click, collapse to clean clutter)
  const { osintNodes, osintEdges } = useMemo(() => {
    const visibleAccts = new Set<string>();

    // 1. Always include root nodes (Victim / Hop 0)
    const roots = nodes.filter(n => n.hop === 0);
    roots.forEach(r => visibleAccts.add(r.acct_no));

    // 2. Breadth-First traversal: add children only if parent is expanded
    const queue = roots.map(r => r.acct_no);
    const visited = new Set<string>(queue);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (expandedNodes.has(curr)) {
        const children = childrenMap.get(curr);
        if (children) {
          children.forEach(childAcct => {
            visibleAccts.add(childAcct);
            if (!visited.has(childAcct)) {
              visited.add(childAcct);
              queue.push(childAcct);
            }
          });
        }
      }
    }

    // Filter nodes and edges
    const filteredNodes = nodes.filter(n => visibleAccts.has(n.acct_no));
    const filteredEdges = visibleEdges.filter(e => visibleAccts.has(e.src_acct) && visibleAccts.has(e.dst_acct));

    return {
      osintNodes: filteredNodes.length > 0 ? filteredNodes : nodes,
      osintEdges: filteredEdges
    };
  }, [nodes, visibleEdges, expandedNodes, childrenMap]);

  // Focused connections when an account is selected or hovered
  const focusedNodeConnections = useMemo(() => {
    const activeTarget = selectedNode || hoveredNode;
    if (!activeTarget) return null;

    const targetAcct = activeTarget.acct_no;
    const connectedNodeIds = new Set<string>([targetAcct]);
    const directEdgeIds = new Set<string>();

    osintEdges.forEach(e => {
      if (e.src_acct === targetAcct) {
        connectedNodeIds.add(e.dst_acct);
        directEdgeIds.add(`${e.src_acct}->${e.dst_acct}`);
      } else if (e.dst_acct === targetAcct) {
        connectedNodeIds.add(e.src_acct);
        directEdgeIds.add(`${e.src_acct}->${e.dst_acct}`);
      }
    });

    return { connectedNodeIds, directEdgeIds, targetAcct };
  }, [selectedNode, hoveredNode, osintEdges]);

  // Overlap-Free OSINT Card Layout Engine (Horizontal Hierarchical DAG)
  const { nodePositions, stageLanes, bounds } = useMemo(() => {
    const positions = new Map<string, { x: number; y: number; w: number; h: number }>();
    const hopGroups: Record<number, NodeData[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };

    osintNodes.forEach(n => {
      const hop = Math.min(4, Math.max(0, n.hop));
      if (!hopGroups[hop]) hopGroups[hop] = [];
      hopGroups[hop].push(n);
    });

    const stageMeta = [
      { name: "STAGE 0: VICTIM ORIGIN", desc: "Complainant Account" },
      { name: "STAGE 1: COLLECTOR HUBS", desc: "Primary Inflow Splitting" },
      { name: "STAGE 2: SMURFING DISPERSAL", desc: "Layering & Churn Rings" },
      { name: "STAGE 3: AGGREGATION", desc: "Consolidation Funnels" },
      { name: "STAGE 4: CASHOUT OFF-RAMPS", desc: "Terminal ATMs & P2P" }
    ];

    const laneConfigs: { subCols: number; laneWidth: number; startX: number }[] = [];
    let cumulativeX = 60;

    [0, 1, 2, 3, 4].forEach(hop => {
      const count = hopGroups[hop]?.length || 0;
      let subCols = 1;
      if (count > 24) subCols = 3;
      else if (count > 8) subCols = 2;

      const laneWidth = subCols * CARD_WIDTH + (subCols - 1) * 24 + 60;
      laneConfigs.push({ subCols, laneWidth, startX: cumulativeX });
      cumulativeX += laneWidth + 110; // 110px clear inter-stage conduit
    });

    const rowSpacing = CARD_HEIGHT + 24; // 100px vertical spacing between cards
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    [0, 1, 2, 3, 4].forEach(hop => {
      const group = hopGroups[hop];
      if (!group || group.length === 0) return;
      const conf = laneConfigs[hop];

      group.forEach((node, idx) => {
        const colIdx = idx % conf.subCols;
        const rowIdx = Math.floor(idx / conf.subCols);
        const stagger = (colIdx % 2) * (rowSpacing * 0.45);

        const x = conf.startX + 28 + colIdx * (CARD_WIDTH + 24);
        const y = 140 + rowIdx * rowSpacing + stagger;

        positions.set(node.acct_no, { x, y, w: CARD_WIDTH, h: CARD_HEIGHT });

        if (x < minX) minX = x;
        if (x + CARD_WIDTH > maxX) maxX = x + CARD_WIDTH;
        if (y < minY) minY = y;
        if (y + CARD_HEIGHT > maxY) maxY = y + CARD_HEIGHT;
      });
    });

    const stageLanes = [0, 1, 2, 3, 4].map(hop => ({
      name: stageMeta[hop].name,
      desc: stageMeta[hop].desc,
      x: laneConfigs[hop].startX,
      width: laneConfigs[hop].laneWidth,
      count: hopGroups[hop]?.length || 0
    }));

    return {
      nodePositions: positions,
      stageLanes,
      bounds: { minX, maxX, minY, maxY }
    };
  }, [osintNodes]);

  // Fit View
  const fitToView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bounds || bounds.minX === Infinity) return;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const graphW = bounds.maxX - bounds.minX + 80;
    const graphH = bounds.maxY - bounds.minY + 80;

    const scaleX = (width - 120) / Math.max(100, graphW);
    const scaleY = (height - 180) / Math.max(100, graphH);
    const newZoom = Math.min(1.4, Math.max(0.28, Math.min(scaleX, scaleY)));

    setZoom(newZoom);
    setPan({
      x: (width - graphW * newZoom) / 2 - bounds.minX * newZoom + 40,
      y: (height - graphH * newZoom) / 2 - bounds.minY * newZoom + 40
    });
  }, [bounds]);

  // Initial fit to view on load
  useEffect(() => {
    if (osintNodes.length > 0) {
      const timer = setTimeout(fitToView, 120);
      return () => clearTimeout(timer);
    }
  }, [osintNodes.length, fitToView]);

  // Canvas Drawing Routine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 1. Draw Subtle Architectural Background Grid
    ctx.fillStyle = '#F4F7FB';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Grid dots
    ctx.save();
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    const gridSize = 32 * zoom;
    const offsetX = pan.x % gridSize;
    const offsetY = pan.y % gridSize;
    for (let x = offsetX; x < rect.width; x += gridSize) {
      for (let y = offsetY; y < rect.height; y += gridSize) {
        ctx.fillRect(x, y, 1.2, 1.2);
      }
    }
    ctx.restore();

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 2. Draw Stage Corridor Backgrounds
    stageLanes.forEach(lane => {
      const laneH = Math.max(700, (bounds.maxY - bounds.minY) + 260);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      roundRect(ctx, lane.x, 80, lane.width, laneH, 10);
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Lane Header Title
      ctx.fillStyle = '#0F172A';
      ctx.font = '700 11.5px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(lane.name, lane.x + 16, 106);

      ctx.fillStyle = '#64748B';
      ctx.font = '500 9.5px Inter, sans-serif';
      ctx.fillText(`${lane.desc} (${lane.count} visible)`, lane.x + 16, 122);
    });

    const isFocusActive = !!focusedNodeConnections;

    // 3. Draw Directed Curvature Bezier Edges between Card Ports
    osintEdges.forEach(edge => {
      const p1 = nodePositions.get(edge.src_acct);
      const p2 = nodePositions.get(edge.dst_acct);
      if (!p1 || !p2) return;

      // Source port: Right edge midpoint of parent card
      const srcX = p1.x + CARD_WIDTH;
      const srcY = p1.y + CARD_HEIGHT / 2;

      // Destination port: Left edge midpoint of child card
      const dstX = p2.x;
      const dstY = p2.y + CARD_HEIGHT / 2;

      const isDirectlyFocused = focusedNodeConnections?.directEdgeIds.has(`${edge.src_acct}->${edge.dst_acct}`);
      const isDimmed = isFocusActive && !isDirectlyFocused && edgeViewMode === 'focused';

      const dx = dstX - srcX;
      const cpDist = Math.max(30, dx * 0.45);
      const cp1x = srcX + cpDist;
      const cp1y = srcY;
      const cp2x = dstX - cpDist;
      const cp2y = dstY;

      // Draw Base Flow Curve
      ctx.beginPath();
      ctx.moveTo(srcX, srcY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, dstX, dstY);

      if (isDirectlyFocused) {
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 3.5 / Math.sqrt(zoom);
      } else if (isDimmed) {
        ctx.strokeStyle = 'rgba(210, 191, 168, 0.25)';
        ctx.lineWidth = 1 / Math.sqrt(zoom);
      } else {
        ctx.strokeStyle = edge.amount_paise > 5000000 ? '#B45309' : '#64748B';
        ctx.lineWidth = Math.min(3.5, Math.max(1.5, Math.log10(edge.amount_paise / 10000 + 1))) / Math.sqrt(zoom);
      }
      ctx.stroke();

      // Streaming Animated Currency Particle
      if (!isDimmed) {
        const t = (animTime + (edge.hop * 0.2)) % 1.0;
        const u = 1 - t;
        const px = u * u * u * srcX + 3 * u * u * t * cp1x + 3 * u * t * t * cp2x + t * t * t * dstX;
        const py = u * u * u * srcY + 3 * u * u * t * cp1y + 3 * u * t * t * cp2y + t * t * t * dstY;

        ctx.fillStyle = isDirectlyFocused ? '#2563EB' : '#D97706';
        ctx.beginPath();
        ctx.arc(px, py, (isDirectlyFocused ? 4.5 : 3.0) / Math.sqrt(zoom), 0, Math.PI * 2);
        ctx.fill();
      }

      // Directional Arrow Head near destination
      const arrowT = 0.88;
      const au = 1 - arrowT;
      const ax = au * au * au * srcX + 3 * au * au * arrowT * cp1x + 3 * au * arrowT * arrowT * cp2x + arrowT * arrowT * arrowT * dstX;
      const ay = au * au * au * srcY + 3 * au * au * arrowT * cp1y + 3 * au * arrowT * arrowT * cp2y + arrowT * arrowT * arrowT * dstY;

      ctx.fillStyle = isDirectlyFocused ? '#2563EB' : '#64748B';
      ctx.beginPath();
      ctx.arc(ax, ay, 2.5 / Math.sqrt(zoom), 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Draw Large-Sized OSINT Entity Cards
    osintNodes.forEach(node => {
      const pos = nodePositions.get(node.acct_no);
      if (!pos) return;

      const screenX = pos.x * zoom + pan.x;
      const screenY = pos.y * zoom + pan.y;
      if (screenX < -260 || screenX > rect.width + 260 || screenY < -120 || screenY > rect.height + 120) {
        return; // Viewport Culling
      }

      const isTarget = selectedNode?.acct_no === node.acct_no;
      const isHovered = hoveredNode?.acct_no === node.acct_no;
      const isConnected = isFocusActive && focusedNodeConnections.connectedNodeIds.has(node.acct_no);
      const isDimmed = isFocusActive && !isConnected && edgeViewMode === 'focused';

      const isExpanded = expandedNodes.has(node.acct_no);
      const childCount = childrenMap.get(node.acct_no)?.size || 0;

      // Color Terminology Palette based on OSINT Investigative Standards
      let theme = {
        border: '#2563EB',
        headerBg: '#1E40AF',
        bodyBg: '#EFF6FF',
        badgeText: 'VICTIM COMPLAINANT'
      };

      if (node.isSupernode) {
        theme = {
          border: '#059669',
          headerBg: '#065F46',
          bodyBg: '#ECFDF5',
          badgeText: `SYNDICATE CLUSTER (${node.subNodeCount})`
        };
      } else if (node.hop === 0) {
        theme = {
          border: '#2563EB',
          headerBg: '#1E40AF',
          bodyBg: '#EFF6FF',
          badgeText: 'VICTIM COMPLAINANT'
        };
      } else if (node.hop === 1) {
        theme = {
          border: '#D97706',
          headerBg: '#B45309',
          bodyBg: '#FFFBEB',
          badgeText: 'L1 COLLECTOR MULE'
        };
      } else if (node.hop === 2) {
        theme = {
          border: '#7C3AED',
          headerBg: '#6D28D9',
          bodyBg: '#F5F3FF',
          badgeText: 'L2 SMURFING SPLITTER'
        };
      } else if (node.hop === 3) {
        theme = {
          border: '#DC2626',
          headerBg: '#991B1B',
          bodyBg: '#FEF2F2',
          badgeText: 'L3 TERMINAL MULE'
        };
      } else {
        theme = {
          border: '#374151',
          headerBg: '#1F2937',
          bodyBg: '#F3F4F6',
          badgeText: 'DRAINAGE CASHOUT'
        };
      }

      const { x, y, w, h } = pos;

      // 4.1 Focus Glow / Drop Shadow
      if (isTarget) {
        ctx.save();
        ctx.shadowColor = 'rgba(37, 99, 235, 0.45)';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#1D4ED8';
        ctx.lineWidth = 3;
        roundRect(ctx, x - 3, y - 3, w + 6, h + 6, CARD_RADIUS + 2);
        ctx.stroke();
        ctx.restore();
      } else if (isHovered) {
        ctx.save();
        ctx.shadowColor = 'rgba(52, 39, 30, 0.25)';
        ctx.shadowBlur = 10;
        ctx.restore();
      }

      // 4.2 Card Body Background
      ctx.save();
      roundRect(ctx, x, y, w, h, CARD_RADIUS);
      ctx.fillStyle = isDimmed ? '#F3F4F6' : theme.bodyBg;
      ctx.fill();
      ctx.strokeStyle = isDimmed ? '#D1D5DB' : theme.border;
      ctx.lineWidth = (isTarget || isHovered) ? 2.5 : 1.5;
      if (node.isSupernode) ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.restore();

      // 4.3 Card Header Strip (21px high)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + CARD_RADIUS, y);
      ctx.lineTo(x + w - CARD_RADIUS, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + CARD_RADIUS);
      ctx.lineTo(x + w, y + 21);
      ctx.lineTo(x, y + 21);
      ctx.lineTo(x, y + CARD_RADIUS);
      ctx.quadraticCurveTo(x, y, x + CARD_RADIUS, y);
      ctx.closePath();
      ctx.fillStyle = isDimmed ? '#9CA3AF' : theme.headerBg;
      ctx.fill();
      ctx.restore();

      // Header Left: Bank Tag
      const bankTag = node.isSupernode ? 'CLUSTER' : (node.bank || 'BANK').slice(0, 5).toUpperCase();
      ctx.font = '700 9px JetBrains Mono, monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`[${bankTag}]`, x + 8, y + 11);

      // Header Right: Role Tag
      ctx.font = '700 8.5px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillText(theme.badgeText, x + w - 8, y + 11);

      // 4.4 Card Body (Account Number & Subtitle)
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '700 12.5px JetBrains Mono, monospace';
      ctx.fillStyle = isDimmed ? '#9CA3AF' : '#111827';
      const labelText = node.isSupernode ? node.bank : node.acct_no;
      ctx.fillText(labelText, x + 10, y + 28);

      ctx.font = '500 9px Inter, sans-serif';
      ctx.fillStyle = isDimmed ? '#9CA3AF' : '#4B5563';
      const ifscText = node.isSupernode ? `${node.subNodeCount} Mules Grouped` : `${node.ifsc || 'Branch Account'}`;
      ctx.fillText(ifscText, x + 10, y + 43);

      // 4.5 Divider
      ctx.beginPath();
      ctx.moveTo(x, y + 55);
      ctx.lineTo(x + w, y + 55);
      ctx.strokeStyle = isDimmed ? '#E5E7EB' : 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 4.6 Card Footer: Financial Lien Status
      ctx.textBaseline = 'middle';
      if (node.held_paise > 0) {
        ctx.font = '700 9px Inter, sans-serif';
        ctx.fillStyle = isDimmed ? '#9CA3AF' : '#059669';
        const heldStr = `₹${(node.held_paise / 100).toLocaleString('en-IN')}`;
        ctx.fillText(`🔒 ${heldStr} HELD`, x + 10, y + 65);
      } else {
        ctx.font = '500 8.5px Inter, sans-serif';
        ctx.fillStyle = isDimmed ? '#9CA3AF' : '#6B7280';
        const movedStr = `₹${(node.taint_in_paise / 100).toLocaleString('en-IN')}`;
        ctx.fillText(`MOVED ${movedStr}`, x + 10, y + 65);
      }

      // 4.7 OSINT Expand / Collapse Pill
      if (childCount > 0) {
        const pillW = isExpanded ? 36 : 56;
        const pillH = 15;
        const pillX = x + w - pillW - 6;
        const pillY = y + 58;

        ctx.save();
        roundRect(ctx, pillX, pillY, pillW, pillH, 4);
        ctx.fillStyle = isExpanded ? '#E5E7EB' : theme.headerBg;
        ctx.fill();

        ctx.font = '700 8.5px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = isExpanded ? '#374151' : '#FFFFFF';
        ctx.fillText(isExpanded ? '⊖ LESS' : `⊕ ${childCount} MORE`, pillX + pillW / 2, pillY + pillH / 2 + 1);
        ctx.restore();
      }
    });

    ctx.restore();
    ctx.restore();
  }, [osintNodes, osintEdges, nodePositions, pan, zoom, animTime, stageLanes, bounds, focusedNodeConnections, edgeViewMode, expandedNodes, childrenMap, selectedNode, hoveredNode]);

  // Click handler: Expand / Collapse OSINT subtrees or Select Node
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - pan.x) / zoom;
    const clickY = (e.clientY - rect.top - pan.y) / zoom;

    for (const node of osintNodes) {
      const pos = nodePositions.get(node.acct_no);
      if (!pos) continue;

      if (clickX >= pos.x && clickX <= pos.x + pos.w && clickY >= pos.y && clickY <= pos.y + pos.h) {
        // Toggle expansion if node has children
        const hasChildren = (childrenMap.get(node.acct_no)?.size || 0) > 0;
        if (hasChildren) {
          setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(node.acct_no)) {
              next.delete(node.acct_no);
            } else {
              next.add(node.acct_no);
            }
            return next;
          });
        }

        onSelectNode(node);
        return;
      }
    }

    onSelectNode(null);
  };

  // Expand All / Collapse All OSINT Controls
  const handleExpandAll = () => {
    const all = new Set<string>();
    nodes.forEach(n => all.add(n.acct_no));
    setExpandedNodes(all);
  };

  const handleCollapseToL1 = () => {
    const initial = new Set<string>();
    nodes.forEach(n => {
      if (n.hop <= 1) initial.add(n.acct_no);
    });
    setExpandedNodes(initial);
  };

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    let found: NodeData | null = null;
    for (const node of osintNodes) {
      const pos = nodePositions.get(node.acct_no);
      if (!pos) continue;
      if (mouseX >= pos.x && mouseX <= pos.x + pos.w && mouseY >= pos.y && mouseY <= pos.y + pos.h) {
        found = node;
        break;
      }
    }
    setHoveredNode(found);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.2, Math.min(3.8, zoom * zoomFactor));

    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom)
    });
    setZoom(newZoom);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
        userSelect: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: isDragging ? 'grabbing' : hoveredNode ? 'pointer' : 'grab'
        }}
      />

      {/* Floating Graph HUD Controls */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '14px',
        right: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        padding: '7px 14px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
        backdropFilter: 'blur(8px)',
        zIndex: 10
      }}>
        {/* Left: Visible Nodes and Trail Count + Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
            <strong style={{ color: '#2563EB' }}>{osintNodes.length}</strong> of <strong>{nodes.length}</strong> Accounts Visible · <strong>{osintEdges.length}</strong> Flows
          </span>
          <span style={{ color: '#CBD5E1' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#1E40AF' }} />
              <span style={{ color: '#1E40AF' }}>Victim</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#B45309' }} />
              <span style={{ color: '#B45309' }}>L1 Smurf</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#6D28D9' }} />
              <span style={{ color: '#6D28D9' }}>L2 Layer</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#991B1B' }} />
              <span style={{ color: '#991B1B' }}>L3 Mule</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#1F2937' }} />
              <span style={{ color: '#1F2937' }}>Cash-Out</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Graph Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleExpandAll}
            title="Expand all downstream nodes across all hops"
            style={{
              padding: '4px 9px',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              color: '#0F172A',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ⊕ Expand All
          </button>
          <button
            onClick={handleCollapseToL1}
            title="Collapse deep branches to Layer 1 for clean investigation"
            style={{
              padding: '4px 9px',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              color: '#0F172A',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ⊖ Smart Collapse
          </button>
          <button
            onClick={fitToView}
            title="Fit entire graph into view"
            style={{
              padding: '4px 9px',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              color: '#0F172A',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Fit View
          </button>
          <button
            onClick={() => setEdgeViewMode(m => m === 'focused' ? 'all' : 'focused')}
            title="Toggle between focused connection trail vs all links"
            style={{
              padding: '4px 9px',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              backgroundColor: edgeViewMode === 'focused' ? '#EFF6FF' : '#F8FAFC',
              color: edgeViewMode === 'focused' ? '#1D4ED8' : '#0F172A',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {edgeViewMode === 'focused' ? '🎯 Focused' : '🌐 All Trails'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button
              onClick={() => setZoom(z => Math.min(3.8, z * 1.25))}
              style={{
                padding: '4px 8px',
                borderRadius: '5px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#0F172A',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              +
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.2, z / 1.25))}
              style={{
                padding: '4px 8px',
                borderRadius: '5px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#0F172A',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              −
            </button>
          </div>
        </div>
      </div>

      {/* Floating OSINT Forensic Drawer (When a node is selected) */}
      {selectedNode && (
        <div style={{
          position: 'absolute',
          top: '54px',
          right: '14px',
          width: '320px',
          maxHeight: 'calc(100% - 68px)',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                OSINT Forensic Entity
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>
                {selectedNode.acct_no}
              </div>
            </div>
            <button
              onClick={() => onSelectNode(null)}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '2px 6px'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            padding: '10px',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            fontSize: '0.75rem'
          }}>
            <div>
              <span style={{ color: '#64748B' }}>Primary Bank:</span>
              <div style={{ fontWeight: 600, color: '#0F172A' }}>{selectedNode.bank}</div>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Stage Hop:</span>
              <div style={{ fontWeight: 600, color: '#0F172A' }}>Stage {selectedNode.hop}</div>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Tainted Inflow:</span>
              <div style={{ fontWeight: 600, color: '#0F172A' }}>
                ₹{(selectedNode.taint_in_paise / 100).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Recoverable Lien:</span>
              <div style={{ fontWeight: 700, color: selectedNode.held_paise > 0 ? '#16A34A' : '#64748B' }}>
                ₹{(selectedNode.held_paise / 100).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* TreeSHAP Anomaly Driver */}
          {nodeDetail?.shap_explanation?.top_drivers?.length > 0 && (
            <div style={{
              padding: '8px 10px',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '0.6875rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>TreeSHAP Anomaly Driver:</span>
                <span style={{ fontWeight: 700, color: '#D97706', fontFamily: 'monospace' }}>
                  SHAP +{nodeDetail.shap_explanation.top_drivers[0].shap_value}
                </span>
              </div>
              <p style={{ margin: 0, color: '#475569', lineHeight: 1.3 }}>
                {nodeDetail.shap_explanation.top_drivers[0].evidence_text}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {childrenMap.has(selectedNode.acct_no) && (
              <button
                onClick={() => {
                  setExpandedNodes(prev => {
                    const next = new Set(prev);
                    if (next.has(selectedNode.acct_no)) next.delete(selectedNode.acct_no);
                    else next.add(selectedNode.acct_no);
                    return next;
                  });
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #DBEAFE',
                  color: '#1D4ED8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {expandedNodes.has(selectedNode.acct_no) ? '⊖ Collapse Children' : '⊕ Expand Children'}
              </button>
            )}

            {onNavigateToLegal && (
              <button
                onClick={() => onNavigateToLegal(selectedNode.acct_no)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Draft Notice →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Bottom Scale & Help Bar */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '6px 14px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        fontSize: '0.75rem',
        color: '#475569',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)'
      }}>
        <span>💡 <strong>Click card</strong> to toggle downstream branch expansion · <strong>Drag</strong> to pan canvas · <strong>Scroll</strong> to zoom</span>
      </div>
    </div>
  );
};
