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
  clustersCollapsed = true,
  onToggleClustering,
  isolatedPathNodeIds = null,
  layoutMode = 'flow'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan & Zoom
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 60, y: 50 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [animTime, setAnimTime] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [edgeViewMode, setEdgeViewMode] = useState<'focused' | 'all'>('focused');

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

  // Window resize handler with initial mount sizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter edges based on temporal slider, active motifs, and isolation
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

  // Intelligent Supernode Clustering (Eliminates the 500-node hairball)
  const { displayNodes, displayEdges, clusterMap } = useMemo(() => {
    if (!clustersCollapsed) {
      return {
        displayNodes: nodes,
        displayEdges: visibleEdges,
        clusterMap: new Map<string, string>()
      };
    }

    const cMap = new Map<string, string>();
    const hopNodeCounts: Record<number, number> = {};
    nodes.forEach(n => {
      hopNodeCounts[n.hop] = (hopNodeCounts[n.hop] || 0) + 1;
    });

    const supernodes: NodeData[] = [];
    const regularNodes: NodeData[] = [];

    // Group dense intermediate layering stages into structured regional/bank mule rings
    [2, 3].forEach(hop => {
      const hopNodes = nodes.filter(n => n.hop === hop);
      if (hopNodes.length > 10) {
        // Group by bank or sub-clusters of ~25 accounts to make multiple manageable clusters
        const clusterSize = 25;
        const numClusters = Math.ceil(hopNodes.length / clusterSize);

        for (let c = 0; c < numClusters; c++) {
          const slice = hopNodes.slice(c * clusterSize, (c + 1) * clusterSize);
          const clusterId = `SUPERNODE_HOP${hop}_C${c + 1}`;
          const primaryBank = slice[0]?.bank || 'Mule Ring';

          const totalHeld = slice.reduce((sum, n) => sum + n.held_paise, 0);
          const totalIn = slice.reduce((sum, n) => sum + n.taint_in_paise, 0);
          const totalOut = slice.reduce((sum, n) => sum + n.taint_out_paise, 0);

          const sn: NodeData = {
            acct_id: 990000 + hop * 100 + c,
            acct_no: clusterId,
            bank: `${primaryBank} Ring #${c + 1}`,
            ifsc: 'CLUSTER',
            layer: hop === 2 ? 'L2 Layering Ring' : 'L3 Aggregator Pool',
            hop,
            taint_in_paise: totalIn,
            taint_out_paise: totalOut,
            held_paise: totalHeld,
            first_seen_epoch: slice[0]?.first_seen_epoch || 0,
            clusterId,
            isSupernode: true,
            subNodeCount: slice.length
          };

          supernodes.push(sn);
          slice.forEach(n => cMap.set(n.acct_no, clusterId));
        }
      }
    });

    nodes.forEach(n => {
      if (!cMap.has(n.acct_no)) {
        regularNodes.push(n);
      }
    });

    const finalNodes = [...regularNodes, ...supernodes];
    const routedEdges: EdgeData[] = [];
    const edgeKeySet = new Set<string>();

    visibleEdges.forEach(e => {
      const src = cMap.get(e.src_acct) || e.src_acct;
      const dst = cMap.get(e.dst_acct) || e.dst_acct;
      if (src === dst) return; // Hide internal cluster loop churn

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
      clusterMap: cMap
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

  // Compute nodes connected to the currently selected or hovered node (for clean focus routing)
  const focusedNodeConnections = useMemo(() => {
    const activeTarget = selectedNode || hoveredNode;
    if (!activeTarget) return null;

    const targetAcct = clusterMap.get(activeTarget.acct_no) || activeTarget.acct_no;
    const connectedNodeIds = new Set<string>([targetAcct]);
    const directEdgeIds = new Set<string>();

    displayEdges.forEach(e => {
      if (e.src_acct === targetAcct) {
        connectedNodeIds.add(e.dst_acct);
        directEdgeIds.add(`${e.src_acct}->${e.dst_acct}`);
      } else if (e.dst_acct === targetAcct) {
        connectedNodeIds.add(e.src_acct);
        directEdgeIds.add(`${e.src_acct}->${e.dst_acct}`);
      }
    });

    return { connectedNodeIds, directEdgeIds, targetAcct };
  }, [selectedNode, hoveredNode, displayEdges, clusterMap]);

  // Overlap-Free Dynamic Grid Layout Engine (Strict Collision Avoidance)
  const { nodePositions, bounds, stageLanes } = useMemo(() => {
    const positions = new Map<string, { x: number; y: number; r: number; bankCode: string }>();
    const hopGroups: Record<number, NodeData[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };

    displayNodes.forEach(n => {
      const hop = Math.min(4, Math.max(0, n.hop));
      if (!hopGroups[hop]) hopGroups[hop] = [];
      hopGroups[hop].push(n);
    });

    const stageMeta = [
      { name: "STAGE 0: INFILTRATION", desc: "Victim Breach Source" },
      { name: "STAGE 1: SMURF DISPATCH", desc: "Primary Splitter Hub" },
      { name: "STAGE 2: LAYERING MULES", desc: "Layering & Churn Rings" },
      { name: "STAGE 3: AGGREGATOR FUNNEL", desc: "Consolidation Accounts" },
      { name: "STAGE 4: CASHOUT EXITS", desc: "Terminal Off-Ramps & ATMs" }
    ];

    // Compute generous stage lane dimensions based on node count
    const laneConfigs: { subCols: number; colSpacing: number; laneWidth: number; startX: number }[] = [];
    let cumulativeX = 80;

    [0, 1, 2, 3, 4].forEach(hop => {
      const count = hopGroups[hop]?.length || 0;
      let subCols = 1;

      if (count > 80) subCols = 5;
      else if (count > 36) subCols = 4;
      else if (count > 14) subCols = 3;
      else if (count > 3) subCols = 2;

      // Safe clearance: each column is spaced 140px apart horizontally
      const colSpacing = subCols > 1 ? 140 : 0;
      const laneWidth = Math.max(240, subCols * 140 + 80);

      laneConfigs.push({
        subCols,
        colSpacing,
        laneWidth,
        startX: cumulativeX
      });

      // Space between lanes: 90px clear corridor for inter-stage conduit flow
      cumulativeX += laneWidth + 90;
    });

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const rowSpacing = 72; // Safe vertical spacing: 72px (radius ~14px, clearance > 44px)

    [0, 1, 2, 3, 4].forEach(hop => {
      const group = hopGroups[hop];
      if (!group || group.length === 0) return;

      const conf = laneConfigs[hop];

      group.forEach((node, idx) => {
        const colIdx = idx % conf.subCols;
        const rowIdx = Math.floor(idx / conf.subCols);

        // Hexagonal stagger: alternate columns vertically by half a row
        const stagger = (colIdx % 2) * (rowSpacing * 0.5);

        const x = conf.startX + 50 + colIdx * (conf.subCols > 1 ? conf.colSpacing : 0);
        const y = 130 + rowIdx * rowSpacing + stagger;

        // Radius
        let r = 14;
        if (node.isSupernode) r = 26;
        else if (hop === 0) r = 18;
        else if (node.held_paise > 10000000) r = 16;
        else if (node.held_paise > 1000000) r = 15;
        else r = 13;

        const bankCode = node.isSupernode
          ? `${node.subNodeCount}`
          : (node.bank ? node.bank.slice(0, 2).toUpperCase() : 'AC');

        positions.set(node.acct_no, { x, y, r, bankCode });
      });

      // Pairwise collision repulsion pass to ensure mathematical non-overlap
      for (let pass = 0; pass < 6; pass++) {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const pA = positions.get(group[i].acct_no)!;
            const pB = positions.get(group[j].acct_no)!;
            const minDist = pA.r + pB.r + 32; // Strict 32px clear margin
            const dx = pB.x - pA.x;
            const dy = pB.y - pA.y;
            const dist = Math.hypot(dx, dy);

            if (dist < minDist && dist > 0.0001) {
              const push = (minDist - dist) / 2;
              const nx = dx / dist;
              const ny = dy / dist;
              pA.x -= nx * push;
              pA.y -= ny * push;
              pB.x += nx * push;
              pB.y += ny * push;
            }
          }
        }
      }

      // Record bounds
      group.forEach(node => {
        const p = positions.get(node.acct_no)!;
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
    });

    const stageLanes = [0, 1, 2, 3, 4].map(hop => ({
      name: stageMeta[hop].name,
      desc: stageMeta[hop].desc,
      x: laneConfigs[hop].startX - 20,
      w: laneConfigs[hop].laneWidth
    }));

    return {
      nodePositions: positions,
      bounds: {
        minX: isFinite(minX) ? minX : 0,
        maxX: isFinite(maxX) ? maxX : 2000,
        minY: isFinite(minY) ? minY : 0,
        maxY: isFinite(maxY) ? maxY : 850
      },
      stageLanes
    };
  }, [displayNodes]);

  // Auto-fit function to center and frame all nodes
  const fitToView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || displayNodes.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const graphWidth = (bounds.maxX - bounds.minX) + 180;
    const graphHeight = (bounds.maxY - bounds.minY) + 180;

    const scaleX = rect.width / graphWidth;
    const scaleY = rect.height / graphHeight;
    const fitZoom = Math.max(0.18, Math.min(1.1, Math.min(scaleX, scaleY) * 0.92));

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    setZoom(fitZoom);
    setPan({
      x: rect.width / 2 - centerX * fitZoom,
      y: rect.height / 2 - centerY * fitZoom
    });
  }, [displayNodes.length, bounds]);

  useEffect(() => {
    if (displayNodes.length > 0) {
      const timer = setTimeout(fitToView, 60);
      return () => clearTimeout(timer);
    }
  }, [displayNodes.length, clustersCollapsed, isFullscreen, fitToView]);

  // Main Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    }
    // Reset transform to DPR on each frame to prevent exponential scaling accumulation
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Warm ivory background
    ctx.fillStyle = '#FBF7F0';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Draw Architectural Layer Stage Bands (Sugiyama DAG Lanes)
    if (layoutMode === 'flow') {
      const bandHeight = Math.max(720, (bounds.maxY - bounds.minY) + 180);

      stageLanes.forEach(lane => {
        ctx.fillStyle = '#F5EEE5';
        ctx.strokeStyle = '#E8D8C3';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(lane.x, 35, lane.w, bandHeight, 10);
        } else {
          ctx.rect(lane.x, 35, lane.w, bandHeight);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#34271E';
        ctx.font = '700 11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(lane.name, lane.x + 16, 58);

        ctx.fillStyle = '#8C7764';
        ctx.font = '500 10px Inter, sans-serif';
        ctx.fillText(lane.desc, lane.x + 16, 75);
      });
    }

    // 2. Intelligent Edge Rendering (Eliminates the Black/Red Hairball Wall)
    const isFocusActive = focusedNodeConnections !== null;

    displayEdges.forEach((edge, edgeIdx) => {
      const p1 = nodePositions.get(edge.src_acct);
      const p2 = nodePositions.get(edge.dst_acct);
      if (!p1 || !p2) return;

      const edgeKey = `${edge.src_acct}->${edge.dst_acct}`;
      const isDirectlyFocused = isFocusActive && focusedNodeConnections.directEdgeIds.has(edgeKey);
      const isTainted = edge.taint_paise > 0;

      // In 'focused' mode when a node is hovered/selected, dim irrelevant edges to 8% opacity!
      if (edgeViewMode === 'focused' && isFocusActive && !isDirectlyFocused) {
        ctx.strokeStyle = 'rgba(211, 226, 211, 0.25)';
        ctx.lineWidth = 0.8 / Math.sqrt(zoom);
      } else if (isDirectlyFocused) {
        // High-contrast illuminated focused path (monochromatic sage/terracotta-rose)
        ctx.strokeStyle = isTainted ? '#7D4747' : '#2B583E';
        ctx.lineWidth = 3.5 / Math.sqrt(zoom);
      } else if (isTainted) {
        // Normal tainted path
        ctx.strokeStyle = isFocusActive ? 'rgba(125, 71, 71, 0.2)' : 'rgba(125, 71, 71, 0.7)';
        ctx.lineWidth = Math.min(3.5, Math.max(1.2, Math.log10(Math.max(10, edge.amount_paise / 1000)))) / Math.sqrt(zoom);
      } else {
        // Neutral background flow
        ctx.strokeStyle = 'rgba(186, 205, 186, 0.35)';
        ctx.lineWidth = 1 / Math.sqrt(zoom);
      }

      ctx.beginPath();
      // Smooth horizontal Cubic Bezier curve
      const dx = (p2.x - p1.x) * 0.5;
      ctx.moveTo(p1.x, p1.y);
      ctx.bezierCurveTo(p1.x + dx, p1.y, p2.x - dx, p2.y, p2.x, p2.y);
      ctx.stroke();

      // Fluid Currency Particles (Render on focused path or primary flows)
      const renderParticle = isDirectlyFocused || (!isFocusActive && isTainted && (edgeIdx % 3 === 0 || edge.taint_paise > 5000000));
      if (renderParticle) {
        const t = (animTime + ((edgeIdx * 19) % 100) / 100) % 1.0;
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const cp1x = p1.x + dx;
        const cp2x = p2.x - dx;
        const px = uu * u * p1.x + 3 * uu * t * cp1x + 3 * u * tt * cp2x + tt * t * p2.x;
        const py = uu * u * p1.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p2.y;

        ctx.fillStyle = isDirectlyFocused ? '#2B583E' : '#7D4747';
        ctx.beginPath();
        ctx.arc(px, py, (isDirectlyFocused ? 4 : 2.5) / Math.sqrt(zoom), 0, Math.PI * 2);
        ctx.fill();
      }

      // Small directional indicator arrow on focused edges
      if (isDirectlyFocused || (!isFocusActive && edge.amount_paise > 2000000)) {
        const arrowT = 0.65;
        const u = 1 - arrowT;
        const cp1x = p1.x + dx;
        const cp2x = p2.x - dx;
        const ax = u * u * u * p1.x + 3 * u * u * arrowT * cp1x + 3 * u * arrowT * arrowT * cp2x + arrowT * arrowT * arrowT * p2.x;
        const ay = u * u * u * p1.y + 3 * u * u * arrowT * p1.y + 3 * u * arrowT * arrowT * p2.y + arrowT * arrowT * arrowT * p2.y;

        ctx.fillStyle = isDirectlyFocused ? '#2B583E' : '#779380';
        ctx.beginPath();
        ctx.arc(ax, ay, 2.5 / Math.sqrt(zoom), 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 3. Draw Clean Overlap-Free Nodes
    displayNodes.forEach(node => {
      const pos = nodePositions.get(node.acct_no);
      if (!pos) return;

      // Viewport culling
      const screenX = pos.x * zoom + pan.x;
      const screenY = pos.y * zoom + pan.y;
      if (screenX < -90 || screenX > rect.width + 90 || screenY < -90 || screenY > rect.height + 90) {
        return;
      }

      const isTarget = focusedNodeConnections?.targetAcct === node.acct_no;
      const isConnected = isFocusActive && focusedNodeConnections.connectedNodeIds.has(node.acct_no);
      const isDimmed = isFocusActive && !isConnected && edgeViewMode === 'focused';

      // Monochromatic Pastel Node Progression
      let baseColor = '#2B583E'; // L1 Deep Sage
      if (node.isSupernode) baseColor = '#2B583E'; // Supernode
      else if (node.hop === 0) baseColor = '#547361'; // Victim (Misty Sage)
      else if (node.hop === 1) baseColor = '#2A5A40'; // L1 Smurfing Dispatch (Pastel Deep Mint)
      else if (node.hop === 2) baseColor = '#3E6D52'; // L2 Layering Mule (Pastel Laurel)
      else if (node.hop === 3) baseColor = '#59836B'; // L3 Aggregator (Pastel Celadon)
      else baseColor = '#203A2B'; // L4 Cashout Exit (Pastel Forest Slate)

      // Supernode Outer Dashed Ring
      if (node.isSupernode) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = isDimmed ? 'rgba(70, 116, 85, 0.3)' : '#467455';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.r + 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Outer focus halo
      if (isTarget) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.r + 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(43, 88, 62, 0.25)';
        ctx.fill();
      }

      // Outer Taint/Hold Ring
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pos.r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = isDimmed
        ? 'rgba(186, 205, 186, 0.3)'
        : (node.held_paise > 0 ? '#286641' : '#BACDBA');
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Main Node Circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
      ctx.fillStyle = isDimmed ? 'rgba(226, 236, 226, 0.5)' : baseColor;
      ctx.fill();
      ctx.lineWidth = isTarget ? 3 : 1.5;
      ctx.strokeStyle = isTarget ? '#142419' : '#FFFFFF';
      ctx.stroke();

      // Center Bank Initial / Supernode Count (Clean, No Clutter!)
      ctx.font = node.isSupernode ? '700 11px JetBrains Mono, monospace' : '700 9px JetBrains Mono, monospace';
      ctx.fillStyle = isDimmed ? 'rgba(255, 255, 255, 0.5)' : '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pos.bankCode, pos.x, pos.y);

      // Elevated Account Label (Shown when selected, hovered, or supernode)
      if (isTarget || node.isSupernode) {
        ctx.textBaseline = 'alphabetic';
        ctx.font = node.isSupernode ? '700 11px Inter, sans-serif' : '700 10.5px JetBrains Mono, monospace';
        ctx.fillStyle = '#142419';
        ctx.textAlign = 'center';

        const labelText = node.isSupernode ? node.bank : node.acct_no;
        ctx.fillText(labelText, pos.x, pos.y + pos.r + 14);
      }
    });

    ctx.restore();
  }, [displayNodes, displayEdges, activeNodeIds, nodePositions, pan, zoom, animTime, clustersCollapsed, layoutMode, stageLanes, bounds, focusedNodeConnections, edgeViewMode]);

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

    // Hover detection
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    let found: NodeData | null = null;
    for (const node of displayNodes) {
      const pos = nodePositions.get(node.acct_no);
      if (!pos) continue;
      const dist = Math.hypot(pos.x - mouseX, pos.y - mouseY);
      if (dist <= pos.r + 6) {
        found = node;
        break;
      }
    }
    setHoveredNode(found);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom towards cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.18, Math.min(4.5, zoom * zoomFactor));

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
      if (dist <= pos.r + 6) {
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

  return (
    <div
      ref={containerRef}
      style={{
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '620px',
        zIndex: isFullscreen ? 9999 : 1,
        borderRadius: isFullscreen ? 0 : '12px',
        border: isFullscreen ? 'none' : '1px solid var(--border)',
        overflow: 'hidden',
        background: 'var(--bg)',
        userSelect: 'none',
        boxShadow: isFullscreen ? 'none' : 'var(--shadow-sm)'
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

      {/* Floating HUD Controls Overlay (Clean, Elegant Government Intelligence Style) */}
      <div style={{
        position: 'absolute',
        top: isFullscreen ? '20px' : '14px',
        right: isFullscreen ? '24px' : '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        padding: '5px 8px',
        borderRadius: '6px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(4px)'
      }}>
        {/* Focused Flow vs All Edges Filter */}
        <button
          onClick={() => setEdgeViewMode(edgeViewMode === 'focused' ? 'all' : 'focused')}
          title={edgeViewMode === 'focused' ? "Showing Clean Focused Paths (Click to show all raw edges)" : "Showing All Edges (Click to show clean focused paths)"}
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            backgroundColor: edgeViewMode === 'focused' ? 'var(--surface-pista)' : '#FFFFFF',
            fontSize: '11px',
            fontWeight: 600,
            color: edgeViewMode === 'focused' ? 'var(--primary)' : 'var(--text)'
          }}
        >
          {edgeViewMode === 'focused' ? '✓ Focused Trails' : 'All Edges'}
        </button>

        {/* Supernodes Toggle Button */}
        {onToggleClustering && (
          <button
            onClick={onToggleClustering}
            title={clustersCollapsed ? "Expand All Mule Rings" : "Cluster Dense Mule Rings into Supernodes"}
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
            {clustersCollapsed ? 'Rings Grouped' : 'Expand All'}
          </button>
        )}

        <button
          onClick={fitToView}
          title="Fit All Nodes in View (F)"
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            backgroundColor: '#F5EEE5',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text)'
          }}
        >
          Fit View
        </button>

        <button
          onClick={() => setZoom(z => Math.min(4.5, z * 1.25))}
          title="Zoom In"
          style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#F5EEE5', fontSize: '12px', fontWeight: 700 }}
        >
          +
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.18, z / 1.25))}
          title="Zoom Out"
          style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#F5EEE5', fontSize: '12px', fontWeight: 700 }}
        >
          −
        </button>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border)', margin: '0 2px' }} />

        {/* Fullscreen Button */}
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
          {isFullscreen ? '✕ Exit [Esc]' : '⛶ Fullscreen'}
        </button>

        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '4px' }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Scale & Stage Information Bar */}
      <div style={{
        position: 'absolute',
        bottom: '14px',
        left: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '5px 12px',
        borderRadius: '6px',
        border: '1px solid var(--border)',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <span><strong>{displayNodes.length} Accounts</strong> · <strong>{displayEdges.length} Flows</strong> (Sugiyama DAG)</span>
        <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>•</span>
        <span>Hover node to illuminate connected trail · Double-click cluster to expand</span>
      </div>

      {/* Floating Tooltip — Completely clean, no on-canvas text collisions */}
      {hoveredNode && (
        <div style={{
          position: 'absolute',
          bottom: '14px',
          right: '14px',
          backgroundColor: '#111D16',
          color: '#FBF7F0',
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
              Grouped Mule Ring ({hoveredNode.subNodeCount} Accounts) · Double-click to expand
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
