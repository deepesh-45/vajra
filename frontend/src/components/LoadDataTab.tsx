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
  FolderOpen
} from 'lucide-react';
import type { OverviewData } from '../types';

interface LoadDataTabProps {
  overviewData: OverviewData | null;
  onDatasetChange: () => void;
  onSelectVictim?: (victim: string) => void;
  onNavigateToInvestigate?: () => void;
  onNavigateToOverview?: () => void;
}

export const LoadDataTab: React.FC<LoadDataTabProps> = ({
  overviewData,
  onDatasetChange,
  onNavigateToInvestigate,
  onNavigateToOverview
}) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [selectedPresetFile, setSelectedPresetFile] = useState<string>('data/raw/VoidHacks8_MuleAccount_2M_Transactions.csv');
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
  const totalRowsFormatted = overviewData?.total_transactions 
    ? overviewData.total_transactions.toLocaleString() 
    : '2,000,000';
  const totalAccountsFormatted = overviewData?.total_accounts
    ? overviewData.total_accounts.toLocaleString()
    : '24,873';

  // Preset Scenarios with colorful icon accents matching OverviewTab
  const scenarios = [
    {
      id: 'voidhacks',
      title: '2M National Bank Network',
      path: 'data/raw/VoidHacks8_MuleAccount_2M_Transactions.csv',
      desc: '2,000,000 transactions across 24,873 accounts. Full multi-state fraud network.',
      tag: 'Full Scale',
      icon: Database,
      iconColor: '#2563EB',
      iconBg: '#EFF6FF',
      tagColor: '#1D4ED8',
      tagBg: '#DBEAFE'
    },
    {
      id: 'smurfing',
      title: 'Fast Smurfing (Under 5 Min)',
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
      title: 'Investment Scam Syndicate',
      path: 'synthetic_data/scenario_2_investment_scam.csv',
      desc: 'Telegram task fraud funnel with collector accounts and distributor cashouts.',
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
      desc: 'Circular round-trip money transfers between shell accounts to disguise origin.',
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
      maxWidth: '1240px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      color: '#0F172A',
      paddingBottom: '36px'
    }}>
      {/* Visual Hero Banner with Impressive 3D Cyber Shield Image */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        padding: '24px 28px',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '28px',
        alignItems: 'center',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Left Column: Case Information & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 2 }}>
          {/* Status Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: '#ECFDF5',
              color: '#047857',
              border: '1px solid #A7F3D0',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700
            }}>
              <ShieldCheck size={13} color="#059669" />
              <span>Air-Gapped Offline Protection</span>
            </span>

            <span style={{
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              border: '1px solid #BFDBFE',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600
            }}>
              Indore Police Cyber Cell
            </span>
          </div>

          <div>
            <h1 style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#0F172A',
              margin: '0 0 6px 0',
              lineHeight: 1.2
            }}>
              Case Management & Evidence Ingestion
            </h1>
            <p style={{
              fontSize: '0.875rem',
              color: '#64748B',
              lineHeight: 1.45,
              margin: 0
            }}>
              Select a pre-configured banking fraud scenario or upload new bank statements to trace money trails and generate official freeze notices.
            </p>
          </div>

          {/* Currently Loaded Dataset Summary */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Case File
              </span>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: '2px 0 0 0', fontFamily: 'var(--font-mono)' }}>
                {currentDatasetFilename}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Total Records:</span>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB', margin: 0 }}>
                  {totalRowsFormatted} Txns
                </p>
              </div>
              <div style={{ borderLeft: '1px solid #CBD5E1', paddingLeft: '16px' }}>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Accounts:</span>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {totalAccountsFormatted}
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
            <button
              onClick={onNavigateToOverview}
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
              <span>View Case Overview</span>
              <ArrowRight size={15} />
            </button>

            <button
              onClick={onNavigateToInvestigate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid #CBD5E1',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              <Network size={15} color="#2563EB" />
              <span>Explore Money Trail</span>
            </button>
          </div>
        </div>

        {/* Right Column: High-Tech Forensics Visualization Image */}
        <div style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06)',
          border: '1px solid #CBD5E1',
          height: '240px',
          backgroundColor: '#0F172A'
        }}>
          <img
            src="/vajra_hero.jpg"
            alt="Forensic Command Center"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
          {/* Subtle gradient vignette */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.4) 0%, transparent 60%)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '12px',
            right: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 600,
            textShadow: '0 1px 3px rgba(0,0,0,0.8)'
          }}>
            <span>State Cyber Police Forensics</span>
            <span style={{ backgroundColor: 'rgba(37,99,235,0.8)', padding: '2px 8px', borderRadius: '4px' }}>
              Live System
            </span>
          </div>
        </div>
      </div>

      {/* Upload Status Toast */}
      {uploadStatus && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          color: '#1D4ED8',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 1px 3px rgba(37,99,235,0.1)'
        }}>
          <CheckCircle2 size={16} color="#2563EB" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* Main Action Grid: Select Scenario OR Upload Bank File */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '20px'
      }}>
        {/* Left Card: Select Pre-Configured Investigation Case */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB'
              }}>
                <FolderOpen size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Pre-Configured Investigation Scenarios
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Click any case scenario to load and trace immediately
                </span>
              </div>
            </div>

            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#F1F5F9',
              color: '#475569',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              6 Scenarios Ready
            </span>
          </div>

          {/* Scenario Cards Grid with Colorful Icons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px'
          }}>
            {scenarios.map(scen => {
              const isSelected = selectedPresetFile === scen.path || currentDatasetFilename.includes(scen.id);
              const Icon = scen.icon;
              return (
                <div
                  key={scen.id}
                  onClick={() => handleLoadPreset(scen.path)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? '#EFF6FF' : '#F8FAFC',
                    border: `1.5px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                    cursor: uploading ? 'wait' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#F1F5F9';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#F8FAFC';
                      e.currentTarget.style.borderColor = '#E2E8F0';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: scen.iconBg,
                        color: scen.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={15} />
                      </div>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                        {scen.title}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      backgroundColor: scen.tagBg,
                      color: scen.tagColor,
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}>
                      {scen.tag}
                    </span>
                  </div>

                  <p style={{ fontSize: '11px', color: '#64748B', margin: 0, lineHeight: 1.35 }}>
                    {scen.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Card: Drag & Drop Upload Zone */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB'
            }}>
              <UploadCloud size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Upload Bank Statement
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
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
              backgroundColor: isDragOver ? '#EFF6FF' : '#F8FAFC',
              border: isDragOver ? '2px dashed #2563EB' : '2px dashed #CBD5E1',
              borderRadius: '10px',
              padding: '36px 18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              textAlign: 'center',
              cursor: uploading ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              flex: 1
            }}
          >
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(37,99,235,0.15)'
            }}>
              <UploadCloud size={24} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Drag & drop bank statement CSV here
              </p>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                or click to browse your computer
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
              fontSize: '11px',
              color: '#2563EB',
              backgroundColor: '#EFF6FF',
              padding: '3px 10px',
              borderRadius: '6px',
              fontWeight: 600
            }}>
              Supports SBI, HDFC, ICICI, Axis, Airtel Payments & More
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadDataTab;
