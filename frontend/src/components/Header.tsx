import React, { useState, useRef, useEffect } from 'react';
import { Settings } from 'lucide-react';
import type { SystemStats, DatasetPreset } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  telemetry: SystemStats | null;
  datasetName?: string;
  totalTransactions?: number;
  onDatasetReload?: () => void;
  onSelectPreset?: (preset: DatasetPreset) => void;
  onSelectAccount?: (acct: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  telemetry,
  datasetName = 'No dataset loaded',
  totalTransactions = 0,
  onDatasetReload,
  onSelectPreset: _onSelectPreset,
  onSelectAccount
}) => {
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ accounts: any[]; transactions: any[] } | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [currentLang, setCurrentLang] = useState<'EN' | 'HI'>('EN');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data);
          setShowSearchDropdown(true);
        })
        .catch(() => setSearchResults(null));
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus('Uploading & indexing dataset...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch('/api/ingest/upload', {
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

  const cleanDatasetName = datasetName.replace('.csv', '').replace('_Transactions', '').slice(0, 28);
  const txCountStr = totalTransactions > 0
    ? (totalTransactions >= 1000000 
        ? `${(totalTransactions / 1000000).toFixed(1)}M rows` 
        : `${totalTransactions.toLocaleString()} rows`)
    : '0 rows';

  return (
    <>
      <header style={{
        backgroundColor: '#F5EEE5',
        borderBottom: '1px solid #D2BFA8',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        height: '56px',
        gap: '24px',
        flexShrink: 0,
        zIndex: 50
      }}>
        {/* App Name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '220px',
          minWidth: '220px',
          fontWeight: 600,
          fontSize: '1rem',
          color: '#34271E',
          letterSpacing: '-0.025em'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34271E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span>Vajra</span>
        </div>

        {/* Global Search with Live Backend Dropdown */}
        <div ref={searchRef} style={{ flex: 1, maxWidth: '440px', position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 12px',
            height: '36px',
            borderRadius: '4px',
            backgroundColor: '#FBF7F0',
            border: '1px solid #D2BFA8',
            color: '#34271E',
            fontSize: '0.875rem'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8C7764" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search account, transaction, or IFSC..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults && (searchResults.accounts.length > 0 || searchResults.transactions.length > 0)) {
                  setShowSearchDropdown(true);
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  if (onSelectAccount) {
                    onSelectAccount(searchQuery.trim().toUpperCase());
                    setActiveTab('investigate');
                    setShowSearchDropdown(false);
                  }
                }
              }}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.8125rem',
                color: '#34271E'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                  setShowSearchDropdown(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8C7764',
                  padding: '2px',
                  display: 'flex'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchResults && (
            <div style={{
              position: 'absolute',
              top: '42px',
              left: 0,
              right: 0,
              backgroundColor: '#FBF7F0',
              border: '1px solid #D2BFA8',
              borderRadius: '6px',
              boxShadow: 'var(--shadow-md)',
              maxHeight: '340px',
              overflowY: 'auto',
              zIndex: 1000,
              padding: '6px'
            }}>
              {searchResults.accounts.length === 0 && searchResults.transactions.length === 0 ? (
                <div style={{ padding: '12px', fontSize: '0.8125rem', color: '#8C7764', textAlign: 'center' }}>
                  No matching accounts or transactions found
                </div>
              ) : (
                <>
                  {searchResults.accounts.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#8C7764', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px' }}>
                        Matching Accounts ({searchResults.accounts.length})
                      </div>
                      {searchResults.accounts.map(acc => (
                        <div
                          key={acc.acct_no}
                          onClick={() => {
                            if (onSelectAccount) onSelectAccount(acc.acct_no);
                            setActiveTab('investigate');
                            setShowSearchDropdown(false);
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.8125rem',
                            borderBottom: '1px solid #F5EEE5'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E8D8C3')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#34271E' }}>
                            {acc.acct_no}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#8C7764' }}>
                            {acc.bank} • {acc.ifsc}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.transactions.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#8C7764', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px' }}>
                        Matching Transactions ({searchResults.transactions.length})
                      </div>
                      {searchResults.transactions.slice(0, 5).map(txn => (
                        <div
                          key={txn.txn_id}
                          onClick={() => {
                            if (onSelectAccount) onSelectAccount(txn.src);
                            setActiveTab('investigate');
                            setShowSearchDropdown(false);
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            fontSize: '0.75rem'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E8D8C3')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#34271E' }}>{txn.txn_id}</span>
                            <span style={{ fontWeight: 600, color: '#34271E' }}>₹{txn.amount?.toLocaleString()}</span>
                          </div>
                          <div style={{ color: '#8C7764', fontSize: '0.6875rem' }}>
                            {txn.src} → {txn.dst} • {txn.narration || 'Transfer'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Side Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
          {/* Language Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: '#FBF7F0',
            border: '1px solid #D2BFA8'
          }}>
            <button
              onClick={() => setCurrentLang('EN')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: currentLang === 'EN' ? 700 : 400,
                color: currentLang === 'EN' ? '#34271E' : '#8C7764',
                padding: '2px 4px'
              }}
            >
              EN
            </button>
            <span style={{ color: '#D2BFA8' }}>|</span>
            <button
              onClick={() => {
                setCurrentLang('HI');
                setActiveTab('legal');
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: currentLang === 'HI' ? 700 : 400,
                color: currentLang === 'HI' ? '#34271E' : '#8C7764',
                padding: '2px 4px'
              }}
            >
              हिं
            </button>
          </div>

          {/* Offline Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '4px',
            backgroundColor: '#E8D8C3',
            border: '1px solid #D2BFA8',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#34271E'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Offline
          </div>

          {/* Dataset Status */}
          <div
            onClick={() => setShowUploadModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '16px',
              borderLeft: '1px solid #D2BFA8',
              fontSize: '0.75rem',
              color: '#8C7764',
              cursor: 'pointer'
            }}
          >
            <span>{cleanDatasetName}</span>
            <span>•</span>
            <span>{txCountStr}</span>
            <span>•</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#34271E', fontSize: '0.6875rem' }}>
              {telemetry ? `RAM ${telemetry.process_ram_mb}MB` : '—'}
            </span>
          </div>

          <button
            onClick={() => setActiveTab('settings')}
            title="Workstation Settings"
            aria-label="Settings"
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#34271E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: activeTab === 'settings' ? '#D2BFA8' : 'transparent',
              transition: 'background-color 0.15s'
            }}
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Dataset Selection Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(52, 39, 30, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FBF7F0',
            borderRadius: '4px',
            padding: '24px 28px',
            width: '720px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(52, 39, 30, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            border: '1px solid #D2BFA8'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-serif)',
                  color: '#34271E',
                  margin: 0
                }}>
                  Select or Upload Dataset
                </h2>
                <p style={{ fontSize: '0.8125rem', color: '#8C7764', margin: '4px 0 0 0' }}>
                  Choose a benchmark scenario or import custom bank statement CSV
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '4px',
                  border: '1px solid #D2BFA8',
                  backgroundColor: '#F5EEE5',
                  cursor: 'pointer',
                  color: '#8C7764',
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
                borderRadius: '4px',
                backgroundColor: '#E8D8C3',
                border: '1px solid #D2BFA8',
                color: '#34271E',
                fontSize: '0.8125rem',
                fontWeight: 600
              }}>
                {uploadStatus}
              </div>
            )}

            {/* Primary Ledger File Upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.parquet"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #B89C7D',
                  borderRadius: '6px',
                  padding: '32px 24px',
                  textAlign: 'center',
                  backgroundColor: '#F5EEE5',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s, border-color 0.15s'
                }}
                onMouseEnter={e => {
                  if (!uploading) e.currentTarget.style.backgroundColor = '#E8D8C3';
                }}
                onMouseLeave={e => {
                  if (!uploading) e.currentTarget.style.backgroundColor = '#F5EEE5';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#E8D8C3',
                  margin: '0 auto 12px auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34271E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#34271E' }}>
                  {uploading ? 'Processing Ledger...' : 'Click or Drop Bank Statement CSV Here'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#8C7764', marginTop: '4px' }}>
                  Supports ANY banking CSV export • Headers mapped automatically • Sub-second streaming SHA-256 seal
                </div>
                <button
                  disabled={uploading}
                  style={{
                    marginTop: '14px',
                    padding: '8px 18px',
                    borderRadius: '4px',
                    backgroundColor: '#34271E',
                    color: '#FBF7F0',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Browse Files
                </button>
              </div>
            </div>

            {/* Synthetic Data Bench Reference */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '4px',
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34271E' }}>
                📁 Need Test Scenarios? Check `/synthetic_data`
              </span>
              <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0, lineHeight: 1.4 }}>
                Curated simulation files with full topology documentation are located in <code>synthetic_data/</code>. Upload any file (e.g. <code>scenario_1_fast_smurfing.csv</code>) to measure loading latency and trace multi-hop chains.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
