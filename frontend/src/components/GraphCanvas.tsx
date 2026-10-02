import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Sparkles, Scan, Maximize2, Minimize2, Layers } from 'lucide-react';
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
  clustersCollapsed = false,
  onToggleClustering,
  isolatedPathNodeIds = null,
  layoutMode = 'flow'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 60, y: 40 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [animTime, setAnimTime] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Animation frame loop for flow particles
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setAnimTime(t => (t + 0.025) % 1.0);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Filter edges based on temporal playback (cumulative vs slice) and motif filters
  const visibleEdges = useMemo(() => {
    return edges.filter(e => {
      // 1. Time Filtering
      if (timeMode === 'cumulative') {
        if (e.ts_epoch > maxTimestamp) return false;
      } else {
        // Window slice (+/- 4 hours = 14400s)
        if (Math.abs(e.ts_epoch - maxTimestamp) > 14400) return false;
      }

      // 2. Motif Filtering
      if (activeMotif === 'fan-out') {
        // Highlight rapid dispersal into small sums (< ₹50,000) or from victim/L1
        if (e.hop > 2 || (e.hop === 2 && e.amount_paise > 5000000)) return false;
      } else if (activeMotif === 'fan-in') {
        // Highlight aggregation into collector hubs (Hop 2/3 -> 3/4)
        if (e.hop < 2) return false;
      } else if (activeMotif === 'long-chain') {
        // End-to-end multi-hop trail
        if (e.hop === 0) return false;
      }

      // 3. Isolated Path Filtering
      if (isolatedPathNodeIds) {
        if (!isolatedPathNodeIds.has(e.src_acct) || !isolatedPathNodeIds.has(e.dst_acct)) {
          return false;
        }
      }

      return true;
    });
  }, [edges, maxTimestamp, timeMode, activeMotif, isolatedPathNodeIds]);

  // Collapsible Supernodes Calculation
  const { displayNodes, displayEdges } = useMemo(() => {
    if (!clustersCollapsed) {
      return {
        displayNodes: nodes,
        displayEdges: visibleEdges
      };
    }

    const clusterMap = new Map<string, string>();
    const hopGroups: Record<number, NodeData[]> = {};
    nodes.forEach(n => {
      const hop = Math.min(4, Math.max(0, n.hop));
      if (!hopGroups[hop]) hopGroups[hop] = [];
      hopGroups[hop].push(n);
    });

    const collapsedList: NodeData[] = [];
    const supernodes: NodeData[] = [];

    // Group large mule layers (e.g. >15 nodes in hop 2 or hop 3) into Supernodes
    [0, 1, 2, 3, 4].forEach(hop => {
      const group = hopGroups[hop] || [];
      if (group.length > 15 && hop >= 2) {
        // Create Supernode
        const superId = `SUPERNODE_CLUSTER_HOP_${hop}`;
        const totalHeld = group.reduce((acc, n) => acc + n.held_paise, 0);
        const superNode: NodeData = {
          acct_id: -hop * 1000,
          acct_no: superId,
          bank: hop === 2 ? 'MULE RING' : 'CASH-OUT AGGREGATOR',
          ifsc: 'MULTIBANK',
          layer: hop === 2 ? 'Stage 2: Layering Mules' : 'Stage 3: Funnel Hub',
          hop: hop,
          taint_in_paise: group.reduce((acc, n) => acc + n.taint_in_paise, 0),
          taint_out_paise: group.reduce((acc, n) => acc + n.taint_out_paise, 0),
          held_paise: totalHeld,
          first_seen_epoch: group[0]?.first_seen_epoch || 0,
          isSupernode: true,
          subNodeCount: group.length,
          clusterId: `RING-H${hop}`
        };
        supernodes.push(superNode);
        group.forEach(n => clusterMap.set(n.acct_no, superId));
      } else {
        group.forEach(n => collapsedList.push(n));
      }
    });

    const finalNodes = [...collapsedList, ...supernodes];

    // Re-route edges that connect to collapsed nodes to the Supernode
    const routedEdges: EdgeData[] = [];
    const edgeKeySet = new Set<string>();

    visibleEdges.forEach(e => {
      const src = clusterMap.get(e.src_acct) || e.src_acct;
      const dst = clusterMap.get(e.dst_acct) || e.dst_acct;

      if (src === dst) return; // Hide internal cluster churn when collapsed

      const key = `${src}->${dst}`;
      if (!edgeKeySet.has(key)) {
        edgeKeySet.add(key);
        routedEdges.push({
          ...e,
          src_acct: src,
          dst_acct: dst
        });
      }
    });

    return {
      displayNodes: finalNodes,
      displayEdges: routedEdges,
      supernodeClusterMap: clusterMap
    };
  }, [nodes, visibleEdges, clustersCollapsed]);

  // Compute active nodes reached
  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    const victim = displayNodes.find(n => n.hop === 0);
    if (victim) ids.add(victim.acct_no);

    displayEdges.forEach(e => {
      ids.add(e.src_acct);
      ids.add(e.dst_acct);
    });
    return ids;
  }, [displayNodes, displayEdges]);

  // High-density layout calculation with Sugiyama DAG stage lanes
  const { nodePositions, bounds } = useMemo(() => {
    const positions = new Map<string, { x: number; y: number; r: number }>();
    const hopGroups: Record<number, NodeData[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };

    displayNodes.forEach(n => {
      const hop = Math.min(4, Math.max(0, n.hop));
      if (!hopGroups[hop]) hopGroups[hop] = [];
      hopGroups[hop].push(n);
    });

    const isLargeGraph = displayNodes.length > 150;
    const stageWidths = {
      0: 140, // Stage 0: Infiltration
      1: 380, // Stage 1: Smurfing Dispatch
      2: 740, // Stage 2: Layering Mules
      3: 1140, // Stage 3: Aggregator Funnel
      4: 1500  // Stage 4: Cash-Out Exits
    };

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    [0, 1, 2, 3, 4].forEach(hop => {
      const group = hopGroups[hop];
      if (!group || group.length === 0) return;

      const baseX = stageWidths[hop as keyof typeof stageWidths];
      const count = group.length;

      // In dense layers (e.g. 500+ nodes), distribute into sub-columns
      const maxCols = isLargeGraph ? 10 : 5;
      const subCols = Math.max(1, Math.min(maxCols, Math.ceil(count / (isLargeGraph ? 16 : 14))));
      const colWidth = subCols > 1 ? (isLargeGraph ? 42 : 54) : 0;
      const itemsPerCol = Math.ceil(count / subCols);
      const rowSpacing = Math.max(isLargeGraph ? 22 : 28, Math.min(65, 540 / Math.max(itemsPerCol, 1)));

      group.forEach((node, idx) => {
        const colIdx = idx % subCols;
        const rowIdx = Math.floor(idx / subCols);
        const x = baseX + (colIdx - (subCols - 1) / 2) * colWidth;
        const y = 90 + (rowIdx + 0.5) * rowSpacing + ((colIdx % 2) * (rowSpacing * 0.25));

        // Node radius dynamically sized
        let r = 11;
        if (node.isSupernode) r = 26; // Collapsible Supernode
        else if (hop === 0) r = isLargeGraph ? 15 : 18; // Victim
        else if (node.held_paise > 10000000) r = isLargeGraph ? 14 : 17; // > ₹1 Lakh
        else if (node.held_paise > 1000000) r = isLargeGraph ? 12 : 14; // > ₹10,000
        else r = isLargeGraph ? 8.5 : 10;

        positions.set(node.acct_no, { x, y, r });

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
    });

    return {
      nodePositions: positions,
      bounds: {
        minX: isFinite(minX) ? minX : 0,
        maxX: isFinite(maxX) ? maxX : 1600,
        minY: isFinite(minY) ? minY : 0,
        maxY: isFinite(maxY) ? maxY : 700
      }
    };
  }, [displayNodes]);

  // Auto-fit function to center and frame all nodes
  const fitToView = () => {
    const canvas = canvasRef.current;
    if (!canvas || displayNodes.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const graphWidth = (bounds.maxX - bounds.minX) + 140;
    const graphHeight = (bounds.maxY - bounds.minY) + 140;

    const scaleX = rect.width / graphWidth;
    const scaleY = rect.height / graphHeight;
    const fitZoom = Math.max(0.2, Math.min(1.15, Math.min(scaleX, scaleY) * 0.94));

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    setZoom(fitZoom);
    setPan({
      x: rect.width / 2 - centerX * fitZoom,
      y: rect.height / 2 - centerY * fitZoom
    });
  };

  useEffect(() => {
    if (displayNodes.length > 0) {
      const timer = setTimeout(fitToView, 60);
      return () => clearTimeout(timer);
    }
  }, [displayNodes.length, clustersCollapsed]);

  // Canvas Redraw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Cream background
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Draw Architectural Layer Stage Bands (Sugiyama DAG)
    if (layoutMode === 'flow') {
      const bands = [
        { name: "STAGE 0: INFILTRATION", desc: "Victim Breach / Source", x: 40, w: 180 },
        { name: "STAGE 1: SMURF DISPATCH", desc: "Primary Dispersal Hub", x: 260, w: 230 },
        { name: "STAGE 2: LAYERING MULES", desc: "Smurfing & Layering Ring", x: 580, w: 380 },
        { name: "STAGE 3: AGGREGATOR FUNNEL", desc: "Consolidation Accounts", x: 1040, w: 260 },
        { name: "STAGE 4: CASHOUT EXITS", desc: "Terminal Off-Ramps & ATMs", x: 1380, w: 240 }
      ];

      const bandHeight = Math.max(680, (bounds.maxY - bounds.minY) + 140);

      bands.forEach(b => {
        ctx.fillStyle = '#F3EFE6';
        ctx.strokeStyle = '#E0D8CA';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        // roundRect fallback
        if (ctx.roundRect) {
          ctx.roundRect(b.x, 30, b.w, bandHeight, 10);
        } else {
          ctx.rect(b.x, 30, b.w, bandHeight);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#536458';
        ctx.font = '700 10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(b.name, b.x + 12, 50);

        ctx.fillStyle = '#8C7853';
        ctx.font = '500 9px Inter, sans-serif';
        ctx.fillText(b.desc, b.x + 12, 64);
      });
    }

    // 2. Batch Draw Edges with Bezier Curves
    const isDenseGraph = displayEdges.length > 300;

    displayEdges.forEach((edge, edgeIdx) => {
      const p1 = nodePositions.get(edge.src_acct);
      const p2 = nodePositions.get(edge.dst_acct);
      if (!p1 || !p2) return;

      const isTainted = edge.taint_paise > 0;
      const isSelected = selectedNode && (edge.src_acct === selectedNode.acct_no || edge.dst_acct === selectedNode.acct_no);

      ctx.beginPath();
      if (isSelected) {
        ctx.strokeStyle = '#065F46';
        ctx.lineWidth = 3 / Math.sqrt(zoom);
      } else if (isTainted) {
        ctx.strokeStyle = '#991B1B';
        ctx.lineWidth = Math.min(4.5, Math.max(1.2, Math.log10(Math.max(10, edge.amount_paise / 1000)))) / Math.sqrt(zoom);
      } else {
        ctx.strokeStyle = '#D8CFBF';
        ctx.lineWidth = 1 / Math.sqrt(zoom);
      }

      // Smooth horizontal Cubic Bezier Curve for flow clarity
      const dx = (p2.x - p1.x) * 0.5;
      ctx.moveTo(p1.x, p1.y);
      ctx.bezierCurveTo(p1.x + dx, p1.y, p2.x - dx, p2.y, p2.x, p2.y);
      ctx.stroke();

      // Fluid Animated Currency Particles
      const showParticle = isTainted && (!isDenseGraph || edgeIdx % 3 === 0 || edge.taint_paise > 5000000 || isSelected);
      if (showParticle) {
        const t = (animTime + ((edgeIdx * 17) % 100) / 100) % 1.0;
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const cp1x = p1.x + dx;
        const cp2x = p2.x - dx;
        const px = uu * u * p1.x + 3 * uu * t * cp1x + 3 * u * tt * cp2x + tt * t * p2.x;
        const py = uu * u * p1.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p2.y;

        ctx.fillStyle = isSelected ? '#065F46' : '#991B1B';
        ctx.beginPath();
        ctx.arc(px, py, (displayNodes.length > 200 ? 2.5 : 3.5) / Math.sqrt(zoom), 0, Math.PI * 2);
        ctx.fill();
      }

      // Directional arrow indicator
      const arrowT = 0.65;
      const u = 1 - arrowT;
      const cp1x = p1.x + dx;
      const cp2x = p2.x - dx;
      const ax = u * u * u * p1.x + 3 * u * u * arrowT * cp1x + 3 * u * arrowT * arrowT * cp2x + arrowT * arrowT * arrowT * p2.x;
      const ay = u * u * u * p1.y + 3 * u * u * arrowT * p1.y + 3 * u * arrowT * arrowT * p2.y + arrowT * arrowT * arrowT * p2.y;

      ctx.fillStyle = isTainted ? '#991B1B' : '#8C7853';
      ctx.beginPath();
      ctx.arc(ax, ay, 2.5 / Math.sqrt(zoom), 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Draw Nodes with Level-of-Detail (LOD) & Supernodes
    const isDense = displayNodes.length > 150;
    const showText = zoom >= 0.55 || !isDense;

    displayNodes.forEach(node => {
      const pos = nodePositions.get(node.acct_no);
      if (!pos) return;

      // Viewport culling
      const screenX = pos.x * zoom + pan.x;
      const screenY = pos.y * zoom + pan.y;
      if (screenX < -70 || screenX > rect.width + 70 || screenY < -70 || screenY > rect.height + 70) {
        return;
      }

      const isActive = activeNodeIds.has(node.acct_no);
      const isSelected = selectedNode?.acct_no === node.acct_no;
      const isHovered = hoveredNode?.acct_no === node.acct_no;

      let baseColor = '#065F46'; // L1 Emerald
      if (node.isSupernode) baseColor = '#065F46'; // Supernode
      else if (node.hop === 0) baseColor = '#5B21B6'; // Victim Purple
      else if (node.hop === 1) baseColor = '#065F46'; // L1 Smurfing Dispatch (Emerald)
      else if (node.hop === 2) baseColor = '#B45309'; // L2 Layering Mule (Ochre)
      else if (node.hop === 3) baseColor = '#477343'; // L3 Aggregator (Pista)
      else baseColor = '#991B1B'; // L4 Cashout Exit (Burgundy)

      // Supernode Outer Dashed Ring
      if (node.isSupernode) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#477343';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.r + 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Halo on select/hover
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.r + 8, 0, Math.PI * 2);
        ctx.fillStyle = baseColor + '33';
        ctx.fill();
      }

      // Outer Risk Border
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pos.r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = node.held_paise > 0 ? '#16A34A' : '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Main Node Body Circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? baseColor : '#E2E8F0';
      ctx.fill();
      ctx.lineWidth = isSelected ? 3.5 : 1.5;
      ctx.strokeStyle = isSelected ? '#0F172A' : '#FFFFFF';
      ctx.stroke();

      // Center Text / Bank Initial or Supernode Count
      if (node.isSupernode) {
        ctx.font = '700 11px JetBrains Mono, monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${node.subNodeCount}`, pos.x, pos.y);
      } else if (pos.r >= 11) {
        ctx.font = `700 ${Math.max(8, pos.r * 0.6)}px Inter, sans-serif`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.bank.slice(0, 2), pos.x, pos.y);
      }

      // Text Labels
      if (showText || isHovered || isSelected || node.isSupernode) {
        ctx.textBaseline = 'alphabetic';
        ctx.font = node.isSupernode ? '700 11px Inter, sans-serif' : '600 10px Inter, sans-serif';
        ctx.fillStyle = isActive ? '#0F172A' : '#94A3B8';
        ctx.textAlign = 'center';

        const labelText = node.isSupernode ? `${node.bank} (${node.subNodeCount} Mules)` : node.acct_no.slice(0, 8);
        ctx.fillText(labelText, pos.x, pos.y + pos.r + 13);

        // Recoverable Stolen Funds Badge
        if (node.held_paise > 0 && !node.isSupernode) {
          const heldInr = `₹${(node.held_paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
          ctx.font = '700 9px JetBrains Mono, monospace';
          ctx.fillStyle = '#16A34A';
          ctx.fillText(heldInr, pos.x, pos.y - pos.r - 5);
        }
      }
    });

    ctx.restore();
  }, [displayNodes, displayEdges, activeNodeIds, selectedNode, hoveredNode, nodePositions, pan, zoom, animTime, clustersCollapsed, layoutMode]);

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

    // Hover detection in transformed space
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    let found: NodeData | null = null;
    for (const node of displayNodes) {
      const pos = nodePositions.get(node.acct_no);
      if (!pos) continue;
      const dist = Math.hypot(pos.x - mouseX, pos.y - mouseY);
      if (dist <= pos.r + 5) {
        found = node;
        break;
      }
    }
    setHoveredNode(found);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom on wheel towards cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.2, Math.min(5.0, zoom * zoomFactor));

    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom)
    });
    setZoom(newZoom);
  };

  // Node Click Selection / Supernode Double Click
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - pan.x) / zoom;
    const clickY = (e.clientY - rect.top - pan.y) / zoom;

    for (const node of displayNodes) {
      const pos = nodePositions.get(node.acct_no);
      if (!pos) continue;
      const dist = Math.hypot(pos.x - clickX, pos.y - clickY);
      if (dist <= pos.r + 5) {
        if (node.isSupernode && onToggleClustering) {
          onToggleClustering();
        } else {
          onSelectNode(node);
        }
        return;
      }
    }
    // Click on empty canvas clears selection
    onSelectNode(null);
  };

  const handleDoubleClick = () => {
    if (hoveredNode && hoveredNode.isSupernode && onToggleClustering) {
      onToggleClustering();
    }
  };

  const handleZoomIn = () => setZoom(z => Math.min(5.0, z * 1.25));
  const handleZoomOut = () => setZoom(z => Math.max(0.2, z / 1.25));
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: isExpanded ? '780px' : '560px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        background: '#FFFFFF',
        userSelect: 'none',
        transition: 'height 0.25s ease'
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: isDragging ? 'grabbing' : hoveredNode ? 'pointer' : 'grab'
        }}
      />

      {/* Floating Controls Overlay */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '6px 10px',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(4px)'
      }}>
        {/* Supernode Clustering Toggle Button */}
        {onToggleClustering && (
          <button
            onClick={onToggleClustering}
            title={clustersCollapsed ? "Expand All Mule Rings" : "Collapse into Supernodes"}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: clustersCollapsed ? 'var(--primary-light)' : '#FFFFFF',
              fontSize: '11px',
              fontWeight: 600,
              color: clustersCollapsed ? 'var(--primary)' : 'var(--text)'
            }}
          >
            <Layers size={14} />
            <span>{clustersCollapsed ? 'Mule Rings Collapsed' : 'Collapse Mule Rings'}</span>
          </button>
        )}

        <button
          onClick={fitToView}
          title="Fit All Nodes in View"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            backgroundColor: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text)'
          }}
        >
          <Scan size={14} color="var(--primary)" />
          <span>Fit View</span>
        </button>

        <button
          onClick={handleZoomIn}
          title="Zoom In"
          style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF' }}
        >
          <ZoomIn size={14} color="var(--text)" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF' }}
        >
          <ZoomOut size={14} color="var(--text)" />
        </button>
        <button
          onClick={handleReset}
          title="Reset to 100%"
          style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF' }}
        >
          <RotateCcw size={14} color="var(--text)" />
        </button>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border)', margin: '0 4px' }} />

        <button
          onClick={() => {
            setIsExpanded(!isExpanded);
            setTimeout(fitToView, 100);
          }}
          title={isExpanded ? "Collapse Canvas" : "Expand Full View (780px)"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            backgroundColor: isExpanded ? 'var(--primary-light)' : '#FFFFFF',
            fontSize: '11px',
            fontWeight: 600,
            color: isExpanded ? 'var(--primary)' : 'var(--text)'
          }}
        >
          {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
        </button>

        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '4px' }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Scale & FPS Badge */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        padding: '6px 12px',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <Sparkles size={13} color="var(--primary)" />
        <span>Rendering: <strong>{displayNodes.length} Accounts</strong> · <strong>{displayEdges.length} Flows</strong> (Sugiyama DAG · 60 FPS)</span>
        <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>• Drag to pan · Scroll to zoom · Double-click Supernode to expand</span>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredNode && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '11px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          pointerEvents: 'none',
          zIndex: 20
        }}>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{hoveredNode.acct_no}</div>
          <div style={{ color: '#94A3B8' }}>{hoveredNode.bank} · Hop {hoveredNode.hop} ({hoveredNode.layer})</div>
          {hoveredNode.isSupernode && (
            <div style={{ color: '#818CF8', fontWeight: 700 }}>
              Grouped Mule Ring ({hoveredNode.subNodeCount} Connected Accounts) - Double-click to expand
            </div>
          )}
          {hoveredNode.held_paise > 0 && (
            <div style={{ color: '#4ADE80', fontWeight: 700 }}>
              Recoverable Funds: ₹{(hoveredNode.held_paise / 100).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
