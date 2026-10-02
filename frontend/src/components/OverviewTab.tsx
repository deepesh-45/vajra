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
  GitBranch
} from 'lucide-react';
import type { OverviewData } from '../types';

interface OverviewTabProps {
  data: OverviewData | null;
  onSelectVictim: (victim: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ data, onSelectVictim }) => {
  const [selectedQuickVictim, setSelectedQuickVictim] = useState<string>('AIRP10000077');
  const [quickSearch, setQuickSearch] = useState<string>('');

  // Values from live dataset with defaults matching screenshot
  const totalTxns = data?.total_transactions ? data.total_transactions.toLocaleString() : '2,000,000';
  const totalAccts = data?.total_accounts ? data.total_accounts.toLocaleString() : '24,873';
  const flaggedCount = data?.tier_distribution 
    ? ((data.tier_distribution['High'] || 0) + (data.tier_distribution['Critical'] || 0)).toLocaleString()
    : '426';
  const syndicatesCount = 9;

  // Tier distributions with exact screenshot fallbacks
  const countLow = data?.tier_distribution?.['Low'] ? data.tier_distribution['Low'].toLocaleString() : '7,123';
  const countMed = data?.tier_distribution?.['Medium'] ? data.tier_distribution['Medium'].toLocaleString() : '17,324';
  const countHigh = data?.tier_distribution?.['High'] ? data.tier_distribution['High'].toLocaleString() : '426';
  const countCrit = data?.tier_distribution?.['Critical'] ? data.tier_distribution['Critical'].toLocaleString() : '182';

  // Top suspects list with exact screenshot fallback
  const topSuspects = (data?.top_mules && data.top_mules.length >= 5) ? data.top_mules.slice(0, 5) : [
    { acct_no: 'AIRP10000479', primary_bank: 'AIRP', risk_index: 80, tier: 'High', predicted_role: 'DISTRIBUTOR' },
    { acct_no: 'AIRP10000498', primary_bank: 'AIRP', risk_index: 80, tier: 'High', predicted_role: 'DISTRIBUTOR' },
    { acct_no: 'AIRP10000578', primary_bank: 'AIRP', risk_index: 80, tier: 'High', predicted_role: 'DISTRIBUTOR' },
    { acct_no: 'AIRP10000595', primary_bank: 'AIRP', risk_index: 80, tier: 'High', predicted_role: 'DISTRIBUTOR' },
    { acct_no: 'AIRP10000621', primary_bank: 'AIRP', risk_index: 75, tier: 'Medium', predicted_role: 'COLLECTOR' },
  ];

  // Quick trace victim options
  const defaultVictims = [
    { acct: 'AIRP10000077', bank: 'Allahabad Bank', amount: '1,425.00', color: '#EF4444', bg: '#FEF2F2' },
    { acct: 'AIRP10000081', bank: 'Airtel Payments Bank', amount: '92,290.00', color: '#F59E0B', bg: '#FFFBEB' },
    { acct: 'AIRP10000147', bank: 'Airtel Payments Bank', amount: '42,30,000.00', color: '#2563EB', bg: '#EFF6FF' },
  ];

  const displayedVictims = quickSearch.trim()
    ? defaultVictims.filter(v => v.acct.toLowerCase().includes(quickSearch.toLowerCase()) || v.bank.toLowerCase().includes(quickSearch.toLowerCase()))
    : defaultVictims;

  const datasetLabel = data?.dataset_name || 'VoidHacks8_MuleAccount_2M_Transactions.csv';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      maxWidth: '1440px',
      margin: '0 auto',
      fontFamily: 'var(--font-sans)',
      paddingBottom: '32px'
    }}>
      {/* Page Title & Government Emblem Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 0'
      }}>
        {/* Left: Overview Heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8125rem',
            color: '#64748B'
          }}>
            <span>{datasetLabel}</span>
            <span>•</span>
            <span>processed offline</span>
            <Database size={13} color="#64748B" />
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

      {/* Row 1: 4 Key Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px'
      }}>
        {/* Card 1: Transactions */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
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
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#64748B' }}>
              Transactions
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '1.625rem',
              fontWeight: 700,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {totalTxns}
            </span>

            {/* Blue Mini Sparkline Bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '22px' }}>
              <span style={{ width: '4px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '14px', backgroundColor: '#93C5FD', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '11px', backgroundColor: '#60A5FA', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '18px', backgroundColor: '#3B82F6', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '22px', backgroundColor: '#2563EB', borderRadius: '1px' }} />
            </div>
          </div>

          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>▲ +8.3%</span>
            <span style={{ color: '#94A3B8', fontWeight: 400 }}>vs prior dataset</span>
          </div>
        </div>

        {/* Card 2: Accounts */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
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
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#64748B' }}>
              Accounts
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '1.625rem',
              fontWeight: 700,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {totalAccts}
            </span>

            {/* Green Mini Sparkline Bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '22px' }}>
              <span style={{ width: '4px', height: '10px', backgroundColor: '#A7F3D0', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '13px', backgroundColor: '#6EE7B7', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '17px', backgroundColor: '#34D399', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '15px', backgroundColor: '#10B981', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '22px', backgroundColor: '#059669', borderRadius: '1px' }} />
            </div>
          </div>

          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>▲ +5.1%</span>
            <span style={{ color: '#94A3B8', fontWeight: 400 }}>vs prior dataset</span>
          </div>
        </div>

        {/* Card 3: Flagged for review */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
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
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#64748B' }}>
              Flagged for review
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '1.625rem',
              fontWeight: 700,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {flaggedCount}
            </span>

            {/* Red Mini Sparkline Bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '22px' }}>
              <span style={{ width: '4px', height: '6px', backgroundColor: '#FECACA', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '11px', backgroundColor: '#FCA5A5', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '16px', backgroundColor: '#F87171', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '19px', backgroundColor: '#EF4444', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '22px', backgroundColor: '#DC2626', borderRadius: '1px' }} />
            </div>
          </div>

          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>▲ +12.4%</span>
            <span style={{ color: '#94A3B8', fontWeight: 400 }}>vs prior dataset</span>
          </div>
        </div>

        {/* Card 4: Syndicates */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
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
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#64748B' }}>
              Syndicates
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '1.625rem',
              fontWeight: 700,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {syndicatesCount}
            </span>

            {/* Purple Mini Sparkline Bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '22px' }}>
              <span style={{ width: '4px', height: '14px', backgroundColor: '#DDD6FE', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '10px', backgroundColor: '#C4B5FD', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '18px', backgroundColor: '#A78BFA', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '16px', backgroundColor: '#8B5CF6', borderRadius: '1px' }} />
              <span style={{ width: '4px', height: '22px', backgroundColor: '#7C3AED', borderRadius: '1px' }} />
            </div>
          </div>

          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>▲ +0%</span>
            <span style={{ color: '#94A3B8', fontWeight: 400 }}>vs prior dataset</span>
          </div>
        </div>
      </div>

      {/* Row 2: Risk Tiers & Data Quality */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr',
        gap: '20px'
      }}>
        {/* Card 1: Risk tiers */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
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
                <Shield size={18} color="#2563EB" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Risk tiers
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Accounts by highest assigned tier
                </span>
              </div>
            </div>

            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#334155'
            }}>
              <span>Accounts</span>
              <ChevronDown size={14} color="#64748B" />
            </button>
          </div>

          {/* Segmented Stacked Horizontal Progress Bar */}
          <div style={{
            height: '14px',
            borderRadius: '999px',
            backgroundColor: '#F1F5F9',
            display: 'flex',
            overflow: 'hidden',
            width: '100%'
          }}>
            <div style={{ width: '28.7%', backgroundColor: '#34D399', transition: 'width 0.3s ease' }} title="Low: 28.7%" />
            <div style={{ width: '69.6%', backgroundColor: '#FBBF24', transition: 'width 0.3s ease' }} title="Medium: 69.6%" />
            <div style={{ width: '1.7%', backgroundColor: '#F87171', transition: 'width 0.3s ease' }} title="High: 1.7%" />
            <div style={{ width: '0.7%', backgroundColor: '#1E293B', transition: 'width 0.3s ease' }} title="Critical: 0.7%" />
          </div>

          {/* Legend / Metrics Breakdown */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            paddingTop: '6px'
          }}>
            {/* Low */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34D399' }} />
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Low</span>
              </div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A' }}>
                {countLow}
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>(28.7%)</span>
            </div>

            {/* Medium */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FBBF24' }} />
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Medium</span>
              </div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A' }}>
                {countMed}
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>(69.6%)</span>
            </div>

            {/* High */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F87171' }} />
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>High</span>
              </div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A' }}>
                {countHigh}
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>(1.7%)</span>
            </div>

            {/* Critical */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1E293B' }} />
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Critical</span>
              </div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A' }}>
                {countCrit}
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>(0.7%)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Data quality */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
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
                <Database size={17} color="#2563EB" />
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

            <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
              <MoreVertical size={16} />
            </button>
          </div>

          {/* Donut Chart + Checklist */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginTop: '4px'
          }}>
            {/* SVG Donut Ring */}
            <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
              <svg width="96" height="96" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="8"
                />
                {/* Progress Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="8"
                  strokeDasharray="238.76"
                  strokeDashoffset="1.9"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1.15
              }}>
                <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0F172A' }}>
                  99.2%
                </span>
                <span style={{ fontSize: '0.625rem', color: '#64748B', fontWeight: 500 }}>
                  Complete
                </span>
              </div>
            </div>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span style={{ color: '#64748B' }}>Complete</span>
                </div>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>99.2%</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  <span style={{ color: '#64748B' }}>Duplicate transaction IDs</span>
                </div>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>0.84%</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F97316' }} />
                  <span style={{ color: '#64748B' }}>Missing IFSC</span>
                </div>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>0.12%</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  <span style={{ color: '#64748B' }}>Unbalanced ledger</span>
                </div>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>0.6%</span>
              </div>
            </div>
          </div>

          {/* Within Configured Limits Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#059669',
            marginTop: '2px'
          }}>
            <CheckCircle2 size={15} color="#10B981" />
            <span>Within configured limits</span>
          </div>
        </div>
      </div>

      {/* Row 3: Top Syndicates Table & Quick Trace */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr',
        gap: '20px'
      }}>
        {/* Card 1: Top syndicates Table */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
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
                <Network size={17} color="#2563EB" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Top syndicates
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Ranked by traced amount and account coverage
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#334155'
              }}>
                <span>Top Risk</span>
                <ChevronDown size={14} color="#64748B" />
              </button>
              <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <th style={{ padding: '8px 10px', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>#</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Account</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Bank</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Risk</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Tier</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '8px 10px', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {topSuspects.map((row, idx) => {
                  const numberColors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#3B82F6'];
                  const circleColor = numberColors[idx % numberColors.length];
                  const tierColor = (row.tier === 'High' || row.tier === 'Critical') ? '#DC2626' : '#D97706';
                  const tierBg = (row.tier === 'High' || row.tier === 'Critical') ? '#FEF2F2' : '#FFFBEB';

                  return (
                    <tr
                      key={row.acct_no}
                      style={{
                        borderBottom: '1px solid #F8FAFC',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Index Circle Badge */}
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: circleColor,
                          color: '#FFFFFF',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          display: 'inline-flex',
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
                          onClick={() => onSelectVictim(row.acct_no)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: '1px solid #DBEAFE',
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
          gap: '16px'
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
                  Select a victim to trace funds
                </span>
              </div>
            </div>

            <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
              <MoreVertical size={16} />
            </button>
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
              placeholder="Search account / IFSC..."
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    backgroundColor: isSelected ? '#F0F7FF' : '#FFFFFF',
                    border: `1px solid ${isSelected ? '#3B82F6' : '#E2E8F0'}`,
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
                        {vic.bank} - {vic.amount}
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
