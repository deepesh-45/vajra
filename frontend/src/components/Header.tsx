import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  UploadCloud,
  CheckCircle2,
  X
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
}

export const Header: React.FC<HeaderProps> = ({
  activeTab: _activeTab,
  setActiveTab,
  telemetry: _telemetry,
  datasetName: _datasetName = 'No dataset loaded',
  totalTransactions: _totalTransactions = 0,
  onDatasetReload,
  onSelectPreset: _onSelectPreset,
  onSelectAccount
}) => {
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [_uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ accounts: any[]; transactions: any[] } | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [currentLang, setCurrentLang] = useState<'EN' | 'HI'>('EN');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
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

  return (
    <>
      <header className="no-print" style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        height: '64px',
        flexShrink: 0,
        zIndex: 50,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
      }}>
        {/* Left: Brand Identity Badge & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              VAJRA
            </span>
            <span className="brand-devanagari" style={{
              fontFamily: "'Alkatra', 'Modak', cursive, sans-serif",
              fontSize: '1.35rem',
              color: '#2563EB',
              lineHeight: 1
            }}>
              वज्र
            </span>
          </div>

          {/* Search Box */}
          <div ref={searchRef} style={{ width: '400px', position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0 14px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}>
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search account, transaction, IFSC, UTR, or keyword..."
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
                fontSize: '10px',
                fontWeight: 600,
                color: '#64748B',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '4px',
                padding: '2px 6px',
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
              top: '46px',
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

      {/* Right Side Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Day / Night Toggle Pill */}
          <div
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: '20px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: isDarkMode ? 'transparent' : '#FFFFFF',
              boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sun size={13} color={isDarkMode ? '#94A3B8' : '#F59E0B'} />
            </div>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: isDarkMode ? '#1E293B' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Moon size={13} color={isDarkMode ? '#60A5FA' : '#94A3B8'} />
            </div>
          </div>

          {/* Language Selector Dropdown */}
          <button
            onClick={() => {
              const next = currentLang === 'EN' ? 'HI' : 'EN';
              setCurrentLang(next);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#0F172A',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <span>{currentLang}</span>
            <ChevronDown size={14} color="#64748B" />
          </button>

          {/* Offline Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '20px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FEE2E2',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#DC2626'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#DC2626',
              display: 'inline-block'
            }} />
            <span>Offline</span>
          </div>

          {/* Notification Bell */}
          <div style={{ position: 'relative', cursor: 'pointer', padding: '6px' }}>
            <Bell size={18} color="#64748B" />
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              border: '1px solid #FFFFFF'
            }} />
          </div>

          {/* User Profile Avatar & Name */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            paddingLeft: '12px',
            borderLeft: '1px solid #E2E8F0',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.875rem',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)'
            }}>
              A
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>
                Ayush
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                  Cyber Analyst
                </span>
                <ChevronDown size={11} color="#64748B" />
              </div>
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
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
            padding: '28px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Upload Forensic Dataset
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '4px 0 0 0' }}>
                  Ingest bank statements with SHA-256 evidence hashing
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              style={{ display: 'none' }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #CBD5E1',
                borderRadius: '8px',
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: '#F8FAFC',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B82F6')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#CBD5E1')}
            >
              <UploadCloud size={36} color="#3B82F6" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>
                Click to browse or drop CSV statement file
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                Auto-detects SBI, HDFC, ICICI, Axis, PNB and custom schemas
              </div>
            </div>

            {uploadStatus && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: uploadStatus.startsWith('Error') ? '#FEF2F2' : '#EFF6FF',
                border: `1px solid ${uploadStatus.startsWith('Error') ? '#FEE2E2' : '#DBEAFE'}`,
                color: uploadStatus.startsWith('Error') ? '#DC2626' : '#2563EB',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} />
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
