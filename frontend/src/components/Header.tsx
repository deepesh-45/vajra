import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  UploadCloud,
  CheckCircle2,
  Database,
  X,
  FileSpreadsheet
} from 'lucide-react';
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
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab: _activeTab,
  setActiveTab,
  telemetry: _telemetry,
  datasetName = 'VoidHacks8_MuleAccount_2M_Transactions.csv',
  totalTransactions = 2000000,
  onDatasetReload,
  onSelectPreset: _onSelectPreset,
  onSelectAccount,
  isSidebarCollapsed = false,
  onToggleSidebar
}) => {
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ accounts: any[]; transactions: any[] } | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
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

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadStatus('Reading and analyzing bank file...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch('/api/ingest/upload', {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) throw new Error('Failed to load bank file');

      setUploadStatus('File indexed successfully! Updating workbench...');
      setTimeout(() => {
        setUploading(false);
        setShowUploadModal(false);
        setUploadStatus(null);
        if (onDatasetReload) onDatasetReload();
      }, 700);
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message}`);
      setUploading(false);
    }
  };

  const displayName = datasetName.replace('.csv', '').replace('.parquet', '');

  return (
    <>
      <header className="no-print" style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '62px',
        flexShrink: 0,
        zIndex: 50,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)'
      }}>
        {/* Left: Creative Hamburger + Hindi Brand + Modern Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Creative Modern Hamburger Button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`hamburger-btn ${isSidebarCollapsed ? 'collapsed' : ''}`}
              title={isSidebarCollapsed ? "Expand Navigation Panel" : "Collapse Navigation Panel"}
              aria-label="Toggle navigation"
            >
              <span className="hamburger-line hamburger-line-1" />
              <span className="hamburger-line hamburger-line-2" />
              <span className="hamburger-line hamburger-line-3" />
            </button>
          )}

          {/* Hindi Brand Name: Simply वज्र */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span className="brand-devanagari" style={{
              fontFamily: "'Alkatra', 'Modak', cursive, sans-serif",
              fontSize: '1.65rem',
              color: '#2563EB',
              lineHeight: 1,
              fontWeight: 700
            }}>
              वज्र
            </span>
          </div>

          {/* Modern Search Box */}
          <div ref={searchRef} style={{ width: '420px', position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0 14px',
              height: '38px',
              borderRadius: '9px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}>
              <Search size={15} color="#64748B" />
              <input
                type="text"
                placeholder="Search account, transaction ID, IFSC, or narration..."
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
                  color: '#0F172A'
                }}
              />
              {searchQuery ? (
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
                    color: '#94A3B8',
                    padding: '2px',
                    display: 'flex'
                  }}
                >
                  <X size={14} />
                </button>
              ) : (
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 600,
                  color: '#64748B',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '4px',
                  padding: '2px 5px',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap'
                }}>
                  Ctrl K
                </span>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchDropdown && searchResults && (
              <div style={{
                position: 'absolute',
                top: '44px',
                left: 0,
                right: 0,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                maxHeight: '340px',
                overflowY: 'auto',
                zIndex: 1000,
                padding: '8px'
              }}>
                {searchResults.accounts.length === 0 && searchResults.transactions.length === 0 ? (
                  <div style={{ padding: '14px', fontSize: '0.8125rem', color: '#64748B', textAlign: 'center' }}>
                    No matching accounts or transactions found
                  </div>
                ) : (
                  <>
                    {searchResults.accounts.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px' }}>
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
                              padding: '8px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.8125rem',
                              transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0F172A' }}>
                              {acc.acct_no}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              {acc.bank} • {acc.ifsc}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.transactions.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px' }}>
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
                              padding: '8px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              fontSize: '0.75rem',
                              transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0F172A' }}>{txn.txn_id}</span>
                              <span style={{ fontWeight: 600, color: '#2563EB' }}>₹{txn.amount?.toLocaleString()}</span>
                            </div>
                            <div style={{ color: '#64748B', fontSize: '0.6875rem' }}>
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
        </div>

        {/* Right Side: Clean Evidence Badge + Load Evidence Button + Officer Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Active Evidence Dataset Badge */}
          <div
            onClick={() => setActiveTab('load')}
            title="Click to view loaded data or switch scenario"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 12px',
              borderRadius: '8px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              cursor: 'pointer',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#DBEAFE')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#EFF6FF')}
          >
            <Database size={14} color="#2563EB" />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#1D4ED8' }}>
                {displayName.length > 22 ? displayName.slice(0, 22) + '...' : displayName}
              </span>
              <span style={{ fontSize: '10px', color: '#3B82F6' }}>
                {totalTransactions.toLocaleString()} Records Active
              </span>
            </div>
          </div>

          {/* Quick Load/Upload Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 13px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <UploadCloud size={14} color="#2563EB" />
            <span>Load Evidence</span>
          </button>

          {/* Investigating Officer Profile Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '8px',
            borderLeft: '1px solid #E2E8F0'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.8125rem',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}>
              A
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A' }}>
                Ayush Sharma
              </span>
              <span style={{ fontSize: '0.65rem', color: '#64748B' }}>
                Cyber Crime Branch
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Dataset Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Load Bank Statement File
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '3px 0 0 0' }}>
                  Load evidence CSV or Parquet into the offline investigation database
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              style={{
                border: '2px dashed #CBD5E1',
                borderRadius: '8px',
                padding: '28px 16px',
                textAlign: 'center',
                backgroundColor: uploading ? '#F1F5F9' : '#F8FAFC',
                cursor: uploading ? 'wait' : 'pointer',
                opacity: uploading ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                if (!uploading) {
                  e.currentTarget.style.borderColor = '#2563EB';
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                }
              }}
              onMouseLeave={e => {
                if (!uploading) {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                }
              }}
            >
              <FileSpreadsheet size={32} color="#2563EB" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                {uploading ? 'Processing File...' : 'Click to browse bank statement CSV'}
              </p>
              <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '4px 0 0 0' }}>
                All processing happens locally and 100% offline
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.parquet"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
              />
            </div>

            {uploadStatus && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} color="#059669" />
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
