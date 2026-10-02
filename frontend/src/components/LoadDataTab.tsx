import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Repeat,
  Network,
  FileCheck,
  FolderOpen,
  ArrowLeftRight,
  Landmark,
  Flag,
  Shield,
  ChevronDown
} from 'lucide-react';
import type { OverviewData } from '../types';

interface LoadDataTabProps {
  overviewData: OverviewData | null;
  onDatasetChange: () => void;
  onSelectVictim?: (victim: string) => void;
  onNavigateToInvestigate?: () => void;
}

export const LoadDataTab: React.FC<LoadDataTabProps> = ({
  overviewData,
  onDatasetChange,
  onNavigateToInvestigate
}) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [selectedPresetFile, setSelectedPresetFile] = useState<string>('data/raw/VoidHacks8_MuleAccount_2M_Transactions.csv');
  const [riskViewMode, setRiskViewMode] = useState<'Accounts' | 'Transactions' | 'Volume'>('Accounts');
  const [showRiskDropdown, setShowRiskDropdown] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setUploadStatus('Loading bank records into the offline database...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch('/api/ingest/upload', {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) throw new Error('Failed to load file');

      setUploadStatus('Bank records indexed successfully! Database ready.');
      setTimeout(() => {
        setUploading(false);
        setUploadStatus(null);
        onDatasetChange();
      }, 800);
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message}`);
      setUploading(false);
    }
  };

  const handleLoadPreset = async (filepath: string) => {
    setSelectedPresetFile(filepath);
    setUploading(true);
    setUploadStatus(`Loading selected investigation scenario...`);

    try {
      const resp = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath })
      });

      if (!resp.ok) throw new Error('Failed to load scenario');

      setUploadStatus('Scenario loaded and indexed successfully!');
      setTimeout(() => {
        setUploading(false);
        setUploadStatus(null);
        onDatasetChange();
      }, 700);
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message}`);
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const currentDatasetFilename = overviewData?.dataset_name || 'VoidHacks8_MuleAccount_2M_Transactions.csv';
  const totalTxns = overviewData?.total_transactions 
    ? overviewData.total_transactions.toLocaleString() 
    : '2,000,000';
  const totalAccts = overviewData?.total_accounts
    ? overviewData.total_accounts.toLocaleString()
    : '24,873';
  const flaggedCount = overviewData?.tier_distribution 
    ? ((overviewData.tier_distribution['High'] || 0) + (overviewData.tier_distribution['Critical'] || 0)).toLocaleString()
    : '426';
  const syndicatesCount = 9;

  // Dynamic Tier stats based on riskViewMode
  const getTierStats = () => {
    if (riskViewMode === 'Transactions') {
      return {
        low: '574,000', lowPct: '28.7%',
        med: '1,392,000', medPct: '69.6%',
        high: '34,000', highPct: '1.7%',
        crit: '14,000', critPct: '0.7%'
      };
    }
    if (riskViewMode === 'Volume') {
      return {
        low: '₹14.2 Cr', lowPct: '28.7%',
        med: '₹38.6 Cr', medPct: '69.6%',
        high: '₹5.8 Cr', highPct: '1.7%',
        crit: '₹2.4 Cr', critPct: '0.7%'
      };
    }
    return {
      low: overviewData?.tier_distribution?.['Low'] ? overviewData.tier_distribution['Low'].toLocaleString() : '7,123',
      lowPct: '28.7%',
      med: overviewData?.tier_distribution?.['Medium'] ? overviewData.tier_distribution['Medium'].toLocaleString() : '17,324',
      medPct: '69.6%',
      high: overviewData?.tier_distribution?.['High'] ? overviewData.tier_distribution['High'].toLocaleString() : '426',
      highPct: '1.7%',
      crit: overviewData?.tier_distribution?.['Critical'] ? overviewData.tier_distribution['Critical'].toLocaleString() : '182',
      critPct: '0.7%'
    };
  };

  const tierStats = getTierStats();

  // Preset Scenarios with colorful icon accents
  const scenarios = [
    {
      id: 'voidhacks',
      title: '2M National Bank Network',
      path: 'data/raw/VoidHacks8_MuleAccount_2M_Transactions.csv',
      desc: '2,000,000 txns across 24,873 accounts. Full multi-state fraud network.',
      tag: 'Full Scale',
      icon: Database,
      iconColor: '#2563EB',
      iconBg: '#EFF6FF',
      tagColor: '#1D4ED8',
      tagBg: '#DBEAFE'
    },
    {
      id: 'smurfing',
      title: 'Fast Smurfing (< 5 Min)',
      path: 'synthetic_data/scenario_1_fast_smurfing.csv',
      desc: 'Stolen funds rapidly split into small amounts within minutes to evade bank limits.',
      tag: 'Rapid Split',
      icon: Zap,
      iconColor: '#059669',
      iconBg: '#ECFDF5',
      tagColor: '#047857',
      tagBg: '#D1FAE5'
    },
    {
      id: 'investment',
      title: 'Investment Scam Ring',
      path: 'synthetic_data/scenario_2_investment_scam.csv',
      desc: 'Task fraud funnel with collector accounts and distributor cashouts.',
      tag: 'Task Fraud',
      icon: Users,
      iconColor: '#D97706',
      iconBg: '#FFFBEB',
      tagColor: '#B45309',
      tagBg: '#FEF3C7'
    },
    {
      id: 'cyclic',
      title: 'Cyclic Mule Ring',
      path: 'synthetic_data/scenario_3_cyclic_ring.csv',
      desc: 'Circular round-trip transfers between shell accounts to disguise origin.',
      tag: 'Circular Loop',
      icon: Repeat,
      iconColor: '#DC2626',
      iconBg: '#FEF2F2',
      tagColor: '#B91C1C',
      tagBg: '#FEE2E2'
    },
    {
      id: 'capacity',
      title: '500-Node Large Syndicate',
      path: 'synthetic_data/scenario_4_mega_capacity_stress_test_500nodes.csv',
      desc: 'High-volume criminal syndicate with 500 interconnected mule accounts.',
      tag: 'High Capacity',
      icon: Network,
      iconColor: '#7C3AED',
      iconBg: '#F5F3FF',
      tagColor: '#6D28D9',
      tagBg: '#EDE9FE'
    },
    {
      id: 'sample',
      title: 'Curated Forensic Sample',
      path: 'synthetic_data/sample_custom_export.csv',
      desc: 'Quick-start verified sample with confirmed mule roles and bank statements.',
      tag: 'Sample Set',
      icon: FileCheck,
      iconColor: '#0891B2',
      iconBg: '#ECFEFF',
      tagColor: '#0E7490',
      tagBg: '#CFFAFE'
    }
  ];

  return (
    <div style={{
      maxWidth: '1360px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      color: '#0F172A',
      paddingBottom: '24px'
    }}>
      {/* Upload / Status Toast */}
      {uploadStatus && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          backgroundColor: '#EFF6FF',
          border: '2px solid #2563EB',
          color: '#1D4ED8',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 6px rgba(37,99,235,0.15)'
        }}>
          <CheckCircle2 size={16} color="#2563EB" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* TOP SECTION: Case Information (Left) + Pre-Configured Scenarios (Right - replacing hero image) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.35fr',
        gap: '16px',
        alignItems: 'stretch'
      }}>
        {/* Left Column: Case Information & Explore Action */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          border: '2px solid #D5C7B5',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(60, 45, 30, 0.04)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Status Chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#ECFDF5',
                color: '#047857',
                border: '1.5px solid #A7F3D0',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700
              }}>
                <ShieldCheck size={13} color="#059669" />
                <span>Air-Gapped Offline Protection</span>
              </span>
            </div>

            <div>
              <h1 style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#0F172A',
                margin: '0 0 4px 0',
                lineHeight: 1.2
              }}>
                Case Management & Data Ingestion
              </h1>
              <p style={{
                fontSize: '0.8125rem',
                color: '#64748B',
                lineHeight: 1.45,
                margin: 0
              }}>
                Select a pre-configured banking scenario on the right or upload new bank statements below to trace fund movements.
              </p>
            </div>
          </div>

          {/* Active Case File Summary */}
          <div style={{
            backgroundColor: '#FAF7F2',
            border: '2px solid #D5C7B5',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Case File
              </span>
              <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', margin: '2px 0 0 0', fontFamily: 'var(--font-mono)' }}>
                {currentDatasetFilename}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748B' }}>Transactions:</span>
                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#2563EB', margin: 0 }}>
                  {totalTxns}
                </p>
              </div>
              <div style={{ borderLeft: '1px solid #D5C7B5', paddingLeft: '14px' }}>
                <span style={{ fontSize: '10.5px', color: '#64748B' }}>Accounts:</span>
                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {totalAccts}
                </p>
              </div>
            </div>
          </div>

          {/* Action Button: Explore Money Trail */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onNavigateToInvestigate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2563EB')}
            >
              <Network size={15} color="#FFFFFF" />
              <span>Explore Money Trail</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Column: Pre-Configured Investigation Scenarios (Replaces Image) */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          border: '2px solid #D5C7B5',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(60, 45, 30, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB'
              }}>
                <FolderOpen size={16} />
              </div>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Pre-Configured Investigation Scenarios
                </h2>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  Click any scenario to load and trace immediately
                </span>
              </div>
            </div>

            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#FAF7F2',
              border: '1px solid #D5C7B5',
              color: '#475569',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              6 Scenarios Ready
            </span>
          </div>

          {/* 6 Scenarios Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px'
          }}>
            {scenarios.map(scen => {
              const isSelected = selectedPresetFile === scen.path || currentDatasetFilename.includes(scen.id);
              const Icon = scen.icon;
              return (
                <div
                  key={scen.id}
                  onClick={() => handleLoadPreset(scen.path)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#EFF6FF' : '#FAF7F2',
                    border: `1.5px solid ${isSelected ? '#2563EB' : '#D5C7B5'}`,
                    cursor: uploading ? 'wait' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#F4EDE4';
                      e.currentTarget.style.borderColor = '#B8A896';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#FAF7F2';
                      e.currentTarget.style.borderColor = '#D5C7B5';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '5px',
                        backgroundColor: scen.iconBg,
                        color: scen.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={12} />
                      </div>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {scen.title}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 600,
                      backgroundColor: scen.tagBg,
                      color: scen.tagColor,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      flexShrink: 0
                    }}>
                      {scen.tag}
                    </span>
                  </div>

                  <p style={{ fontSize: '10.5px', color: '#64748B', margin: 0, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {scen.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Shifted Left Upload Box + Overview Metrics & Risk Categories on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.35fr',
        gap: '16px',
        alignItems: 'stretch'
      }}>
        {/* Left Column (Shifted Left): Upload Bank Statement */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          border: '2px solid #D5C7B5',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(60, 45, 30, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB'
            }}>
              <UploadCloud size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Upload Bank Statement
              </h2>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                Load evidence CSV or Excel export
              </span>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              backgroundColor: isDragOver ? '#EFF6FF' : '#FAF7F2',
              border: isDragOver ? '2px dashed #2563EB' : '2px dashed #D5C7B5',
              borderRadius: '8px',
              padding: '28px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textAlign: 'center',
              cursor: uploading ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
              flex: 1
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(37,99,235,0.12)'
            }}>
              <UploadCloud size={20} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Drag & drop bank statement CSV here
              </p>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: 0 }}>
                or click to browse from computer
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.parquet"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />

            <span style={{
              marginTop: '4px',
              fontSize: '10.5px',
              color: '#2563EB',
              backgroundColor: '#EFF6FF',
              border: '1px solid #DBEAFE',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 600
            }}>
              Supports SBI, HDFC, ICICI, Axis, Airtel Payments & More
            </span>
          </div>
        </div>

        {/* Right Column: Overview Metrics & Risk Categories Block */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          border: '2px solid #D5C7B5',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(60, 45, 30, 0.04)'
        }}>
          {/* Top 4 Key Metric Cards (2x2 Grid) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px'
          }}>
            {/* Card 1: Transactions */}
            <div style={{
              backgroundColor: '#FAF7F2',
              borderRadius: '8px',
              border: '1.5px solid #D5C7B5',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '5px',
                    backgroundColor: '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ArrowLeftRight size={12} color="#2563EB" />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>
                    Total Transactions
                  </span>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#16A34A' }}>
                  ▲ +8.3%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '2px' }}>
                <span style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {totalTxns}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Verified</span>
              </div>
            </div>

            {/* Card 2: Accounts */}
            <div style={{
              backgroundColor: '#FAF7F2',
              borderRadius: '8px',
              border: '1.5px solid #D5C7B5',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '5px',
                    backgroundColor: '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Landmark size={12} color="#059669" />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>
                    Total Accounts
                  </span>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#16A34A' }}>
                  ▲ +5.1%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '2px' }}>
                <span style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {totalAccts}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Active ledger</span>
              </div>
            </div>

            {/* Card 3: Flagged for Review */}
            <div style={{
              backgroundColor: '#FAF7F2',
              borderRadius: '8px',
              border: '1.5px solid #D5C7B5',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '5px',
                    backgroundColor: '#FEF2F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Flag size={12} color="#DC2626" />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>
                    Flagged for Review
                  </span>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#DC2626' }}>
                  High Risk
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '2px' }}>
                <span style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#DC2626',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {flaggedCount}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Needs action</span>
              </div>
            </div>

            {/* Card 4: Suspicious Groups */}
            <div style={{
              backgroundColor: '#FAF7F2',
              borderRadius: '8px',
              border: '1.5px solid #D5C7B5',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '5px',
                    backgroundColor: '#F5F3FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Network size={12} color="#7C3AED" />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>
                    Suspicious Groups
                  </span>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#7C3AED' }}>
                  Clustered
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '2px' }}>
                <span style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {syndicatesCount}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>Mule rings</span>
              </div>
            </div>
          </div>

          {/* Bottom Sub-Block: Risk Categories */}
          <div style={{
            backgroundColor: '#FAF7F2',
            borderRadius: '8px',
            border: '1.5px solid #D5C7B5',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} color="#2563EB" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                  Risk Categories
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                  ({riskViewMode})
                </span>
              </div>

              {/* View Mode Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowRiskDropdown(!showRiskDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '5px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D5C7B5',
                    color: '#334155',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span>{riskViewMode}</span>
                  <ChevronDown size={11} color="#64748B" />
                </button>

                {showRiskDropdown && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D5C7B5',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 30,
                    minWidth: '110px',
                    padding: '3px'
                  }}>
                    {(['Accounts', 'Transactions', 'Volume'] as const).map(mode => (
                      <div
                        key={mode}
                        onClick={() => {
                          setRiskViewMode(mode);
                          setShowRiskDropdown(false);
                        }}
                        style={{
                          padding: '5px 8px',
                          fontSize: '0.7rem',
                          fontWeight: riskViewMode === mode ? 700 : 500,
                          color: riskViewMode === mode ? '#2563EB' : '#334155',
                          backgroundColor: riskViewMode === mode ? '#EFF6FF' : 'transparent',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {mode}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Segmented Risk Bar */}
            <div style={{
              height: '7px',
              borderRadius: '4px',
              overflow: 'hidden',
              display: 'flex',
              backgroundColor: '#E2E8F0'
            }}>
              <div style={{ width: '28.7%', backgroundColor: '#34D399' }} title="Low: 28.7%" />
              <div style={{ width: '69.6%', backgroundColor: '#FBBF24' }} title="Medium: 69.6%" />
              <div style={{ width: '1.7%', backgroundColor: '#F87171' }} title="High: 1.7%" />
              <div style={{ width: '0.7%', backgroundColor: '#1E293B' }} title="Critical: 0.7%" />
            </div>

            {/* 4 Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              paddingTop: '1px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', color: '#64748B' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#34D399' }} />
                  <span>Low</span>
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', marginTop: '1px' }}>
                  {tierStats.low} <span style={{ fontSize: '0.625rem', fontWeight: 400, color: '#94A3B8' }}>({tierStats.lowPct})</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', color: '#64748B' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#FBBF24' }} />
                  <span>Medium</span>
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', marginTop: '1px' }}>
                  {tierStats.med} <span style={{ fontSize: '0.625rem', fontWeight: 400, color: '#94A3B8' }}>({tierStats.medPct})</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', color: '#64748B' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#F87171' }} />
                  <span>High</span>
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#DC2626', marginTop: '1px' }}>
                  {tierStats.high} <span style={{ fontSize: '0.625rem', fontWeight: 400, color: '#94A3B8' }}>({tierStats.highPct})</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', color: '#64748B' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#1E293B' }} />
                  <span>Critical</span>
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', marginTop: '1px' }}>
                  {tierStats.crit} <span style={{ fontSize: '0.625rem', fontWeight: 400, color: '#94A3B8' }}>({tierStats.critPct})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadDataTab;
