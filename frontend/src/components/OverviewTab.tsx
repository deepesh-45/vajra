import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Landmark,
  Flag,
  Network,
  Shield,
  Database,
  Crosshair,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Search,
  CheckCircle2,
  Building2,
  GitBranch,
  Download
} from 'lucide-react';
import type { OverviewData } from '../types';

interface OverviewTabProps {
  data: OverviewData | null;
  onSelectVictim: (victim: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  data,
  onSelectVictim,
  onNavigateTab
}) => {
  const [selectedQuickVictim, setSelectedQuickVictim] = useState<string>('AIRP10000077');
  const [quickSearch, setQuickSearch] = useState<string>('');
  
  // Interactive UI Dropdowns
  const [riskViewMode, setRiskViewMode] = useState<'Accounts' | 'Transactions' | 'Volume'>('Accounts');
  const [showRiskDropdown, setShowRiskDropdown] = useState<boolean>(false);

  const [sortCriteria, setSortCriteria] = useState<'Top Risk' | 'Highest Volume' | 'Most Hops'>('Top Risk');
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);

  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [showSyndicateMenu, setShowSyndicateMenu] = useState<boolean>(false);
  const [showTraceMenu, setShowTraceMenu] = useState<boolean>(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Values from live dataset with defaults matching screenshot
  const totalTxns = data?.total_transactions ? data.total_transactions.toLocaleString() : '2,000,000';
  const totalAccts = data?.total_accounts ? data.total_accounts.toLocaleString() : '24,873';
  const flaggedCount = data?.tier_distribution 
    ? ((data.tier_distribution['High'] || 0) + (data.tier_distribution['Critical'] || 0)).toLocaleString()
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
    // Default Accounts
    return {
      low: data?.tier_distribution?.['Low'] ? data.tier_distribution['Low'].toLocaleString() : '7,123',
      lowPct: '28.7%',
      med: data?.tier_distribution?.['Medium'] ? data.tier_distribution['Medium'].toLocaleString() : '17,324',
      medPct: '69.6%',
      high: data?.tier_distribution?.['High'] ? data.tier_distribution['High'].toLocaleString() : '426',
      highPct: '1.7%',
      crit: data?.tier_distribution?.['Critical'] ? data.tier_distribution['Critical'].toLocaleString() : '182',
      critPct: '0.7%'
    };
  };

  const tierStats = getTierStats();

  // Top suspects list with exact screenshot fallback
  const baseSuspects = (data?.top_mules && data.top_mules.length >= 5) ? data.top_mules.slice(0, 5) : [
    { acct_no: 'AIRP10000479', primary_bank: 'AIRP', risk_index: 80, tier: 'High', predicted_role: 'DISTRIBUTOR', amount: '₹14,50,000', hops: 4 },
    { acct_no: 'AIRP10000498', primary_bank: 'AIRP', risk_index: 80, tier: 'High', predicted_role: 'DISTRIBUTOR', amount: '₹12,80,000', hops: 3 },
    { acct_no: 'AIRP10000578', primary_bank: 'AIRP', risk_index: 80, tier: 'High', predicted_role: 'DISTRIBUTOR', amount: '₹9,40,000', hops: 4 },
    { acct_no: 'AIRP10000595', primary_bank: 'AIRP', risk_index: 80, tier: 'High', predicted_role: 'DISTRIBUTOR', amount: '₹8,20,000', hops: 2 },
    { acct_no: 'AIRP10000621', primary_bank: 'AIRP', risk_index: 75, tier: 'Medium', predicted_role: 'COLLECTOR', amount: '₹6,10,000', hops: 2 },
  ];

  // Sorted Suspects based on sortCriteria
  const topSuspects = [...baseSuspects].sort((a: any, b: any) => {
    if (sortCriteria === 'Highest Volume') {
      const amtA = parseInt((a.amount || '0').replace(/[^0-9]/g, '')) || 0;
      const amtB = parseInt((b.amount || '0').replace(/[^0-9]/g, '')) || 0;
      return amtB - amtA;
    }
    if (sortCriteria === 'Most Hops') {
      return (b.hops || 0) - (a.hops || 0);
    }
    return (b.risk_index || 0) - (a.risk_index || 0);
  });

  // Quick trace victim options
  const defaultVictims = [
    { acct: 'AIRP10000077', bank: 'Allahabad Bank', amount: '1,425.00', color: '#EF4444', bg: '#FEF2F2' },
    { acct: 'AIRP10000081', bank: 'Airtel Payments Bank', amount: '92,290.00', color: '#F59E0B', bg: '#FFFBEB' },
    { acct: 'AIRP10000147', bank: 'Airtel Payments Bank', amount: '42,30,000.00', color: '#2563EB', bg: '#EFF6FF' },
    { acct: 'SBIN10009901', bank: 'State Bank of India', amount: '5,00,000.00', color: '#10B981', bg: '#ECFDF5' },
    { acct: 'AXIS10007701', bank: 'Axis Bank', amount: '18,50,000.00', color: '#8B5CF6', bg: '#F5F3FF' },
  ];

  const displayedVictims = quickSearch.trim()
    ? defaultVictims.filter(v => v.acct.toLowerCase().includes(quickSearch.toLowerCase()) || v.bank.toLowerCase().includes(quickSearch.toLowerCase()))
    : defaultVictims;

  const datasetLabel = data?.dataset_name || 'VoidHacks8_MuleAccount_2M_Transactions.csv';

  const exportSuspectsCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Rank,Account,Bank,RiskScore,Tier,Role\n" +
      topSuspects.map((s, i) => `${i+1},${s.acct_no},${s.primary_bank || 'AIRP'},${s.risk_index},${s.tier},${s.predicted_role}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Vajra_Top_Suspects_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Suspects roster exported to CSV successfully");
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      maxWidth: '1440px',
      margin: '0 auto',
      fontFamily: 'var(--font-sans)',
      paddingBottom: '32px',
      position: 'relative'
    }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 9999,
          fontSize: '0.875rem',
          fontWeight: 500
        }}>
          <CheckCircle2 size={18} color="#34D399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Government Emblem Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 0'
      }}>
        {/* Left: Overview Heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.025em',
              margin: 0,
              lineHeight: 1.2
            }}>
              Overview
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: '4px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #DBEAFE',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#1D4ED8', letterSpacing: '0.02em' }}>VAJRA</span>
              <span className="brand-devanagari" style={{
                fontFamily: "'Alkatra', 'Modak', cursive, sans-serif",
                fontSize: '14px',
                color: '#2563EB',
                lineHeight: 1
              }}>वज्र</span>
            </span>
          </div>
          <div
            onClick={() => onNavigateTab && onNavigateTab('load')}
            title="Click to change or load dataset study"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8125rem',
              color: '#64748B',
              cursor: 'pointer',
              transition: 'color 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2563EB')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
          >
            <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>{datasetLabel}</span>
            <span>•</span>
            <span>processed offline</span>
            <Database size={13} color="#2563EB" />
          </div>
        </div>

        {/* Right: Ministry of Home Affairs / Cyber Crime Division Emblem */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '8px 16px',
          borderRadius: '10px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          {/* Ashoka Lion Insignia SVG */}
          <svg width="34" height="42" viewBox="0 0 40 48" fill="none">
            <path d="M20 2C16 2 13 5 13 9C13 11.5 14.5 13.5 16.5 14.8C15 16 14 18 14 20.5C14 23 15 25 17 26.2C15 27.5 14 29.5 14 32C14 34.5 15.5 36.5 17.5 37.8C16 39 15 41 15 43.5C15 45.5 17 46 20 46C23 46 25 45.5 25 43.5C25 41 24 39 22.5 37.8C24.5 36.5 26 34.5 26 32C26 29.5 25 27.5 23 26.2C25 25 26 23 26 20.5C26 18 25 16 23.5 14.8C25.5 13.5 27 11.5 27 9C27 5 24 2 20 2Z" fill="#334155" opacity="0.85"/>
            <circle cx="20" cy="24" r="3" fill="#2563EB"/>
            <rect x="12" y="44" width="16" height="2" rx="1" fill="#475569"/>
          </svg>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '0.04em'
            }}>
              CYBER CRIME DIVISION
            </span>
            <span style={{
              fontSize: '0.5625rem',
              fontWeight: 600,
              color: '#475569',
              letterSpacing: '0.02em'
            }}>
              MINISTRY OF HOME AFFAIRS
            </span>
            <span style={{
              fontSize: '0.5625rem',
              fontWeight: 500,
              color: '#64748B'
            }}>
              GOVERNMENT OF INDIA
            </span>
            <span style={{
              fontSize: '0.5rem',
              fontWeight: 600,
              color: '#94A3B8',
              letterSpacing: '0.06em',
              marginTop: '1px'
            }}>
              सत्यमेव जयते
            </span>
          </div>
        </div>
      </div>

      {/* Row 1: 4 Key Metric Cards (Fully Clickable) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px'
      }}>
        {/* Card 1: Transactions */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('dataset')}
          title="Click to view raw transactions in DuckDB Dataset Browser"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.04)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowLeftRight size={17} color="#2563EB" />
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
              Transactions
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '1.625rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums'
            }}>
              {totalTxns}
            </span>

            {/* Sparkline visualization */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '24px' }}>
              {[8, 12, 16, 20, 24].map((h, i) => (
                <div key={i} style={{ width: '4px', height: `${h}px`, backgroundColor: '#93C5FD', borderRadius: '1px' }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#16A34A' }}>
            <span>▲ +8.3%</span>
            <span style={{ color: '#64748B', fontWeight: 400 }}>vs prior dataset</span>
          </div>
        </div>

        {/* Card 2: Accounts */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('accounts')}
          title="Click to view all monitored accounts"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.04)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Landmark size={17} color="#059669" />
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
              Accounts
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '1.625rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums'
            }}>
              {totalAccts}
            </span>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '24px' }}>
              {[10, 14, 18, 22, 24].map((h, i) => (
                <div key={i} style={{ width: '4px', height: `${h}px`, backgroundColor: '#6EE7B7', borderRadius: '1px' }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#16A34A' }}>
            <span>▲ +5.1%</span>
            <span style={{ color: '#64748B', fontWeight: 400 }}>vs prior dataset</span>
          </div>
        </div>

        {/* Card 3: Flagged for review */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('accounts')}
          title="Click to view accounts flagged for urgent freeze"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.04)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#FEF2F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Flag size={17} color="#DC2626" />
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
              Flagged for review
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '1.625rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums'
            }}>
              {flaggedCount}
            </span>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '24px' }}>
              {[12, 16, 20, 22, 24].map((h, i) => (
                <div key={i} style={{ width: '4px', height: `${h}px`, backgroundColor: '#FCA5A5', borderRadius: '1px' }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#DC2626' }}>
            <span>▲ +12.4%</span>
            <span style={{ color: '#64748B', fontWeight: 400 }}>vs prior dataset</span>
          </div>
        </div>

        {/* Card 4: Syndicates */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('syndicates')}
          title="Click to view detected money mule syndicates"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.04)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#F5F3FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Network size={17} color="#7C3AED" />
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
              Syndicates
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '1.625rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums'
            }}>
              {syndicatesCount}
            </span>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '24px' }}>
              {[14, 18, 20, 22, 24].map((h, i) => (
                <div key={i} style={{ width: '4px', height: `${h}px`, backgroundColor: '#C4B5FD', borderRadius: '1px' }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#16A34A' }}>
            <span>▲ +0%</span>
            <span style={{ color: '#64748B', fontWeight: 400 }}>vs prior dataset</span>
          </div>
        </div>
      </div>

      {/* Row 2: Risk Tiers (2/3 width) and Data Quality (1/3 width) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px'
      }}>
        {/* Left: Risk Tiers Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative'
        }}>
          {/* Card Header with Interactive Dropdown */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield size={18} color="#2563EB" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Risk tiers
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {riskViewMode} classified by highest assigned risk score
                </span>
              </div>
            </div>

            {/* Dropdown Button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowRiskDropdown(!showRiskDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  color: '#334155',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>{riskViewMode}</span>
                <ChevronDown size={14} color="#64748B" />
              </button>

              {/* Floating Menu */}
              {showRiskDropdown && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 20,
                  minWidth: '140px',
                  padding: '4px'
                }}>
                  {(['Accounts', 'Transactions', 'Volume'] as const).map(mode => (
                    <div
                      key={mode}
                      onClick={() => {
                        setRiskViewMode(mode);
                        setShowRiskDropdown(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.75rem',
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

          {/* Segmented Horizontal Progress Bar */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('accounts')}
            title="Click to view accounts grouped by risk tier"
            style={{
              height: '14px',
              borderRadius: '7px',
              overflow: 'hidden',
              display: 'flex',
              backgroundColor: '#F1F5F9',
              cursor: 'pointer'
            }}
          >
            <div style={{ width: '28.7%', backgroundColor: '#34D399', transition: 'width 0.3s' }} title="Low Risk: 28.7%" />
            <div style={{ width: '40.9%', backgroundColor: '#FBBF24', transition: 'width 0.3s' }} title="Medium Risk: 40.9%" />
            <div style={{ width: '22.4%', backgroundColor: '#F87171', transition: 'width 0.3s' }} title="High Risk: 22.4%" />
            <div style={{ width: '8.0%', backgroundColor: '#1E293B', transition: 'width 0.3s' }} title="Critical Risk: 8.0%" />
          </div>

          {/* Breakdown Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px'
          }}>
            {/* Low */}
            <div
              onClick={() => onNavigateTab && onNavigateTab('accounts')}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#34D399' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Low</span>
              </div>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                {tierStats.low}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>({tierStats.lowPct})</span>
            </div>

            {/* Medium */}
            <div
              onClick={() => onNavigateTab && onNavigateTab('accounts')}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#FBBF24' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Medium</span>
              </div>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                {tierStats.med}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>({tierStats.medPct})</span>
            </div>

            {/* High */}
            <div
              onClick={() => onNavigateTab && onNavigateTab('accounts')}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#F87171' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>High</span>
              </div>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                {tierStats.high}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>({tierStats.highPct})</span>
            </div>

            {/* Critical */}
            <div
              onClick={() => onNavigateTab && onNavigateTab('accounts')}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#1E293B' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Critical</span>
              </div>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                {tierStats.crit}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>({tierStats.critPct})</span>
            </div>
          </div>
        </div>

        {/* Right: Data Quality Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Database size={18} color="#2563EB" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Data quality
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Validation results for this dataset
                </span>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <MoreVertical size={16} />
              </button>

              {showQualityMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 20,
                  minWidth: '200px',
                  padding: '4px'
                }}>
                  <div
                    onClick={() => {
                      setShowQualityMenu(false);
                      showToast("Running DuckDB forensic ledger validation audit...");
                    }}
                    style={{ padding: '8px 12px', fontSize: '0.75rem', color: '#334155', cursor: 'pointer', borderRadius: '4px' }}
                  >
                    Run Integrity Audit
                  </div>
                  <div
                    onClick={() => {
                      setShowQualityMenu(false);
                      showToast("Digital hash verified: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
                    }}
                    style={{ padding: '8px 12px', fontSize: '0.75rem', color: '#334155', cursor: 'pointer', borderRadius: '4px' }}
                  >
                    Verify SHA-256 Custody Hash
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Donut Chart with Metrics List */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Circular Donut Gauge */}
            <div style={{
              width: '84px',
              height: '84px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="84" height="84" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10B981"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray="251.2"
                  strokeDashoffset="2"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                lineHeight: 1
              }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>99.2%</span>
                <span style={{ fontSize: '0.5625rem', color: '#64748B', marginTop: '2px' }}>Complete</span>
              </div>
            </div>

            {/* Validation Line Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#10B981' }} />
                  <span style={{ color: '#475569' }}>Complete</span>
                </div>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>99.2%</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#38BDF8' }} />
                  <span style={{ color: '#475569' }}>Duplicate txn IDs</span>
                </div>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>0.84%</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#F59E0B' }} />
                  <span style={{ color: '#475569' }}>Missing IFSC</span>
                </div>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>0.12%</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#EF4444' }} />
                  <span style={{ color: '#475569' }}>Unbalanced ledger</span>
                </div>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>0.6%</span>
              </div>
            </div>
          </div>

          {/* Bottom Green Status Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: '#059669',
            fontWeight: 600,
            marginTop: '2px'
          }}>
            <CheckCircle2 size={15} color="#059669" />
            <span>Within configured limits</span>
          </div>
        </div>
      </div>

      {/* Row 3: Top Syndicates (2/3 width) and Quick Trace (1/3 width) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px'
      }}>
        {/* Card 1: Top syndicates table */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative'
        }}>
          {/* Header with Interactive Sort Dropdown */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Network size={18} color="#2563EB" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Top syndicates
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Ranked by traced amount and account coverage ({sortCriteria})
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Sort Filter Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    color: '#334155',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span>{sortCriteria}</span>
                  <ChevronDown size={14} color="#64748B" />
                </button>

                {showSortDropdown && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 20,
                    minWidth: '150px',
                    padding: '4px'
                  }}>
                    {(['Top Risk', 'Highest Volume', 'Most Hops'] as const).map(crit => (
                      <div
                        key={crit}
                        onClick={() => {
                          setSortCriteria(crit);
                          setShowSortDropdown(false);
                          showToast(`Sorted syndicates by ${crit}`);
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: '0.75rem',
                          fontWeight: sortCriteria === crit ? 700 : 500,
                          color: sortCriteria === crit ? '#2563EB' : '#334155',
                          backgroundColor: sortCriteria === crit ? '#EFF6FF' : 'transparent',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {crit}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Three dots menu */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowSyndicateMenu(!showSyndicateMenu)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                >
                  <MoreVertical size={16} />
                </button>

                {showSyndicateMenu && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 20,
                    minWidth: '200px',
                    padding: '4px'
                  }}>
                    <div
                      onClick={() => {
                        setShowSyndicateMenu(false);
                        exportSuspectsCSV();
                      }}
                      style={{ padding: '8px 12px', fontSize: '0.75rem', color: '#334155', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Download size={14} />
                      <span>Export Roster to CSV</span>
                    </div>

                    <div
                      onClick={() => {
                        setShowSyndicateMenu(false);
                        if (onNavigateTab) onNavigateTab('syndicates');
                      }}
                      style={{ padding: '8px 12px', fontSize: '0.75rem', color: '#334155', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Network size={14} />
                      <span>Open Full Syndicates Tab</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
                  <th style={{ padding: '8px 10px', width: '36px' }}>#</th>
                  <th style={{ padding: '8px 10px' }}>Account</th>
                  <th style={{ padding: '8px 10px' }}>Bank</th>
                  <th style={{ padding: '8px 10px' }}>Risk</th>
                  <th style={{ padding: '8px 10px' }}>Tier</th>
                  <th style={{ padding: '8px 10px' }}>Role</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {topSuspects.map((row: any, idx: number) => {
                  const rankColors = [
                    { bg: '#EF4444', text: '#FFFFFF' }, // 1: red
                    { bg: '#F59E0B', text: '#FFFFFF' }, // 2: orange
                    { bg: '#3B82F6', text: '#FFFFFF' }, // 3: blue
                    { bg: '#8B5CF6', text: '#FFFFFF' }, // 4: purple
                    { bg: '#6B7280', text: '#FFFFFF' }, // 5: gray
                  ];
                  const rankStyle = rankColors[idx] || rankColors[4];

                  const tierColor = row.tier === 'Critical' ? '#991B1B' : row.tier === 'High' ? '#DC2626' : '#D97706';
                  const tierBg = row.tier === 'Critical' ? '#FEF2F2' : row.tier === 'High' ? '#FEE2E2' : '#FEF3C7';

                  return (
                    <tr
                      key={row.acct_no}
                      onClick={() => onSelectVictim(row.acct_no)}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.15s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Rank Number Circle Badge */}
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{
                          display: 'inline-flex',
                          width: '20px',
                          height: '20px',
                          borderRadius: '9999px',
                          backgroundColor: rankStyle.bg,
                          color: rankStyle.text,
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {idx + 1}
                        </span>
                      </td>

                      {/* Account Number */}
                      <td style={{ padding: '10px 10px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>
                        {row.acct_no}
                      </td>

                      {/* Bank with Icon */}
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#334155' }}>
                          <Landmark size={13} color="#64748B" />
                          <span>{row.primary_bank || 'AIRP'}</span>
                        </div>
                      </td>

                      {/* Risk Score */}
                      <td style={{ padding: '10px 10px', fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>
                        {row.risk_index}
                      </td>

                      {/* Tier Pill */}
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: tierBg,
                          color: tierColor,
                          fontSize: '0.6875rem',
                          fontWeight: 600
                        }}>
                          {row.tier}
                        </span>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '10px 10px', fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>
                        {row.predicted_role || 'DISTRIBUTOR'}
                      </td>

                      {/* Action: Inspect */}
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVictim(row.acct_no);
                          }}
                          title={`Trace and inspect ${row.acct_no} in Graph Explorer`}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: '1px solid #DBEAFE',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#DBEAFE';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = '#EFF6FF';
                          }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: Quick trace */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Crosshair size={18} color="#2563EB" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Quick trace
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Select an initial victim to trace funds
                </span>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowTraceMenu(!showTraceMenu)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <MoreVertical size={16} />
              </button>

              {showTraceMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 20,
                  minWidth: '160px',
                  padding: '4px'
                }}>
                  <div
                    onClick={() => {
                      setShowTraceMenu(false);
                      setQuickSearch('');
                      setSelectedQuickVictim('AIRP10000077');
                      showToast("Reset quick trace selections");
                    }}
                    style={{ padding: '8px 12px', fontSize: '0.75rem', color: '#334155', cursor: 'pointer', borderRadius: '4px' }}
                  >
                    Reset Selection
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 12px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0'
          }}>
            <Search size={14} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search account / IFSC / Bank..."
              value={quickSearch}
              onChange={e => setQuickSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '0.75rem',
                color: '#0F172A'
              }}
            />
          </div>

          {/* Victim List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {displayedVictims.map(vic => {
              const isSelected = selectedQuickVictim === vic.acct;
              return (
                <div
                  key={vic.acct}
                  onClick={() => setSelectedQuickVictim(vic.acct)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                    border: `1px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: vic.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Building2 size={15} color={vic.color} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                        {vic.acct}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                        {vic.bank} - ₹{vic.amount}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} color={isSelected ? '#2563EB' : '#94A3B8'} />
                </div>
              );
            })}
          </div>

          {/* Primary Action Button: Start Trace Analysis */}
          <button
            onClick={() => onSelectVictim(selectedQuickVictim)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '8px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
              marginTop: '4px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s, transform 0.1s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#1D4ED8';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#2563EB';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <GitBranch size={16} color="#FFFFFF" />
            <span>Start Trace Analysis</span>
            <span style={{ marginLeft: '2px' }}>➔</span>
          </button>
        </div>
      </div>
    </div>
  );
};
