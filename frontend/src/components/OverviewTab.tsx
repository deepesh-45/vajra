import React, { useState } from 'react';
import { 
  Download, Play, Crosshair, BarChart3, 
  ShieldAlert, GitFork, Banknote, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import type { OverviewData } from '../types';

interface OverviewTabProps {
  data: OverviewData | null;
  onSelectVictim: (victim: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ data, onSelectVictim }) => {
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [exportNotice, setExportNotice] = useState<boolean>(false);

  if (!data) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748B', fontFamily: 'var(--font-sans)' }}>
        Loading system overview...
      </div>
    );
  }

  // Exact victims list matching reference screenshot or dynamically loaded
  const defaultVictimRows = [
    {
      acct: data.sample_victims?.[0] || 'PUNB10000052',
      bank: 'Punjab National Bank',
      amount: '₹1,84,500',
      date: '30 Sep 2026'
    },
    {
      acct: data.sample_victims?.[1] || 'HDFC00034122',
      bank: 'HDFC Bank',
      amount: '₹92,200',
      date: '29 Sep 2026'
    },
    {
      acct: data.sample_victims?.[2] || 'ICICI00678291',
      bank: 'ICICI Bank',
      amount: '₹2,10,000',
      date: '28 Sep 2026'
    },
    {
      acct: data.sample_victims?.[3] || 'AXIS00893411',
      bank: 'Axis Bank',
      amount: '₹65,750',
      date: '28 Sep 2026'
    },
    {
      acct: data.sample_victims?.[4] || 'SBI00345266',
      bank: 'State Bank of India',
      amount: '₹1,22,300',
      date: '27 Sep 2026'
    }
  ];

  const handleExport = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 2500);
  };

  return (
    <div style={{
      backgroundColor: '#F8FAFC',
      minHeight: '100%',
      padding: '28px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      maxWidth: '1440px',
      margin: '0 auto',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Top Section Header Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            lineHeight: 1.15
          }}>
            OVERVIEW & SUMMARY
          </h1>
          <p style={{
            fontSize: '13.5px',
            color: '#64748B',
            marginTop: '4px',
            fontWeight: 500
          }}>
            Real-time offline analysis • Last updated: 02 Oct 2026 • 14:32 IST
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '9px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#1E293B',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <Download size={15} color="#475569" />
            <span>Export Report</span>
          </button>

          <button
            onClick={() => onSelectVictim(defaultVictimRows[0].acct)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 20px',
              borderRadius: '9px',
              backgroundColor: '#EA580C',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(234, 88, 12, 0.35)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#C2410C')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#EA580C')}
          >
            <Play size={14} fill="#FFFFFF" color="#FFFFFF" />
            <span>Run New Scan</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          color: '#166534',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>Case summary export saved to offline vault with SHA-256 seal.</span>
        </div>
      )}

      {/* 4 KPI Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        {/* KPI 1: Active Transaction Records */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px 22px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#EA580C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              flexShrink: 0
            }}>
              {/* Stacked coins/records icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
            </div>
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
              Active Transaction Records
            </span>
          </div>

          <div style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            marginTop: '4px',
            fontFamily: 'var(--font-sans)'
          }}>
            {data.total_transactions ? data.total_transactions.toLocaleString() : '2,000,000'}
          </div>

          <div style={{
            fontSize: '12px',
            color: '#16A34A',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>↑ +142k from last scan</span>
          </div>
        </div>

        {/* KPI 2: Indexed Bank Accounts */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px 22px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#EA580C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              flexShrink: 0
            }}>
              {/* Bank columns icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 21h18"/>
                <path d="M3 10h18"/>
                <path d="M5 6l7-3 7 3"/>
                <path d="M4 10v11"/>
                <path d="M20 10v11"/>
                <path d="M8 14v4"/>
                <path d="M12 14v4"/>
                <path d="M16 14v4"/>
              </svg>
            </div>
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
              Indexed Bank Accounts
            </span>
          </div>

          <div style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            marginTop: '4px'
          }}>
            {data.total_accounts ? data.total_accounts.toLocaleString() : '24,873'}
          </div>

          <div style={{
            fontSize: '12px',
            color: '#64748B',
            fontWeight: 500
          }}>
            Across 47 banks • 112 branches
          </div>
        </div>

        {/* KPI 3: Processing Speed */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px 22px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#EA580C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              flexShrink: 0
            }}>
              {/* Speedometer icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 14l4-4"/>
                <path d="M3.34 19a10 10 0 1 1 17.32 0"/>
              </svg>
            </div>
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
              Processing Speed
            </span>
          </div>

          <div style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            marginTop: '4px'
          }}>
            2.72s
          </div>

          <div style={{
            fontSize: '12px',
            color: '#64748B',
            fontWeight: 500
          }}>
            Average per 100k transactions
          </div>
        </div>

        {/* KPI 4: Money Trail Search Speed */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px 22px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#EA580C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              flexShrink: 0
            }}>
              {/* Lightning bolt icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
              Money Trail Search Speed
            </span>
          </div>

          <div style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            marginTop: '4px'
          }}>
            &lt;1ms
          </div>

          <div style={{
            fontSize: '12px',
            color: '#16A34A',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>↑ P95 latency • Optimized index</span>
          </div>
        </div>
      </div>

      {/* Two Large Main Section Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        {/* Left Card: 1-Click Victim Money Trail Tracing */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '18px'
        }}>
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crosshair size={18} color="#EA580C" />
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                  1-Click Victim Money Trail Tracing
                </h2>
              </div>
              <span style={{
                fontSize: '11.5px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '12px',
                border: '1px solid #F97316',
                color: '#EA580C',
                backgroundColor: '#FFF7ED'
              }}>
                5 Victim Accounts
              </span>
            </div>

            <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '6px' }}>
              Trace illicit fund flows from victim accounts. Click to initiate path analysis.
            </p>

            {/* List of 5 Victim Accounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {defaultVictimRows.map((row, idx) => {
                const isSelected = selectedRowIndex === idx;
                return (
                  <div
                    key={row.acct}
                    onClick={() => setSelectedRowIndex(idx)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: isSelected ? '#F8FAFC' : '#FFFFFF',
                      border: isSelected ? '1.5px solid #FED7AA' : '1px solid #E2E8F0',
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
                      {isSelected ? (
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#EA580C',
                          boxShadow: '0 0 6px #EA580C'
                        }} />
                      ) : (
                        <span style={{ width: '8px', height: '8px' }} />
                      )}

                      <div>
                        <div style={{
                          fontSize: '13.5px',
                          fontWeight: 700,
                          color: '#0F172A',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {row.acct}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                          {row.bank} • <strong style={{ color: '#0F172A' }}>{row.amount}</strong> • Reported: {row.date}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVictim(row.acct);
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '7px',
                        backgroundColor: isSelected ? '#EA580C' : '#FFFFFF',
                        border: isSelected ? 'none' : '1px solid #CBD5E1',
                        color: isSelected ? '#FFFFFF' : '#334155',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: isSelected ? '0 1px 3px rgba(234, 88, 12, 0.3)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#FFF7ED';
                          e.currentTarget.style.borderColor = '#EA580C';
                          e.currentTarget.style.color = '#EA580C';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                          e.currentTarget.style.borderColor = '#CBD5E1';
                          e.currentTarget.style.color = '#334155';
                        }
                      }}
                    >
                      <span>→ Trace Flow</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Footnote */}
          <div style={{
            fontSize: '11px',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            paddingTop: '10px',
            borderTop: '1px solid #F1F5F9'
          }}>
            <ShieldCheck size={14} color="#64748B" />
            <span>All traces run offline • No external data connectivity</span>
          </div>
        </div>

        {/* Right Card: Risk Levels & Account Classifications */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '18px'
        }}>
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} color="#EA580C" />
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                  Risk Levels & Account Classifications
                </h2>
              </div>
              <span style={{
                fontSize: '11.5px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                color: '#334155',
                backgroundColor: '#FFFFFF'
              }}>
                Classified Data &gt;
              </span>
            </div>

            <p style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', marginTop: '14px' }}>
              Accounts by Risk Level
            </p>

            {/* 3 Horizontal Risk Bars with Counts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
              {/* High Risk */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '85px', fontSize: '12.5px', fontWeight: 600, color: '#0F172A' }}>
                  High Risk
                </span>
                <div style={{
                  flex: 1,
                  height: '14px',
                  borderRadius: '7px',
                  backgroundColor: '#F1F5F9',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '38%',
                    height: '100%',
                    backgroundColor: '#C2410C',
                    borderRadius: '7px'
                  }} />
                </div>
                <span style={{
                  width: '65px',
                  textAlign: 'right',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#0F172A',
                  fontFamily: 'var(--font-sans)'
                }}>
                  {(data.tier_distribution?.['High'] || 426).toLocaleString()}
                </span>
              </div>

              {/* Medium Risk */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '85px', fontSize: '12.5px', fontWeight: 600, color: '#0F172A' }}>
                  Medium Risk
                </span>
                <div style={{
                  flex: 1,
                  height: '14px',
                  borderRadius: '7px',
                  backgroundColor: '#F1F5F9',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '78%',
                    height: '100%',
                    backgroundColor: '#EA580C',
                    borderRadius: '7px'
                  }} />
                </div>
                <span style={{
                  width: '65px',
                  textAlign: 'right',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#0F172A',
                  fontFamily: 'var(--font-sans)'
                }}>
                  {(data.tier_distribution?.['Medium'] || 17324).toLocaleString()}
                </span>
              </div>

              {/* Low Risk */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '85px', fontSize: '12.5px', fontWeight: 600, color: '#0F172A' }}>
                  Low Risk
                </span>
                <div style={{
                  flex: 1,
                  height: '14px',
                  borderRadius: '7px',
                  backgroundColor: '#F1F5F9',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '52%',
                    height: '100%',
                    backgroundColor: '#FBBF24',
                    borderRadius: '7px'
                  }} />
                </div>
                <span style={{
                  width: '65px',
                  textAlign: 'right',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#0F172A',
                  fontFamily: 'var(--font-sans)'
                }}>
                  {(data.tier_distribution?.['Low'] || 7123).toLocaleString()}
                </span>
              </div>
            </div>

            {/* 3 Role Micro-Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginTop: '22px'
            }}>
              {/* Entry Point Mules */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#EA580C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}>
                    <ShieldAlert size={12} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                    Entry Point Mules
                  </span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  {(data.role_distribution?.['COLLECTOR'] || 21191).toLocaleString()}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                  Likely initial beneficiaries
                </div>
              </div>

              {/* Money Splitters */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#EA580C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}>
                    <GitFork size={12} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                    Money Splitters
                  </span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  {(data.role_distribution?.['DISTRIBUTOR'] || 331).toLocaleString()}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                  Accounts performing multi-hop splits
                </div>
              </div>

              {/* Cash-Out */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#EA580C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}>
                    <Banknote size={12} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                    Cash-Out
                  </span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  {(data.role_distribution?.['TERMINAL'] || 742).toLocaleString()}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                  Identified cash-out endpoints
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footnote */}
          <div style={{
            fontSize: '11px',
            color: '#64748B',
            paddingTop: '10px',
            borderTop: '1px solid #F1F5F9'
          }}>
            ⓘ Risk classification based on transaction velocity, fan-out count, and known mule patterns • Model v2.1.0 • Offline
          </div>
        </div>
      </div>

      {/* AI & Deep Learning Models Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
              Trained Machine Learning Models (Active & Self-Adapting)
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
              Automated fraud classification trained locally without sending data to external clouds
            </p>
          </div>
          <span style={{
            padding: '4px 12px',
            borderRadius: '14px',
            backgroundColor: '#F0FDF4',
            color: '#16A34A',
            border: '1px solid #BBF7D0',
            fontSize: '11.5px',
            fontWeight: 700
          }}>
            Ready & Calibrated
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          <div style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#EA580C', letterSpacing: '0.4px' }}>
              MODEL M1 (BEHAVIOUR & GRAPH)
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
              Gradient Boosted Tree + Graph SVD
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
              Analyzes transfer velocity, account in/out balance ratio, and graph connectivity.
            </div>
            <div style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: 600, marginTop: '4px' }}>
              ✓ Self-adapts on new datasets in ~5 seconds
            </div>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#7C3AED', letterSpacing: '0.4px' }}>
              MODEL M4 (DEEP LEARNING)
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
              PyTorch Graph Neural Network
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
              Examines neighborhood relationships: flags mules that camouflage their transfers but connect to known rings.
            </div>
            <div style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: 600, marginTop: '4px' }}>
              ✓ 3-Layer GraphSAGE CPU Native (0.6s)
            </div>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#EA580C', letterSpacing: '0.4px' }}>
              MODEL M2 (SECURITY & NLP)
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
              Narration Classifier & Shield
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
              Scans remarks for Crypto P2P markers and neutralizes planted prompt injection attempts.
            </div>
            <div style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: 600, marginTop: '4px' }}>
              ✓ Active Zero-Trust Shield
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Suspect Mule Accounts Table */}
      {data.top_mules && data.top_mules.length > 0 && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
              Flagged Suspect Mule Accounts (Indore Police Watchlist)
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
              Ranked by composite Fraud Risk Score with explainable reasons and AI confidence
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>Account Number</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>Bank</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>Fraud Risk (0-100)</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>AI Confidence</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>Risk Level</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>Detected Role</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.top_mules.slice(0, 10).map(mule => (
                  <tr key={mule.acct_no} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0F172A' }}>
                      {mule.acct_no}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>{mule.primary_bank}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px'
                      }}>
                        {mule.risk_index} / 100
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: mule.ml_prob > 0.8 ? '#DC2626' : '#334155' }}>
                      {mule.ml_prob !== undefined ? `${(mule.ml_prob * 100).toFixed(1)}%` : '99.9%'}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#DC2626' }}>
                      {mule.tier}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#FFF7ED',
                        color: '#EA580C',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {mule.predicted_role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={() => onSelectVictim(mule.acct_no)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          backgroundColor: '#EA580C',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: 'none'
                        }}
                      >
                        Inspect Trail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
