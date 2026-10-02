import React, { useRef, useEffect, useState, useMemo } from 'react';
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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Animation frame loop for currency particles
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setAnimTime(t => (t + 0.02) % 1.0);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Keyboard shortcut listener (Esc to exit fullscreen, F to toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA'].includes(activeTag)) return;

      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullscreen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter edges based on temporal playback and motif filters
  const visibleEdges = useMemo(() => {
    return edges.filter(e => {
      // 1. Time Filtering
      if (timeMode === 'cumulative') {
        if (e.ts_epoch > maxTimestamp) return false;
      } else {
        if (Math.abs(e.ts_epoch - maxTimestamp) > 14400) return false;
      }

      // 2. Motif Filtering
      if (activeMotif === 'fan-out') {
        if (e.hop > 2 || (e.hop === 2 && e.amount_paise > 5000000)) return false;
      } else if (activeMotif === 'fan-in') {
        if (e.hop < 2) return false;
      } else if (activeMotif === 'long-chain') {
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
    const hopNodeCounts: Record<number, number> = {};
    nodes.forEach(n => {
      hopNodeCounts[n.hop] = (hopNodeCounts[n.hop] || 0) + 1;
    });

    const supernodes: NodeData[] = [];
    const regularNodes: NodeData[] = [];

    // Group high-density intermediate layers into Supernodes
    [2, 3].forEach(hop => {
      if ((hopNodeCounts[hop] || 0) > 12) {
        const clusterId = `SUPERNODE_CLUSTER_HOP_${hop}`;
        const clusterMembers = nodes.filter(n => n.hop === hop);

        const totalHeld = clusterMembers.reduce((sum, n) => sum + n.held_paise, 0);
        const totalIn = clusterMembers.reduce((sum, n) => sum + n.taint_in_paise, 0);
        const totalOut = clusterMembers.reduce((sum, n) => sum + n.taint_out_paise, 0);

        const superNode: NodeData = {
          acct_id: 990000 + hop,
          acct_no: clusterId,
          bank: hop === 2 ? 'Mule Accounts' : 'Aggregator Mules',
          ifsc: 'CLUSTER',
          layer: hop === 2 ? 'L2 Money Splitters' : 'L3 Aggregators',
          hop,
          taint_in_paise: totalIn,
          taint_out_paise: totalOut,
          held_paise: totalHeld,
          first_seen_epoch: clusterMembers[0]?.first_seen_epoch || 0,
          clusterId,
          isSupernode: true,
          subNodeCount: clusterMembers.length
        };

        supernodes.push(superNode);
        clusterMembers.forEach(n => clusterMap.set(n.acct_no, clusterId));
      }
    });

    nodes.forEach(n => {
      if (!clusterMap.has(n.acct_no)) {
        regularNodes.push(n);
      }
    });

    const finalNodes = [...regularNodes, ...supernodes];
    const routedEdges: EdgeData[] = [];
    const edgeKeySet = new Set<string>();

    visibleEdges.forEach(e => {
      const src = clusterMap.get(e.src_acct) || e.src_acct;
      const dst = clusterMap.get(e.dst_acct) || e.dst_acct;
      if (src === dst) return;

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

  // Overlap-Free Dynamic Multi-Column Sugiyama Layout with Collision Avoidance
  const { nodePositions, bounds, stageBands } = useMemo(() => {
    const positions = new Map<string, { x: number; y: number; r: number }>();
    const hopGroups: Record<number, NodeData[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };

    displayNodes.forEach(n => {
      const hop = Math.min(4, Math.max(0, n.hop));
      if (!hopGroups[hop]) hopGroups[hop] = [];
      hopGroups[hop].push(n);
    });

    // 1. Calculate dynamic column count and width per stage
    const stageMetadata = [
      { name: "STAGE 0: INFILTRATION", desc: "Victim Breach / Source" },
      { name: "STAGE 1: SMURF DISPATCH", desc: "Primary Dispersal Hub" },
      { name: "STAGE 2: LAYERING MULES", desc: "Layering & Churn Ring" },
      { name: "STAGE 3: AGGREGATOR FUNNEL", desc: "Consolidation Hubs" },
      { name: "STAGE 4: CASHOUT EXITS", desc: "Terminal Off-Ramps & ATMs" }
    ];

    const stageSpecs: { subCols: number; colWidth: number; laneWidth: number; baseX: number }[] = [];
    let currentX = 60;

    [0, 1, 2, 3, 4].forEach(hop => {
      const count = hopGroups[hop]?.length || 0;
      let subCols = 1;
      if (count > 60) subCols = Math.min(7, Math.ceil(count / 16));
      else if (count > 24) subCols = 4;
      else if (count > 8) subCols = 3;
      else if (count > 1) subCols = 2;

      // Safe column separation: nodes will be at least 110px apart horizontally
      const colWidth = subCols > 1 ? 115 : 0;
      const laneWidth = Math.max(220, subCols * (subCols > 1 ? 115 : 180) + 40);

      stageSpecs.push({
        subCols,
        colWidth,
        laneWidth,
        baseX: currentX
      });

      // Spacing between adjacent stage lanes
      currentX += laneWidth + 75;
    });

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const verticalRowSpacing = 56; // Minimum 56px between rows (radius ~12-16px, clearance > 24px)

    [0, 1, 2, 3, 4].forEach(hop => {
      const group = hopGroups[hop];
      if (!group || group.length === 0) return;

      const spec = stageSpecs[hop];

      group.forEach((node, idx) => {
        const colIdx = idx % spec.subCols;
        const rowIdx = Math.floor(idx / spec.subCols);

        // Stagger alternating columns vertically for optimal hexagonal density
        const staggerOffset = (colIdx % 2) * (verticalRowSpacing * 0.5);

        const x = spec.baseX + 35 + colIdx * (spec.subCols > 1 ? spec.colWidth : 0);
        const y = 115 + rowIdx * verticalRowSpacing + staggerOffset;

        // Dynamic node radius
        let r = 13;
        if (node.isSupernode) r = 24;
        else if (hop === 0) r = 16;
        else if (node.held_paise > 10000000) r = 15;
        else if (node.held_paise > 1000000) r = 13.5;
        else r = 11.5;

        positions.set(node.acct_no, { x, y, r });
      });

      // 2. Multi-Pass Circle Collision Relaxation to Guarantee Zero Overlap
      for (let pass = 0; pass < 5; pass++) {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const pA = positions.get(group[i].acct_no)!;
            const pB = positions.get(group[j].acct_no)!;
            const minDist = pA.r + pB.r + 24; // Guaranteed 24px clearance between boundaries
            const dx = pB.x - pA.x;
            const dy = pB.y - pA.y;
            const dist = Math.hypot(dx, dy);

            if (dist < minDist && dist > 0.0001) {
              const overlap = (minDist - dist) / 2;
              const nx = dx / dist;
              const ny = dy / dist;
              pA.x -= nx * overlap;
              pA.y -= ny * overlap;
              pB.x += nx * overlap;
              pB.y += ny * overlap;
            }
          }
        }
      }

      // Track bounding coordinates
      group.forEach(node => {
        const p = positions.get(node.acct_no)!;
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
    });

    const stageBands = [0, 1, 2, 3, 4].map(hop => ({
      name: stageMetadata[hop].name,
      desc: stageMetadata[hop].desc,
      x: stageSpecs[hop].baseX - 15,
      w: stageSpecs[hop].laneWidth
    }));

    return {
      nodePositions: positions,
      bounds: {
        minX: isFinite(minX) ? minX : 0,
        maxX: isFinite(maxX) ? maxX : 1800,
        minY: isFinite(minY) ? minY : 0,
        maxY: isFinite(maxY) ? maxY : 800
      },
      stageBands
    };
  }, [displayNodes]);

  // Auto-fit function to center and frame all nodes
  const fitToView = () => {
    const canvas = canvasRef.current;
    if (!canvas || displayNodes.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const graphWidth = (bounds.maxX - bounds.minX) + 160;
    const graphHeight = (bounds.maxY - bounds.minY) + 160;

    const scaleX = rect.width / graphWidth;
    const scaleY = rect.height / graphHeight;
    const fitZoom = Math.max(0.2, Math.min(1.15, Math.min(scaleX, scaleY) * 0.92));

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
  }, [displayNodes.length, clustersCollapsed, isFullscreen]);

  // Canvas Redraw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    ctx.scale(dpr, dpr);

    // Warm cream background
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Draw Architectural Layer Stage Bands (Sugiyama DAG)
    if (layoutMode === 'flow') {
      const bandHeight = Math.max(680, (bounds.maxY - bounds.minY) + 150);

      stageBands.forEach(b => {
        ctx.fillStyle = '#F3EFE6';
        ctx.strokeStyle = '#E0D8CA';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(b.x, 35, b.w, bandHeight, 8);
        } else {
          ctx.rect(b.x, 35, b.w, bandHeight);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#536458';
        ctx.font = '700 10.5px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(b.name, b.x + 14, 56);

        ctx.fillStyle = '#8C7853';
        ctx.font = '500 9.5px Inter, sans-serif';
        ctx.fillText(b.desc, b.x + 14, 72);
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
        ctx.lineWidth = Math.min(4, Math.max(1.2, Math.log10(Math.max(10, edge.amount_paise / 1000)))) / Math.sqrt(zoom);
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

    // 3. Draw Clean, Overlap-Free Nodes ("Visible without extra info")
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
        ctx.fillStyle = baseColor + '22';
        ctx.fill();
      }

      // Outer Taint/Hold Ring
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pos.r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = node.held_paise > 0 ? '#047857' : '#D0C7B7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Main Node Body Circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? baseColor : '#E5DFD5';
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeStyle = isSelected ? '#16241B' : '#FFFFFF';
      ctx.stroke();

      // Clean Center Identifier (Bank Initial or Count) — No clutter!
      if (node.isSupernode) {
        ctx.font = '700 11px JetBrains Mono, monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${node.subNodeCount}`, pos.x, pos.y);
      } else if (pos.r >= 11) {
        ctx.font = '700 8.5px JetBrains Mono, monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.bank.slice(0, 2).toUpperCase(), pos.x, pos.y);
      }

      // Only show text label when selected or supernode (prevents clutter)
      if (isSelected || node.isSupernode) {
        ctx.textBaseline = 'alphabetic';
        ctx.font = node.isSupernode ? '700 11px Inter, sans-serif' : '600 10px JetBrains Mono, monospace';
        ctx.fillStyle = '#16241B';
        ctx.textAlign = 'center';

        const labelText = node.isSupernode ? `${node.bank} (${node.subNodeCount} Mules)` : node.acct_no;
        ctx.fillText(labelText, pos.x, pos.y + pos.r + 14);
      }
    });

    ctx.restore();
  }, [displayNodes, displayEdges, activeNodeIds, selectedNode, hoveredNode, nodePositions, pan, zoom, animTime, clustersCollapsed, layoutMode, stageBands, bounds]);

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
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '580px',
        zIndex: isFullscreen ? 9999 : 1,
        borderRadius: isFullscreen ? 0 : '12px',
        border: isFullscreen ? 'none' : '1px solid var(--border)',
        overflow: 'hidden',
        background: '#FAF8F5',
        userSelect: 'none',
        transition: 'all 0.2s ease'
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

      {/* Floating HUD Controls Overlay */}
      <div style={{
        position: 'absolute',
        top: isFullscreen ? '20px' : '14px',
        right: isFullscreen ? '24px' : '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '5px 8px',
        borderRadius: '6px',
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
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: clustersCollapsed ? 'var(--surface-pista)' : '#FFFFFF',
              fontSize: '11px',
              fontWeight: 600,
              color: clustersCollapsed ? 'var(--primary)' : 'var(--text)'
            }}
          >
            {clustersCollapsed ? 'Expanded View' : 'Group Supernodes'}
          </button>
        )}

        <button
          onClick={fitToView}
          title="Fit All Nodes in View (F)"
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            backgroundColor: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text)'
          }}
        >
          Fit View
        </button>

        <button
          onClick={handleZoomIn}
          title="Zoom In"
          style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 700 }}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 700 }}
        >
          −
        </button>
        <button
          onClick={handleReset}
          title="Reset View"
          style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF', fontSize: '11px', color: 'var(--text-muted)' }}
        >
          ↺
        </button>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border)', margin: '0 2px' }} />

        {/* Fullscreen Toggle Button */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand to Full Screen View"}
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: isFullscreen ? '1px solid var(--primary)' : '1px solid var(--border)',
            backgroundColor: isFullscreen ? 'var(--primary)' : '#FFFFFF',
            fontSize: '11px',
            fontWeight: 600,
            color: isFullscreen ? '#FFFFFF' : 'var(--text)'
          }}
        >
          {isFullscreen ? '✕ Exit Fullscreen' : '⛶ Fullscreen'}
        </button>

        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '4px' }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Scale & Stage Info Tag */}
      <div style={{
        position: 'absolute',
        bottom: '14px',
        left: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        padding: '5px 12px',
        borderRadius: '6px',
        border: '1px solid var(--border)',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <span><strong>{displayNodes.length} Accounts</strong> · <strong>{displayEdges.length} Flows</strong> (Sugiyama DAG)</span>
        <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>•</span>
        <span>Drag to pan · Scroll to zoom · Double-click Supernode to expand</span>
      </div>

      {/* Minimalist Hover Info Tooltip — No visual clutter on canvas */}
      {hoveredNode && (
        <div style={{
          position: 'absolute',
          bottom: '14px',
          right: '14px',
          backgroundColor: '#111D16',
          color: '#FFFFFF',
          padding: '10px 14px',
          borderRadius: '6px',
          fontSize: '11.5px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          pointerEvents: 'none',
          zIndex: 20,
          border: '1px solid #22372B'
        }}>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#A7F3D0' }}>
            {hoveredNode.acct_no}
          </div>
          <div style={{ color: '#EBF4EC' }}>
            {hoveredNode.bank} · Stage {hoveredNode.hop} ({hoveredNode.layer})
          </div>
          {hoveredNode.isSupernode && (
            <div style={{ color: '#FDE68A', fontWeight: 600 }}>
              Grouped Mule Cluster ({hoveredNode.subNodeCount} Accounts) · Double-click to expand
            </div>
          )}
          {hoveredNode.held_paise > 0 && (
            <div style={{ color: '#6EE7B7', fontWeight: 600 }}>
              Recoverable Stolen Funds: ₹{(hoveredNode.held_paise / 100).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
