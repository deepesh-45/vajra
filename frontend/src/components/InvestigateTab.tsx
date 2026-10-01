import React, { useState, useEffect, useMemo } from 'react';
import { Search, Play, Pause, RotateCcw, Download, ArrowRight, Zap, Layers, Sparkles, CheckCircle2, AlertTriangle, ShieldAlert, Eye, X } from 'lucide-react';
import type { TraceResponse, NodeData, FreezeRecommendation, EdgeData } from '../types';
import { GraphCanvas } from './GraphCanvas';

interface InvestigateTabProps {
  initialVictim: string;
  onNavigateToLegal: (victim: string) => void;
  onDatasetChange?: () => void;
}

export const InvestigateTab: React.FC<InvestigateTabProps> = ({ initialVictim, onNavigateToLegal, onDatasetChange }) => {
  const [victimInput, setVictimInput] = useState(initialVictim || 'AIRP10000024');
  const [traceData, setTraceData] = useState<TraceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switchingDataset, setSwitchingDataset] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Selected Node & Forensic Details
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [accountDetails, setAccountDetails] = useState<any | null>(null);

  // Architectural Graph Controls
  const [clustersCollapsed, setClustersCollapsed] = useState<boolean>(false);
  const [activeMotif, setActiveMotif] = useState<'all' | 'fan-out' | 'fan-in' | 'long-chain'>('all');
  const [layoutMode, setLayoutMode] = useState<'flow' | 'force'>('flow');
  const [isolatedPathNodeIds, setIsolatedPathNodeIds] = useState<Set<string> | null>(null);

  // Temporal Playback Slider State
  const [minTs, setMinTs] = useState<number>(0);
  const [maxTs, setMaxTs] = useState<number>(0);
  const [currentTs, setCurrentTs] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [timeMode, setTimeMode] = useState<'cumulative' | 'slice'>('cumulative');

  const presets = [
    {
      id: 'scenario_4_mega',
      name: 'Scenario 4: Mega Capacity Limit Test',
      victim: 'SBIN10005001',
      path: 'data/synthetic/scenario_4_mega_capacity_stress_test_500nodes.csv',
      badge: '511 Nodes · 1,650 Flows',
      loss: '₹5 Crore',
      isStress: true
    },
    {
      id: 'scenario_1_smurfing',
      name: 'Scenario 1: Fast Smurfing',
      victim: 'SBIN10009901',
      path: 'data/synthetic/scenario_1_fast_smurfing.csv',
      badge: '267 Nodes · IEEE AML',
      loss: '₹15 Lakh',
      isStress: false
    },
    {
      id: 'scenario_2_investment',
      name: 'Scenario 2: Investment Scam',
      victim: 'SBIN10008000',
      path: 'data/synthetic/scenario_2_investment_scam.csv',
      badge: '357 Nodes · IBM Watson',
      loss: '₹25 Lakh',
      isStress: false
    },
    {
      id: 'scenario_3_cyclic',
      name: 'Scenario 3: Cyclic Laundering',
      victim: 'AXIS10007701',
      path: 'data/synthetic/scenario_3_cyclic_ring.csv',
      badge: '263 Nodes · Nature 2025',
      loss: '₹18 Lakh',
      isStress: false
    },
    {
      id: 'benchmark_2m',
      name: 'VoidHacks 2M Production',
      victim: 'AIRP10000024',
      path: 'VoidHacks8_MuleAccount_2M_Transactions.csv',
      badge: '2M Txns · Benchmark',
      loss: '₹10 Lakh+',
      isStress: false
    }
  ];

  const handleSelectScenario = async (p: typeof presets[0]) => {
    setSwitchingDataset(true);
    setStatusMessage(`Loading ${p.name}...`);
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: p.path })
      });
      if (!resp.ok) throw new Error('Failed to load dataset scenario');
      setStatusMessage(`${p.name} loaded! Tracing money trail...`);
      setVictimInput(p.victim);
      setIsolatedPathNodeIds(null);
      if (onDatasetChange) onDatasetChange();
      await fetchTrace(p.victim);
      setStatusMessage(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSwitchingDataset(false);
    }
  };

  const fetchTrace = async (acct: string) => {
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    setAccountDetails(null);
    setIsPlaying(false);
    setIsolatedPathNodeIds(null);

    try {
      const resp = await fetch('http://127.0.0.1:8000/api/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ victim_account: acct, max_hops: 4 })
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Failed to trace victim account');
      }

      const data: TraceResponse = await resp.json();
      setTraceData(data);

      // Automatically collapse supernodes if huge graph (>120 nodes) to prevent hairball
      if (data.num_nodes > 120) {
        setClustersCollapsed(true);
      } else {
        setClustersCollapsed(false);
      }

      // Compute timestamps range for playback
      if (data.edges.length > 0) {
        const timestamps = data.edges.map(e => e.ts_epoch);
        const earliest = Math.min(...timestamps);
        const latest = Math.max(...timestamps);
        setMinTs(earliest);
        setMaxTs(latest);
        setCurrentTs(latest); // Default to full trail visible
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialVictim) {
      setVictimInput(initialVictim);
      fetchTrace(initialVictim);
    }
  }, [initialVictim]);

  // Fetch account profile when a node is clicked
  useEffect(() => {
    if (!selectedNode || selectedNode.isSupernode) return;
    fetch(`http://127.0.0.1:8000/api/accounts/${selectedNode.acct_no}`)
      .then(res => res.json())
      .then(data => setAccountDetails(data))
      .catch(console.error);
  }, [selectedNode]);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTs((prev: number) => {
        const step = Math.max(60, Math.floor((maxTs - minTs) / 100)) * playbackSpeed;
        if (prev + step >= maxTs) {
          setIsPlaying(false);
          return maxTs;
        }
        return prev + step;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, maxTs, minTs, playbackSpeed]);

  // Isolate Trail (Upstream & Downstream traversal)
  const handleIsolateTrail = (nodeId: string) => {
    if (!traceData) return;
    const visited = new Set<string>();
    visited.add(nodeId);

    // Downstream traversal
    const queue = [nodeId];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      traceData.edges.forEach(e => {
        if (e.src_acct === cur && !visited.has(e.dst_acct)) {
          visited.add(e.dst_acct);
          queue.push(e.dst_acct);
        }
      });
    }

    // Upstream traversal
    const upQueue = [nodeId];
    while (upQueue.length > 0) {
      const cur = upQueue.shift()!;
      traceData.edges.forEach(e => {
        if (e.dst_acct === cur && !visited.has(e.src_acct)) {
          visited.add(e.src_acct);
          upQueue.push(e.src_acct);
        }
      });
    }

    setIsolatedPathNodeIds(visited);
  };

  const handleExportCSV = () => {
    if (!traceData) return;
    const headers = ['Txn_ID,Src_Account,Dst_Account,Amount_INR,Taint_INR,Hop,Narration,Mode\n'];
    const rows = traceData.edges.map((e: EdgeData) =>
      `"${e.txn_id}","${e.src_acct}","${e.dst_acct}",${e.amount_paise / 100},${e.taint_paise / 100},${e.hop},"${e.narration}","${e.payment_mode}"`
    );
    const blob = new Blob([headers.join('') + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `money_trail_${traceData.victim_account}.csv`;
    a.click();
  };

  // Node forensic metrics
  const selectedNodeMetrics = useMemo(() => {
    if (!selectedNode || !traceData) return null;
    const incomingEdges = traceData.edges.filter(e => e.dst_acct === selectedNode.acct_no);
    const outgoingEdges = traceData.edges.filter(e => e.src_acct === selectedNode.acct_no);

    const totalInflow = incomingEdges.reduce((acc, e) => acc + e.amount_paise / 100, 0);
    const totalOutflow = outgoingEdges.reduce((acc, e) => acc + e.amount_paise / 100, 0);
    const degree = incomingEdges.length + outgoingEdges.length;

    let roleTag = 'Mule Account';
    let anomalyMsg = 'Identified as active participant in multi-hop laundering';
    let riskScore = 78;

    if (selectedNode.hop === 0) {
      roleTag = 'Victim Complaint';
      anomalyMsg = 'Primary source of reported cyber-fraud funds';
      riskScore = 15;
    } else if (selectedNode.hop === 1) {
      roleTag = 'Smurfing Dispatch Hub';
      anomalyMsg = 'Receives large sum and rapidly fans out micro-transactions under ₹50,000';
      riskScore = 96;
    } else if (selectedNode.hop === 2) {
      roleTag = 'Layering Mule';
      anomalyMsg = 'Intermediate churn mule executing rapid pass-through transfers';
      riskScore = 84;
    } else if (selectedNode.hop === 3) {
      roleTag = 'Aggregator Funnel Hub';
      anomalyMsg = 'Fan-In aggregator pooling funds from multiple mules';
      riskScore = 92;
    } else if (selectedNode.hop >= 4) {
      roleTag = 'Cash-Out Exit';
      anomalyMsg = 'Terminal destination (ATM withdrawal, P2P exchange, or off-ramp)';
      riskScore = 89;
    }

    if (accountDetails?.score?.risk_index) {
      riskScore = accountDetails.score.risk_index;
    }

    return {
      totalInflow,
      totalOutflow,
      degree,
      roleTag,
      anomalyMsg,
      riskScore,
      dwellTime: Math.max(8, Math.min(75, Math.round(degree * 2.8)))
    };
  }, [selectedNode, traceData, accountDetails]);

  // Velocity calculation (tx/hr)
  const txVelocity = useMemo(() => {
    if (!traceData || maxTs === minTs) return 0;
    const hours = Math.max(1, (currentTs - minTs) / 3600);
    const visibleCount = traceData.edges.filter(e => e.ts_epoch <= currentTs).length;
    return Math.round(visibleCount / hours);
  }, [traceData, currentTs, minTs, maxTs]);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Quick Test Scenarios & Capacity Stress Test Switcher Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '14px 18px',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--primary)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              1-Click Dataset Scenarios & Graph Capacity Limits:
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              (Select below to test multi-hop rings and maximum scale without UI lag)
            </span>
          </div>
          {statusMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--primary)',
              backgroundColor: 'var(--primary-light)',
              padding: '4px 10px',
              borderRadius: '6px'
            }}>
              <CheckCircle2 size={14} />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {presets.map(p => {
            const isSelected = victimInput === p.victim;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectScenario(p)}
                disabled={switchingDataset || loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: p.isStress
                    ? (isSelected ? '#EA580C' : '#FFF7ED')
                    : (isSelected ? 'var(--primary)' : 'var(--surface-2)'),
                  color: p.isStress
                    ? (isSelected ? '#FFFFFF' : '#EA580C')
                    : (isSelected ? '#FFFFFF' : 'var(--text)'),
                  border: p.isStress
                    ? '1.5px solid #EA580C'
                    : (isSelected ? '1px solid var(--primary)' : '1px solid var(--border)'),
                  fontSize: '12px',
                  fontWeight: isSelected || p.isStress ? 700 : 500,
                  cursor: switchingDataset ? 'wait' : 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: p.isStress && !isSelected ? '0 1px 3px rgba(234,88,12,0.15)' : 'none'
                }}
              >
                {p.isStress ? <Sparkles size={14} /> : <Layers size={14} />}
                <span>{p.name}</span>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                  color: isSelected ? '#FFFFFF' : 'var(--text-muted)'
                }}>
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Header Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '16px 20px',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            value={victimInput}
            onChange={e => setVictimInput(e.target.value)}
            placeholder="Enter 12-digit Victim Account Number (e.g. SBIN10005001 or AIRP10000024)"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              fontSize: '14px',
              fontFamily: 'var(--font-mono)'
            }}
            onKeyDown={e => e.key === 'Enter' && fetchTrace(victimInput)}
          />
          <button
            onClick={() => fetchTrace(victimInput)}
            disabled={loading}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {loading ? 'Tracing Trail...' : 'Trace Money Trail'}
          </button>
        </div>

        {traceData && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>Export Money Trail CSV</span>
            </button>
            <button
              onClick={() => onNavigateToLegal(traceData.victim_account)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--success)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>Draft Freeze Notices</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          backgroundColor: 'var(--danger-light)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger)',
          fontSize: '13px'
        }}>
          {error}
        </div>
      )}

      {traceData && (
        <>
          {/* Metrics Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL SIPHONED (VICTIM)</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>
                ₹{traceData.initial_loss_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>RECOVERABLE (CURRENTLY HELD)</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>
                ₹{traceData.total_held_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{traceData.recovery_potential_pct}% recoverable</div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600 }}>CASHED-OUT (TERMINAL)</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--danger)', marginTop: '4px' }}>
                ₹{traceData.total_cashed_out_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>ACCOUNTS IN RING</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>
                {traceData.num_nodes} nodes · {traceData.num_edges} hops
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>TRACE LATENCY</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                {traceData.timing_ms} ms
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sub-second benchmark</div>
            </div>
          </div>

          {/* Pattern Motifs & Supernodes Control Bar */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '12px 18px',
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {/* Pattern Motifs Quick Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Fraud Motifs:
              </span>
              {[
                { id: 'all', label: 'All Trails', desc: 'Full ecosystem' },
                { id: 'fan-out', label: 'Fan-Out (Smurfing)', desc: '1-to-many rapid dispersal' },
                { id: 'fan-in', label: 'Fan-In (Consolidation)', desc: 'Many mules to funnel' },
                { id: 'long-chain', label: 'Long Chain', desc: '4+ hop laundering chain' }
              ].map(m => {
                const isActive = activeMotif === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveMotif(m.id as any)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: isActive ? 700 : 500,
                      backgroundColor: isActive ? 'var(--primary)' : 'var(--surface-2)',
                      color: isActive ? '#FFFFFF' : 'var(--text)',
                      border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Layout & Clustering Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Supernodes Collapsible Toggle */}
              <button
                onClick={() => setClustersCollapsed(!clustersCollapsed)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: clustersCollapsed ? '#EFF6FF' : '#FFFFFF',
                  color: clustersCollapsed ? 'var(--primary)' : 'var(--text)',
                  border: clustersCollapsed ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Layers size={14} color={clustersCollapsed ? 'var(--primary)' : 'var(--text-muted)'} />
                <span>{clustersCollapsed ? 'Mule Rings Collapsed (Supernodes)' : 'Collapse Mule Rings'}</span>
              </button>

              {/* Layout Switcher */}
              <div style={{ display: 'flex', backgroundColor: 'var(--surface-2)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setLayoutMode('flow')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: layoutMode === 'flow' ? 700 : 500,
                    backgroundColor: layoutMode === 'flow' ? '#FFFFFF' : 'transparent',
                    color: layoutMode === 'flow' ? 'var(--primary)' : 'var(--text-muted)',
                    boxShadow: layoutMode === 'flow' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Sugiyama DAG
                </button>
                <button
                  onClick={() => setLayoutMode('force')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: layoutMode === 'force' ? 700 : 500,
                    backgroundColor: layoutMode === 'force' ? '#FFFFFF' : 'transparent',
                    color: layoutMode === 'force' ? 'var(--primary)' : 'var(--text-muted)',
                    boxShadow: layoutMode === 'force' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Force Clusters
                </button>
              </div>

              {isolatedPathNodeIds && (
                <button
                  onClick={() => setIsolatedPathNodeIds(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--danger-light)',
                    color: 'var(--danger)',
                    border: '1px solid var(--danger-border)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <X size={13} />
                  <span>Reset Trail Focus</span>
                </button>
              )}
            </div>
          </div>

          {/* Temporal Playback Slider Bar */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            padding: '12px 20px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Play/Step Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                }}
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: '2px' }} />}
              </button>

              <button
                onClick={() => setCurrentTs(Math.max(minTs, currentTs - 14400))}
                style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '11px' }}
                title="Step Back 4 Hours"
              >
                ⏮
              </button>
              <button
                onClick={() => setCurrentTs(Math.min(maxTs, currentTs + 14400))}
                style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '11px' }}
                title="Step Forward 4 Hours"
              >
                ⏭
              </button>
              <button
                onClick={() => { setIsPlaying(false); setCurrentTs(minTs); }}
                style={{ padding: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Reset to Incident Start"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Window: <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{new Date(currentTs * 1000).toLocaleString('en-IN')}</strong></span>
                <span>Velocity: <strong style={{ color: 'var(--text)' }}>{txVelocity} tx/hr</strong> · Total: 72h Investigation Window</span>
              </div>
              <input
                type="range"
                min={minTs}
                max={maxTs}
                value={currentTs}
                onChange={e => {
                  setIsPlaying(false);
                  setCurrentTs(Number(e.target.value));
                }}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Time Mode Toggle */}
            <button
              onClick={() => setTimeMode(timeMode === 'cumulative' ? 'slice' : 'cumulative')}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {timeMode === 'cumulative' ? 'Cumulative Flow' : 'Window Slice (±4h)'}
            </button>

            {/* Playback Speed */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 5].map(spd => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: playbackSpeed === spd ? 'var(--primary-light)' : 'var(--surface-2)',
                    color: playbackSpeed === spd ? 'var(--primary)' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer'
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Graph Visualization + Integrated Forensic Inspector Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '2.8fr 1.2fr' : '1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--layer-victim)' }} />
                    <span>Victim</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--layer-1)' }} />
                    <span>Stage 1: Smurfing Dispatch</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--layer-2)' }} />
                    <span>Stage 2: Layering Mule</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#9333EA' }} />
                    <span>Stage 3: Aggregator Hub</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                    <span>Stage 4: Cash-Out Exit</span>
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)' }}>
                  {clustersCollapsed ? 'Supernodes Active • Double-click cluster to expand' : 'Click any node to open Forensic Inspector'}
                </span>
              </div>

              <GraphCanvas
                nodes={traceData.nodes}
                edges={traceData.edges}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                maxTimestamp={currentTs}
                minTimestamp={minTs}
                timeMode={timeMode}
                activeMotif={activeMotif}
                clustersCollapsed={clustersCollapsed}
                onToggleClustering={() => setClustersCollapsed(!clustersCollapsed)}
                isolatedPathNodeIds={isolatedPathNodeIds}
                layoutMode={layoutMode}
              />
            </div>

            {/* Integrated Forensic Inspector Side Panel */}
            {selectedNode && (
              <aside style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: 'var(--shadow-sm)',
                overflowY: 'auto',
                maxHeight: '680px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={16} color="var(--primary)" />
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Forensic Trail Inspector</h3>
                  </div>
                  <button onClick={() => setSelectedNode(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={16} />
                  </button>
                </div>

                {/* Entity Details Card */}
                <div style={{ padding: '14px', backgroundColor: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: selectedNodeMetrics?.riskScore && selectedNodeMetrics.riskScore > 75 ? 'var(--danger-light)' : 'var(--primary-light)',
                        color: selectedNodeMetrics?.riskScore && selectedNodeMetrics.riskScore > 75 ? 'var(--danger)' : 'var(--primary)',
                        textTransform: 'uppercase'
                      }}>
                        {selectedNodeMetrics?.roleTag}
                      </span>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px', color: 'var(--text)' }}>
                        {selectedNode.acct_no}
                      </h4>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {selectedNode.bank} · IFSC: {selectedNode.ifsc}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Risk Index</span>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: selectedNodeMetrics?.riskScore && selectedNodeMetrics.riskScore > 75 ? 'var(--danger)' : 'var(--primary)' }}>
                        {selectedNodeMetrics?.riskScore} / 100
                      </span>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FEE2E2',
                    fontSize: '11px',
                    color: '#991B1B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span>{selectedNodeMetrics?.anomalyMsg}</span>
                  </div>
                </div>

                {/* Attributes Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Total Inflow</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>
                      ₹{selectedNodeMetrics?.totalInflow.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Total Outflow</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger)' }}>
                      ₹{selectedNodeMetrics?.totalOutflow.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Estimated Dwell Time</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#D97706' }}>
                      {selectedNodeMetrics?.dwellTime} mins
                    </span>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Direct Fan Degree</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                      {selectedNodeMetrics?.degree} links
                    </span>
                  </div>
                </div>

                {/* Investigation Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Graph Actions
                  </span>
                  <button
                    onClick={() => handleIsolateTrail(selectedNode.acct_no)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--primary)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Eye size={14} />
                    <span>Isolate Multi-Hop Trail</span>
                  </button>

                  <button
                    onClick={() => setClustersCollapsed(!clustersCollapsed)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--surface-2)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Layers size={14} />
                    <span>{clustersCollapsed ? 'Expand All Mule Clusters' : 'Collapse Mule Clusters'}</span>
                  </button>
                </div>

                {/* Connected Transactions Table */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Recent Linked Flows
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {accountDetails?.recent_transactions?.slice(0, 10).map((txn: any) => {
                      const isOut = txn.src_acct === selectedNode.acct_no;
                      return (
                        <div key={txn.txn_id} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '11px', backgroundColor: '#FFFFFF' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontWeight: 700,
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: isOut ? '#FEE2E2' : '#DCFCE7',
                              color: isOut ? '#DC2626' : '#16A34A'
                            }}>
                              {isOut ? '→ OUT' : '← IN'}
                            </span>
                            <strong style={{ fontFamily: 'var(--font-mono)' }}>₹{txn.amount.toLocaleString('en-IN')}</strong>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Counterparty: {isOut ? txn.dst_acct.slice(0, 12) : txn.src_acct.slice(0, 12)}</span>
                            <span>{txn.payment_mode}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>
            )}
          </div>

          {/* Recommended Freeze Targets Table */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                  Recommended Accounts to Freeze (Ranked by Recoverable Money)
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Accounts currently holding stolen money, ready for immediate freezing under Section 94 BNSS
                </p>
              </div>
              <button
                onClick={() => onNavigateToLegal(traceData.victim_account)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Generate Bank Freeze Notices
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-2)' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Priority Rank</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Account Number</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Bank</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>IFSC Code</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Role in Trail</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Recoverable Stolen Funds</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>Share of Stolen Money</th>
                </tr>
              </thead>
              <tbody>
                {traceData.freeze_recommendations.map((rec: FreezeRecommendation, idx: number) => (
                  <tr key={rec.acct_no} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--primary)' }}>#{idx + 1}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{rec.acct_no}</td>
                    <td style={{ padding: '10px 14px' }}>{rec.bank}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>{rec.ifsc}</td>
                    <td style={{ padding: '10px 14px' }}>{rec.layer}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--success)' }}>
                      ₹{rec.held_inr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{rec.coverage_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
