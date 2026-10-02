import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Database,
  X,
  UserCheck
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
  utilityText?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab: _activeTab,
  setActiveTab,
  telemetry: _telemetry,
  datasetName = 'VoidHacks8_MuleAccount_2M_Transactions.csv',
  totalTransactions = 2000000,
  onDatasetReload: _onDatasetReload,
  onSelectPreset: _onSelectPreset,
  onSelectAccount,
  isSidebarCollapsed = false,
  onToggleSidebar,
  utilityText
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ accounts: any[]; transactions: any[] } | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
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

  const displayName = datasetName.replace('.csv', '').replace('.parquet', '');

  return (
    <header className="no-print" style={{
      backgroundColor: '#FFFFFF',
      borderBottom: '2px solid var(--sidebar-border, #D5C7B5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      height: '64px',
      flexShrink: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(60, 45, 30, 0.04)',
      gap: '18px'
    }}>
      {/* Left: Creative Modern Hamburger + Hindi वज्र Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`hamburger-btn ${isSidebarCollapsed ? 'collapsed' : ''}`}
            title={isSidebarCollapsed ? "Expand Navigation Dock" : "Collapse Navigation Dock"}
            aria-label="Toggle navigation"
            style={{ border: '2px solid #D5C7B5' }}
          >
            <span className="hamburger-line hamburger-line-1" />
            <span className="hamburger-line hamburger-line-2" />
            <span className="hamburger-line hamburger-line-3" />
          </button>
        )}

        <span className="brand-devanagari" style={{
          fontFamily: "'Alkatra', 'Modak', cursive, sans-serif",
          fontSize: '1.85rem',
          lineHeight: 1,
          color: '#2563EB',
          fontWeight: 700,
          letterSpacing: '0.04em',
          userSelect: 'none',
          marginLeft: '2px',
          textShadow: '0 1px 2px rgba(37,99,235,0.1)'
        }}>
          वज्र
        </span>
      </div>

      {/* Center: Full Navbar Global Search Command Bar */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        minWidth: 0
      }}>
        <div ref={searchRef} style={{ width: '100%', maxWidth: '820px', position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 14px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#FAF7F2',
            border: '2px solid #D5C7B5',
            boxShadow: '0 1px 2px rgba(60, 45, 30, 0.03)',
            transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s'
          }}>
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search suspect account, UTR, IFSC, or bank across 2,000,000 records..."
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
                fontSize: '0.84rem',
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
                <X size={15} />
              </button>
            ) : (
              <span style={{
                fontSize: '9.5px',
                fontWeight: 600,
                color: '#64748B',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #D5C7B5',
                borderRadius: '5px',
                padding: '2px 6px',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap'
              }}>
                Ctrl K
              </span>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && searchResults && (
            <div style={{
              position: 'absolute',
              top: '46px',
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              border: '2px solid #D5C7B5',
              borderRadius: '10px',
              boxShadow: '0 12px 28px -4px rgba(60, 45, 30, 0.12)',
              zIndex: 100,
              maxHeight: '380px',
              overflowY: 'auto',
              padding: '8px'
            }}>
              {searchResults.accounts && searchResults.accounts.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', padding: '4px 8px', textTransform: 'uppercase' }}>
                    Matching Accounts ({searchResults.accounts.length})
                  </div>
                  {searchResults.accounts.map((acct: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (onSelectAccount) onSelectAccount(acct.acct_no);
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
                        fontSize: '12.5px'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EFF6FF')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0F172A' }}>
                        {acct.acct_no}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: acct.is_mule ? '#FEE2E2' : '#E2E8F0',
                        color: acct.is_mule ? '#DC2626' : '#475569',
                        fontWeight: 700,
                        border: `1px solid ${acct.is_mule ? '#FCA5A5' : '#CBD5E1'}`
                      }}>
                        {acct.is_mule ? 'SUSPECT MULE' : 'ACCOUNT'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.transactions && searchResults.transactions.length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', padding: '4px 8px', textTransform: 'uppercase' }}>
                    Matching Transactions ({searchResults.transactions.length})
                  </div>
                  {searchResults.transactions.slice(0, 6).map((tx: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (onSelectAccount) onSelectAccount(tx.src_acct);
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
                        fontSize: '12.5px'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EFF6FF')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#2563EB', fontWeight: 600 }}>
                          {tx.src_acct}
                        </span>
                        <span style={{ color: '#94A3B8', margin: '0 8px' }}>➔</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#0F172A' }}>
                          {tx.dst_acct}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                        ₹{Number(tx.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {(!searchResults.accounts || searchResults.accounts.length === 0) &&
               (!searchResults.transactions || searchResults.transactions.length === 0) && (
                <div style={{ padding: '14px', textAlign: 'center', fontSize: '12.5px', color: '#64748B' }}>
                  No matching account or transaction found.
                </div>
              )}
            </div>
          )}
        </div>

        {utilityText && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: '8px',
            backgroundColor: '#EFF6FF',
            border: '1.5px solid #BFDBFE',
            color: '#1D4ED8',
            fontSize: '0.8125rem',
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}>
            {utilityText}
          </div>
        )}
      </div>

      {/* Right: Active Records Badge + Guest Account Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
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
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8' }}>
              {displayName.length > 20 ? displayName.slice(0, 20) + '...' : displayName}
            </span>
            <span style={{ fontSize: '9.5px', color: '#3B82F6' }}>
              {totalTransactions.toLocaleString()} Records Active
            </span>
          </div>
        </div>

        {/* Guest User Profile Badge */}
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
            G
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Guest
              <UserCheck size={11} color="#059669" />
            </span>
            <span style={{ fontSize: '0.65rem', color: '#64748B' }}>
              Viewer Mode
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
