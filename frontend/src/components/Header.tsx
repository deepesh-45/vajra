import React, { useState, useRef, useEffect } from 'react';
import type { SystemStats, DatasetPreset } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  telemetry: SystemStats | null;
  datasetName?: string;
  totalTransactions?: number;
  onDatasetReload?: () => void;
  onSelectPreset?: (preset: DatasetPreset) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  telemetry,
  datasetName = 'VoidHacks8_MuleAccount_2 • 2M txns',
  totalTransactions = 2000000,
  onDatasetReload,
  onSelectPreset
}) => {
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [availablePresets, setAvailablePresets] = useState<DatasetPreset[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/datasets')
      .then(res => res.json())
      .then(data => {
        if (data.datasets) setAvailablePresets(data.datasets);
      })
      .catch(console.error);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus('Uploading & indexing dataset...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch('http://127.0.0.1:8000/api/ingest/upload', {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) throw new Error('Failed to ingest dataset');

      setUploadStatus('Ingestion complete! Updating workbench...');
      setTimeout(() => {
        setUploading(false);
        setShowUploadModal(false);
        setUploadStatus(null);
        if (onDatasetReload) onDatasetReload();
      }, 800);
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message}`);
      setUploading(false);
    }
  };

  const handleSelectDatasetPreset = async (preset: DatasetPreset) => {
    setUploading(true);
    setUploadStatus(`Loading ${preset.name}...`);
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: preset.filepath })
      });

      if (!resp.ok) throw new Error('Failed to load dataset');

      setUploadStatus(`${preset.name} loaded successfully!`);
      setTimeout(() => {
        setUploading(false);
        setShowUploadModal(false);
        setUploadStatus(null);
        if (onSelectPreset) {
          onSelectPreset(preset);
        } else if (onDatasetReload) {
          onDatasetReload();
        }
      }, 700);
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message}`);
      setUploading(false);
    }
  };

  const cleanDatasetName = datasetName.replace('.csv', '').replace('_Transactions', '').slice(0, 22);
  const txCountStr = totalTransactions >= 1000000 
    ? `${(totalTransactions / 1000000).toFixed(0)}M txns` 
    : `${totalTransactions.toLocaleString()} txns`;

  return (
    <header style={{
      backgroundColor: '#111D16',
      borderBottom: '1px solid #22372B',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50
    }}>
      {/* Top Main Bar */}
      <div style={{
        padding: '12px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Left: Standard Crest & Clean Typography */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#1B2E23',
            border: '1px solid #2C4738',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#A7F3D0',
            fontWeight: 800,
            fontSize: '17px',
            fontFamily: 'serif'
          }}>
            व
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#F9F7F2',
                letterSpacing: '-0.2px',
                margin: 0,
                lineHeight: 1.2
              }}>
                Operation Vajra
              </h1>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(167, 243, 208, 0.1)',
                color: '#A7F3D0',
                border: '1px solid rgba(167, 243, 208, 0.2)',
                fontWeight: 600
              }}>
                Indore Police Cyber Cell
              </span>
            </div>
            <p style={{
              fontSize: '11.5px',
              color: '#8CA393',
              margin: '2px 0 0 0',
              fontWeight: 400
            }}>
              Air-Gapped Financial Cybercrime & Money Mule Investigation Workbench
            </p>
          </div>
        </div>

        {/* Right: Consolidated, Non-Duplicate Telemetry Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Single Dedicated Dataset Switcher Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: '#18281F',
              border: '1px solid #2C4738',
              fontSize: '12px',
              color: '#F9F7F2',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#20362A')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#18281F')}
            title="Click to switch or upload bank datasets"
          >
            <span style={{ color: '#8CA393' }}>Dataset:</span>
            <span style={{ fontWeight: 600, color: '#EBF4EC' }}>{cleanDatasetName}</span>
            <span style={{ color: '#A7F3D0', fontSize: '11px' }}>({txCountStr})</span>
            <span style={{ color: '#8CA393', fontSize: '10px', marginLeft: '2px' }}>▼</span>
          </button>

          {/* Offline Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(4, 120, 87, 0.2)',
            border: '1px solid rgba(167, 243, 208, 0.25)',
            color: '#6EE7B7',
            fontSize: '11.5px',
            fontWeight: 600
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10B981'
            }} />
            <span>Air-Gapped</span>
          </div>

          {/* Compact Hardware Telemetry */}
          <div style={{
            fontSize: '11.5px',
            color: '#8CA393',
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: '#18281F',
            border: '1px solid #2C4738'
          }}>
            <span>RAM: <strong style={{ color: '#F9F7F2' }}>{telemetry ? `${telemetry.process_ram_mb} MB` : '172 MB'}</strong></span>
            <span style={{ margin: '0 6px', color: '#3A5243' }}>|</span>
            <span>CPU: <strong style={{ color: '#F9F7F2' }}>{telemetry ? `${telemetry.cpu_percent}%` : '4%'}</strong></span>
          </div>

          {/* Analyst Badge */}
          <div style={{
            padding: '5px 12px',
            borderRadius: '6px',
            backgroundColor: '#18281F',
            border: '1px solid #2C4738',
            fontSize: '11.5px',
            color: '#F9F7F2',
            fontWeight: 500
          }}>
            <span style={{ color: '#8CA393' }}>Officer:</span> <strong style={{ color: '#A7F3D0' }}>Indore CyberCell</strong>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar — Clean, No Redundant Buttons */}
      <div style={{
        padding: '0 28px',
        backgroundColor: '#14221A',
        borderTop: '1px solid #22372B',
        display: 'flex',
        alignItems: 'center'
      }}>
        <nav style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'overview', label: 'Overview & Summary' },
            { id: 'investigate', label: 'Victim Investigation & Trail' },
            { id: 'legal', label: 'Case Diary & Freeze Notices' },
            { id: 'bench', label: 'System Benchmarks & AI Testing' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#FFFFFF' : '#8CA393',
                  backgroundColor: 'transparent',
                  borderBottom: isActive ? '2px solid #10B981' : '2px solid transparent',
                  borderRadius: 0,
                  transition: 'color 0.15s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.color = '#EBF4EC';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.color = '#8CA393';
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dataset Selection Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(17, 29, 22, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px 28px',
            width: '720px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            border: '1px solid #E0D8CA'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#16241B', margin: 0 }}>
                  Select or Upload Transaction Dataset
                </h2>
                <p style={{ fontSize: '12.5px', color: '#536458', margin: '4px 0 0 0' }}>
                  Choose a verified benchmark scenario or import custom multi-bank statement CSV
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: '1px solid #E0D8CA',
                  backgroundColor: '#F9F7F2',
                  cursor: 'pointer',
                  color: '#536458',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {uploadStatus && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: uploadStatus.includes('Error') ? '#FEF2F2' : '#EDFBF4',
                border: uploadStatus.includes('Error') ? '1px solid #FECACA' : '1px solid #BBF7D0',
                color: uploadStatus.includes('Error') ? '#991B1B' : '#047857',
                fontSize: '12.5px',
                fontWeight: 600
              }}>
                {uploadStatus}
              </div>
            )}

            {/* Presets List */}
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#8C7853', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Pre-Loaded Investigation Scenarios
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                {availablePresets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => !uploading && handleSelectDatasetPreset(preset)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E0D8CA',
                      backgroundColor: '#FAF8F5',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background-color 0.15s, border-color 0.15s'
                    }}
                    onMouseEnter={e => {
                      if (!uploading) {
                        e.currentTarget.style.borderColor = '#065F46';
                        e.currentTarget.style.backgroundColor = '#EDF5EC';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!uploading) {
                        e.currentTarget.style.borderColor = '#E0D8CA';
                        e.currentTarget.style.backgroundColor = '#FAF8F5';
                      }
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#16241B' }}>{preset.name}</span>
                        {preset.id === 'synthetic_mega_capacity' && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#065F46',
                            color: '#FFFFFF'
                          }}>
                            500+ NODES CAPACITY
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#536458', marginTop: '2px' }}>
                        {preset.description}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '11px', color: '#536458' }}>
                        <span>Flows: <strong style={{ color: '#16241B' }}>{preset.edges?.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>Victim: <strong style={{ color: '#065F46', fontFamily: 'var(--font-mono)' }}>{preset.default_victim}</strong></span>
                      </div>
                    </div>

                    <button
                      disabled={uploading}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#065F46',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: uploading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Load Case
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Upload */}
            <div style={{ borderTop: '1px solid #E0D8CA', paddingTop: '14px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#8C7853', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Upload Multi-Bank Statement (CSV)
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed #C9BEAC',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: '#FAF8F5',
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#16241B' }}>
                  Click to select bank statement CSV
                </div>
                <div style={{ fontSize: '11.5px', color: '#536458', marginTop: '2px' }}>
                  Headers are mapped automatically; processed in sub-second memory tables
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
