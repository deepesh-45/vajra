import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Check,
  CheckCircle2,
  Database,
  ShieldCheck,
  ArrowRight,
  FolderPlus,
  Play,
  RotateCcw
} from 'lucide-react';
import type { OverviewData } from '../types';

interface LoadDataTabProps {
  overviewData: OverviewData | null;
  onDatasetChange: () => void;
  onSelectVictim?: (victim: string) => void;
  onNavigateToInvestigate: () => void;
  onNavigateToOverview: () => void;
}

interface ForensicStudy {
  id: string;
  name: string;
  case_ref: string;
  dataset_filename: string;
  filepath: string;
  rows: number;
  accounts: number;
  analyst: string;
  status: string;
  date: string;
}

export const LoadDataTab: React.FC<LoadDataTabProps> = ({
  overviewData,
  onDatasetChange,
  onSelectVictim: _onSelectVictim,
  onNavigateToInvestigate,
  onNavigateToOverview
}) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // New Study Form State
  const [studyName, setStudyName] = useState<string>('Operation Vajra: Multi-State UPI Mule Syndicate');
  const [caseRef, setCaseRef] = useState<string>('FIR No. 412/2024 - Cyber Crime Division Indore');
  const [investigatorName, setInvestigatorName] = useState<string>('Ayush Sharma (Lead Cyber Analyst)');
  const [datasetSelectionMode, setDatasetSelectionMode] = useState<'upload' | 'preset'>('preset');
  const [selectedPresetFile, setSelectedPresetFile] = useState<string>('data/raw/VoidHacks8_MuleAccount_2M_Transactions.csv');

  // Historical Studies State
  const [studies, setStudies] = useState<ForensicStudy[]>([]);
  const [_loadingStudies, setLoadingStudies] = useState<boolean>(false);
  const [loadingStudyId, setLoadingStudyId] = useState<string | null>(null);

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    setLoadingStudies(true);
    try {
      const res = await fetch('/api/studies');
      if (res.ok) {
        const json = await res.json();
        if (json.studies) setStudies(json.studies);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStudies(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setUploadStatus('Uploading & indexing dataset into DuckDB engine...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch('/api/ingest/upload', {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) throw new Error('Failed to ingest dataset');

      setUploadStatus('Study initialized & indexed! Database ready.');
      setTimeout(() => {
        setUploading(false);
        setUploadStatus(null);
        onDatasetChange();
        fetchStudies();
      }, 900);
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message}`);
      setUploading(false);
    }
  };

  const handleLoadPreset = async (filepath: string, studyId?: string) => {
    if (studyId) setLoadingStudyId(studyId);
    setUploading(true);
    setUploadStatus(`Loading & indexing study dataset into DuckDB...`);

    try {
      const resp = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath })
      });

      if (!resp.ok) throw new Error('Failed to load dataset');

      setUploadStatus('Study dataset loaded into DuckDB successfully!');
      setTimeout(() => {
        setUploading(false);
        setUploadStatus(null);
        setLoadingStudyId(null);
        onDatasetChange();
        fetchStudies();
      }, 800);
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message}`);
      setUploading(false);
      setLoadingStudyId(null);
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

  return (
    <div style={{
      maxWidth: '1360px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      color: '#0F172A',
      paddingBottom: '40px'
    }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#0F172A',
            margin: 0
          }}>
            Load Data & Forensic Studies
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#64748B',
            margin: 0
          }}>
            Open or initiate a financial fraud study, select or upload evidence transaction ledgers, and index data into DuckDB
          </p>
        </div>

        {uploadStatus && (
          <div style={{
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1D4ED8',
            fontSize: '0.8125rem',
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
      </div>

      {/* SECTION 1: Open a New Study Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
      }}>
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB'
            }}>
              <FolderPlus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Open a New Study
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Define case metadata, choose an evidence source, and prepare the forensic pipeline
              </span>
            </div>
          </div>

          <span style={{
            backgroundColor: '#F1F5F9',
            color: '#475569',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '9999px'
          }}>
            Step 1 of Forensic Investigation
          </span>
        </div>

        {/* Study Metadata Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
              Study Title / Case Name
            </label>
            <input
              type="text"
              value={studyName}
              onChange={e => setStudyName(e.target.value)}
              placeholder="e.g. Operation Vajra: Telegram Mule Syndicate"
              style={{
                padding: '9px 12px',
                borderRadius: '6px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                fontSize: '0.8125rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
              Legal Reference / FIR Number
            </label>
            <input
              type="text"
              value={caseRef}
              onChange={e => setCaseRef(e.target.value)}
              placeholder="e.g. FIR No. 412/2024 Crime Branch"
              style={{
                padding: '9px 12px',
                borderRadius: '6px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                fontSize: '0.8125rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
              Lead Investigating Officer
            </label>
            <input
              type="text"
              value={investigatorName}
              onChange={e => setInvestigatorName(e.target.value)}
              placeholder="e.g. Ayush Sharma (Lead Cyber Analyst)"
              style={{
                padding: '9px 12px',
                borderRadius: '6px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                fontSize: '0.8125rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Dataset Selection Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
              Select Evidence Dataset Source:
            </span>

            <div style={{
              display: 'flex',
              backgroundColor: '#F1F5F9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0'
            }}>
              <button
                onClick={() => setDatasetSelectionMode('preset')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: datasetSelectionMode === 'preset' ? '#FFFFFF' : 'transparent',
                  color: datasetSelectionMode === 'preset' ? '#0F172A' : '#64748B',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: datasetSelectionMode === 'preset' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Available Studies & Scenarios
              </button>
              <button
                onClick={() => setDatasetSelectionMode('upload')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: datasetSelectionMode === 'upload' ? '#FFFFFF' : 'transparent',
                  color: datasetSelectionMode === 'upload' ? '#0F172A' : '#64748B',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: datasetSelectionMode === 'upload' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Upload Custom CSV / Parquet
              </button>
            </div>
          </div>

          {/* Mode 1: Preset Datasets Grid */}
          {datasetSelectionMode === 'preset' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}>
              {[
                {
                  id: 'voidhacks',
                  name: 'VoidHacks8 2M Benchmark',
                  path: 'data/raw/VoidHacks8_MuleAccount_2M_Transactions.csv',
                  desc: '2,000,000 transactions • 24,873 accounts • Full nationwide network',
                  badge: 'Full Scale',
                  badgeBg: '#EFF6FF',
                  badgeColor: '#1D4ED8'
                },
                {
                  id: 'scen1',
                  name: 'Scenario 1: Fast Smurfing',
                  path: 'synthetic_data/scenario_1_fast_smurfing.csv',
                  desc: '12,500 txns • Sub-5 min rapid layering • Target: SBIN10009901',
                  badge: 'Smurfing',
                  badgeBg: '#ECFDF5',
                  badgeColor: '#047857'
                },
                {
                  id: 'scen2',
                  name: 'Scenario 2: Investment Fraud',
                  path: 'synthetic_data/scenario_2_investment_scam.csv',
                  desc: '18,240 txns • Telegram fake task funnel • Target: SBIN10008000',
                  badge: 'Investment Scam',
                  badgeBg: '#FFFBEB',
                  badgeColor: '#B45309'
                },
                {
                  id: 'scen3',
                  name: 'Scenario 3: Cyclic Mule Loop',
                  path: 'synthetic_data/scenario_3_cyclic_ring.csv',
                  desc: '14,100 txns • Circular round-trip topology • Target: AXIS10007701',
                  badge: 'Cyclic Ring',
                  badgeBg: '#FDF2F8',
                  badgeColor: '#BE185D'
                },
                {
                  id: 'scen4',
                  name: 'Scenario 4: Mega Capacity Test',
                  path: 'synthetic_data/scenario_4_mega_capacity_stress_test_500nodes.csv',
                  desc: '22,400 txns • High-capacity 500-node stress test • Target: SBIN10005001',
                  badge: '500 Nodes',
                  badgeBg: '#F5F3FF',
                  badgeColor: '#6D28D9'
                },
                {
                  id: 'custom',
                  name: 'Curated Forensic Sample',
                  path: 'synthetic_data/sample_custom_export.csv',
                  desc: 'Clean sample export with verified ground truth labels',
                  badge: 'Sample',
                  badgeBg: '#F1F5F9',
                  badgeColor: '#475569'
                }
              ].map(preset => {
                const isSelected = selectedPresetFile === preset.path;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetFile(preset.path)}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? '#EFF6FF' : '#F8FAFC',
                      border: `1.5px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>
                        {preset.name}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: preset.badgeBg,
                        color: preset.badgeColor,
                        fontSize: '0.6875rem',
                        fontWeight: 600
                      }}>
                        {preset.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, lineHeight: 1.35 }}>
                      {preset.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Mode 2: Drag & Drop Zone */
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              style={{
                backgroundColor: isDragOver ? '#EFF6FF' : '#F8FAFC',
                border: isDragOver ? '2px dashed #2563EB' : '2px dashed #CBD5E1',
                borderRadius: '8px',
                padding: '28px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                textAlign: 'center',
                transition: 'all 0.2s ease'
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
                justifyContent: 'center'
              }}>
                <Upload size={22} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                  Drag & drop evidence CSV or Parquet file here
                </p>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                  Supports bank transaction formats (HDFC, SBI, ICICI, Airtel Payments Bank, etc.) • processed 100% offline
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

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#2563EB',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  padding: '7px 18px',
                  borderRadius: '6px',
                  cursor: uploading ? 'wait' : 'pointer',
                  border: '1px solid #BFDBFE'
                }}
              >
                Browse Files
              </button>
            </div>
          )}

          {/* Action Trigger Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              onClick={() => handleLoadPreset(selectedPresetFile)}
              disabled={uploading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 24px',
                borderRadius: '8px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: uploading ? 'wait' : 'pointer',
                border: 'none',
                boxShadow: '0 2px 4px rgba(37,99,235,0.25)',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
            >
              <Play size={16} color="#FFFFFF" />
              <span>{uploading ? 'Indexing Study Data...' : 'Initialize & Index Study into DuckDB'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Active Study Pipeline Status Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <Database size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Active Forensic Study Pipeline
                </h2>
                <span style={{
                  backgroundColor: '#ECFDF5',
                  color: '#047857',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid #A7F3D0'
                }}>
                  Live in DuckDB
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                {currentDatasetFilename}
              </span>
            </div>
          </div>

          {/* Quick Navigators */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onNavigateToOverview}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
            >
              <span>Open Overview Dashboard</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={onNavigateToInvestigate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: '1px solid #CBD5E1',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              <span>Explore Money Trail Graph</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* 4-Step Pipeline Status */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          padding: '14px 16px',
          backgroundColor: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid #E2E8F0'
        }}>
          {[
            { label: 'File Parsing', desc: 'DuckDB native CSV/Parquet reader', hasLine: true },
            { label: 'Normalising', desc: 'Timestamp & Account harmonization', hasLine: true },
            { label: 'Graph Indexing', desc: 'Adjacency matrix generation', hasLine: true },
            { label: 'ML Anomaly Scoring', desc: 'Unsupervised Isolation Forest + SHAP', hasLine: false }
          ].map((step, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '9999px',
                  backgroundColor: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Check size={12} color="#FFFFFF" strokeWidth={3} />
                </div>
                {step.hasLine && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: '#2563EB'
                  }} />
                )}
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
                {step.label}
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                {step.desc}
              </span>
            </div>
          ))}
        </div>

        {/* 4 Metric Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '12px 16px'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, fontWeight: 500 }}>
              Transactions Indexed
            </p>
            <p style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#0F172A',
              margin: '2px 0 0 0',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {totalRowsFormatted}
            </p>
          </div>

          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '12px 16px'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, fontWeight: 500 }}>
              Unique Entities
            </p>
            <p style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#0F172A',
              margin: '2px 0 0 0',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {totalAccountsFormatted}
            </p>
          </div>

          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '12px 16px'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, fontWeight: 500 }}>
              Query Execution Latency
            </p>
            <p style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#047857',
              margin: '2px 0 0 0',
              fontVariantNumeric: 'tabular-nums'
            }}>
              &lt; 42 ms
            </p>
          </div>

          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '12px 16px'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, fontWeight: 500 }}>
              Air-Gapped Status
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <ShieldCheck size={18} color="#059669" />
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#047857' }}>
                100% Offline
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Previous Studies & Historical Datasets Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Previous Forensic Studies & Historical Evidence Ledgers
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Select any previous study or scenario to immediately reload its DuckDB graph index and view its overview
            </p>
          </div>

          <button
            onClick={fetchStudies}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={13} />
            <span>Refresh Studies</span>
          </button>
        </div>

        {/* Studies Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC'
              }}>
                <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Study Name & Case FIR</th>
                <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Dataset File</th>
                <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Volume</th>
                <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Analyst</th>
                <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Status</th>
                <th style={{ padding: '10px 14px', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {studies.map((study) => {
                const isActive = currentDatasetFilename.includes(study.dataset_filename) || study.dataset_filename.includes(currentDatasetFilename);
                const isLoadingThis = loadingStudyId === study.id;
                return (
                  <tr
                    key={study.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      backgroundColor: isActive ? '#F8FAFC' : '#FFFFFF',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>
                          {study.name}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                          {study.case_ref}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        color: '#334155'
                      }}>
                        {study.dataset_filename}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', color: '#475569' }}>
                        <span>{study.rows.toLocaleString()} txns</span>
                        <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{study.accounts.toLocaleString()} accounts</span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                        {study.analyst}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {isActive ? (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          backgroundColor: '#ECFDF5',
                          color: '#047857',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          border: '1px solid #A7F3D0'
                        }}>
                          Active Study
                        </span>
                      ) : (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          backgroundColor: '#F1F5F9',
                          color: '#475569',
                          fontSize: '0.6875rem',
                          fontWeight: 600
                        }}>
                          {study.status}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {isActive ? (
                        <button
                          onClick={onNavigateToOverview}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: '1px solid #BFDBFE',
                            cursor: 'pointer'
                          }}
                        >
                          View Dashboard →
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLoadPreset(study.filepath, study.id)}
                          disabled={uploading}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#2563EB',
                            color: '#FFFFFF',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            opacity: uploading ? 0.6 : 1
                          }}
                        >
                          {isLoadingThis ? 'Loading...' : 'Load This Study'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
