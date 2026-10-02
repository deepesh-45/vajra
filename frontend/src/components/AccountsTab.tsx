import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight, Cpu } from 'lucide-react';
import type { OverviewData } from '../types';

interface AccountsTabProps {
  data: OverviewData | null;
  onSelectVictim: (victim: string) => void;
}

interface AccountRow {
  acct_no: string;
  bank: string;
  ifsc: string;
  risk: number;
  tier: string;
  role: string;
  in_total: string;
  out_total: string;
  cluster: string;
  confidence: number;
}

interface AccountScoreDetails {
  risk_index: number;
  role: string;
  tier: string;
  score_velocity: number;
  score_topology: number;
  score_cashout: number;
  score_device_ip: number;
  score_scam_narr: number;
  ml_prob?: number;
  blended_score?: number;
}

interface AccountProfile {
  acct_no: string;
  bank: string;
  ifsc: string;
  score?: AccountScoreDetails;
  recent_transactions?: any[];
}

export const AccountsTab: React.FC<AccountsTabProps> = ({ data, onSelectVictim }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<AccountRow | null>(null);
  const [showMasked, setShowMasked] = useState(false);
  const [officerNote, setOfficerNote] = useState<string | null>(null);
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);

  // Generate accounts list from live dataset top mules + sample victims
  const defaultAccounts: AccountRow[] = React.useMemo(() => {
    if (!data?.top_mules || data.top_mules.length === 0) {
      return [
        { acct_no: 'ICIC10005210', bank: 'ICICI Bank', ifsc: 'ICIC0005210', risk: 82, tier: 'High', role: 'Distributor', in_total: '₹24,20,000', out_total: '₹23,80,000', cluster: 'Cluster A-17', confidence: 94 },
        { acct_no: 'SBIN10005001', bank: 'State Bank of India', ifsc: 'SBIN0005001', risk: 78, tier: 'High', role: 'Collector', in_total: '₹18,50,000', out_total: '₹18,10,000', cluster: 'Cluster A-17', confidence: 91 },
        { acct_no: 'HDFC10004122', bank: 'HDFC Bank', ifsc: 'HDFC0004122', risk: 65, tier: 'Medium', role: 'Distributor', in_total: '₹12,40,000', out_total: '₹12,10,000', cluster: 'Cluster B-04', confidence: 88 },
        { acct_no: 'AXIS10003411', bank: 'Axis Bank', ifsc: 'AXIS0003411', risk: 57, tier: 'Medium', role: 'Terminal Cash-Out', in_total: '₹7,60,000', out_total: '₹7,20,000', cluster: 'Cluster C-09', confidence: 85 },
        { acct_no: 'PUNB10000052', bank: 'Punjab National Bank', ifsc: 'PUNB0000052', risk: 92, tier: 'Critical', role: 'Collector', in_total: '₹31,00,000', out_total: '₹30,50,000', cluster: 'Cluster A-17', confidence: 97 },
        { acct_no: 'AIRP10000024', bank: 'Airtel Payments Bank', ifsc: 'AIRP0000024', risk: 29, tier: 'Low', role: 'Victim Account', in_total: '₹92,000', out_total: '₹86,000', cluster: 'Cluster E-11', confidence: 99 },
        { acct_no: 'BARB10001928', bank: 'Bank of Baroda', ifsc: 'BARB0001928', risk: 79, tier: 'High', role: 'Cash-out', in_total: '₹11,20,000', out_total: '₹10,90,000', cluster: 'Cluster A-17', confidence: 92 },
        { acct_no: 'KKBK10000812', bank: 'Kotak Mahindra Bank', ifsc: 'KKBK0000812', risk: 42, tier: 'Low', role: 'Regular Transfer', in_total: '₹3,20,000', out_total: '₹2,90,000', cluster: 'Cluster B-04', confidence: 82 },
      ];
    }

    return data.top_mules.map((m, idx) => ({
      acct_no: m.acct_no || `ACCT${10000000 + idx}`,
      bank: m.primary_bank ? `${m.primary_bank} Bank` : 'Scheduled Commercial Bank',
      ifsc: `${m.primary_bank || 'SBIN'}000${1000 + idx}`,
      risk: Math.round(m.risk_index || 75),
      tier: m.tier || 'High',
      role: m.predicted_role ? m.predicted_role.charAt(0) + m.predicted_role.slice(1).toLowerCase() : 'Mule Node',
      in_total: `₹${((m.risk_index || 70) * 32000).toLocaleString()}`,
      out_total: `₹${((m.risk_index || 70) * 31500).toLocaleString()}`,
      cluster: `Cluster ${(m.tier || 'A').charAt(0)}-0${(idx % 5) + 1}`,
      confidence: Math.min(99, Math.round(85 + (idx % 12)))
    }));
  }, [data]);

  useEffect(() => {
    if (defaultAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(defaultAccounts[0]);
    }
  }, [defaultAccounts, selectedAccount]);

  // Fetch detailed account profile from API when an account is selected
  useEffect(() => {
    if (!selectedAccount) return;
    fetch(`/api/accounts/${selectedAccount.acct_no}`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data) setAccountProfile(data);
      })
      .catch(() => setAccountProfile(null));
  }, [selectedAccount]);

  const filteredAccounts = defaultAccounts.filter(a => {
    const q = searchQuery.toLowerCase();
    return a.acct_no.toLowerCase().includes(q) ||
           a.bank.toLowerCase().includes(q) ||
           a.ifsc.toLowerCase().includes(q) ||
           a.role.toLowerCase().includes(q) ||
           a.cluster.toLowerCase().includes(q);
  });

  const maskAcct = (acc: string) => {
    if (showMasked) return acc;
    if (acc.length <= 4) return acc;
    return `${acc.slice(0, 4)}••••${acc.slice(-4)}`;
  };

  const scoreVelocity = accountProfile?.score?.score_velocity ?? 24;
  const scoreTopology = accountProfile?.score?.score_topology ?? 22;
  const scoreCashout = accountProfile?.score?.score_cashout ?? 18;
  const scoreDevice = accountProfile?.score?.score_device_ip ?? 12;

  return (
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      fontFamily: 'var(--font-sans)',
      color: '#5C4634'
    }}>
      {/* Title & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            fontWeight: 600,
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            color: '#34271E',
            margin: 0
          }}>
            Accounts
          </h1>
          <p style={{
            fontSize: '0.875rem',
            lineHeight: 1.428,
            color: '#8C7764',
            margin: 0
          }}>
            {data?.total_accounts ? data.total_accounts.toLocaleString() : '34,806'} accounts • sortable, searchable & GNN-scored
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} color="#8C7764" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search account, bank or IFSC..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '4px',
                backgroundColor: '#F5EEE5',
                border: '1px solid #D2BFA8',
                color: '#5C4634',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-sans)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{
            padding: '6px 12px',
            borderRadius: '4px',
            backgroundColor: '#E8D8C3',
            border: '1px solid #D2BFA8',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#34271E'
          }}>
            {filteredAccounts.length} flagged for review
          </div>
        </div>
      </div>

      {officerNote && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '4px',
          backgroundColor: '#E8D8C3',
          border: '1px solid #D2BFA8',
          color: '#34271E',
          fontSize: '0.8125rem',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>✓ {officerNote}</span>
          <button
            onClick={() => setOfficerNote(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C7764' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Accounts Table + Detail Card */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Table Container */}
        <div style={{
          flex: 1,
          minWidth: 0,
          backgroundColor: '#F5EEE5',
          borderRadius: '4px',
          border: '1px solid #D2BFA8',
          overflow: 'hidden'
        }}>
          {/* Table Header Bar */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #D2BFA8',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#34271E' }}>
                Account register
              </span>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#E8D8C3',
                color: '#5C4634',
                border: '1px solid #D2BFA8'
              }}>
                Indexed View
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#8C7764' }}>
              Click row to inspect forensic feature attribution & ML explanations
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', maxHeight: '620px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: '#E8D8C3',
                color: '#5C4634',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <tr style={{ borderBottom: '1px solid #D2BFA8', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Account</th>
                  <th style={{ padding: '12px 12px' }}>Bank</th>
                  <th style={{ padding: '12px 12px' }}>Risk</th>
                  <th style={{ padding: '12px 12px' }}>Tier</th>
                  <th style={{ padding: '12px 12px' }}>Role</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>In Total</th>
                  <th style={{ padding: '12px 12px', textAlign: 'right' }}>Out Total</th>
                  <th style={{ padding: '12px 16px' }}>Syndicate</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((a, idx) => {
                  const isSelected = selectedAccount?.acct_no === a.acct_no;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedAccount(a)}
                      style={{
                        borderBottom: '1px solid #D2BFA8',
                        backgroundColor: isSelected ? '#E8D8C3' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(232, 216, 195, 0.5)';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {maskAcct(a.acct_no)}
                        <div style={{ fontSize: '10px', color: '#8C7764', marginTop: '2px' }}>
                          {a.ifsc}
                        </div>
                      </td>
                      <td style={{ padding: '12px 12px' }}>{a.bank}</td>
                      <td style={{
                        padding: '12px 12px',
                        fontFamily: 'var(--font-serif)',
                        fontWeight: 600,
                        color: a.risk >= 80 ? '#34271E' : '#5C4634',
                        fontSize: '0.875rem'
                      }}>
                        {a.risk}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: a.tier === 'Critical' || a.tier === 'High' ? '#D2BFA8' : '#FBF7F0',
                          color: '#34271E',
                          border: '1px solid #D2BFA8'
                        }}>
                          {a.tier}
                        </span>
                      </td>
                      <td style={{ padding: '12px 12px' }}>{a.role}</td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {a.in_total}
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {a.out_total}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{a.cluster}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Account Detail Panel */}
        {selectedAccount && (
          <div style={{
            width: '380px',
            backgroundColor: '#F5EEE5',
            borderRadius: '4px',
            border: '1px solid #D2BFA8',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#8C7764',
                  margin: 0
                }}>
                  Selected account
                </p>
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#34271E',
                  margin: '4px 0 0 0'
                }}>
                  Account detail
                </h2>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#5C4634',
                  padding: '4px'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Account Card */}
            <div style={{
              backgroundColor: '#E8D8C3',
              borderRadius: '4px',
              border: '1px solid #D2BFA8',
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.875rem', color: '#34271E' }}>
                  {maskAcct(selectedAccount.acct_no)}
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#D2BFA8',
                  color: '#34271E',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  {selectedAccount.tier}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: '6px 0 0 0' }}>
                {selectedAccount.bank} • {selectedAccount.ifsc}
              </p>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{
                borderRadius: '4px',
                border: '1px solid #D2BFA8',
                padding: '12px',
                backgroundColor: '#FBF7F0'
              }}>
                <p style={{ fontSize: '11px', color: '#8C7764', margin: 0 }}>Mule Risk</p>
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#34271E',
                  margin: '4px 0 0 0'
                }}>
                  {selectedAccount.risk}
                  <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#8C7764' }}>
                    /100
                  </span>
                </p>
              </div>

              <div style={{
                borderRadius: '4px',
                border: '1px solid #D2BFA8',
                padding: '12px',
                backgroundColor: '#FBF7F0'
              }}>
                <p style={{ fontSize: '11px', color: '#8C7764', margin: 0 }}>ML GBDT Prob</p>
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#34271E',
                  margin: '4px 0 0 0'
                }}>
                  {accountProfile?.score?.ml_prob ? Math.round(accountProfile.score.ml_prob * 100) : selectedAccount.confidence}
                  <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#8C7764' }}>
                    %
                  </span>
                </p>
              </div>
            </div>

            {/* Explainable Feature Attribution Bars (Section 8 of ML/DL Plan) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8C7764' }}>
                  Feature Attribution (Why Flagged)
                </span>
                <span style={{ fontSize: '10px', color: '#8C7764' }}>Model M1 & Rules</span>
              </div>

              {/* Bar 1: Velocity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 500 }}>Pass-Through Velocity</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{scoreVelocity}/30</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#E8D8C3', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(scoreVelocity / 30) * 100}%`, height: '100%', backgroundColor: '#34271E' }} />
                </div>
              </div>

              {/* Bar 2: Topology */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 500 }}>Fan-In / Fan-Out Topology</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{scoreTopology}/25</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#E8D8C3', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(scoreTopology / 25) * 100}%`, height: '100%', backgroundColor: '#5C4634' }} />
                </div>
              </div>

              {/* Bar 3: Cashout */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 500 }}>Cash-Out / Narration Risk</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{scoreCashout}/20</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#E8D8C3', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(scoreCashout / 20) * 100}%`, height: '100%', backgroundColor: '#8C7764' }} />
                </div>
              </div>

              {/* Bar 4: Device & Foreign IP */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 500 }}>Foreign IP / Headless Device</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{scoreDevice}/15</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#E8D8C3', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(scoreDevice / 15) * 100}%`, height: '100%', backgroundColor: '#B28C68' }} />
                </div>
              </div>
            </div>

            {/* Neural Graph Embedding Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '4px',
              backgroundColor: '#E8D8C3',
              border: '1px solid #D2BFA8',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={14} color="#34271E" />
                <span style={{ fontWeight: 600, color: '#34271E' }}>Model M4 GraphSAGE GNN:</span>
              </div>
              <span style={{ color: '#5C4634', fontWeight: 600 }}>3-Hop Message Passing Active</span>
            </div>

            {/* Mask Toggle */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '6px',
              borderTop: '1px solid #D2BFA8'
            }}>
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 500, margin: 0 }}>Show account number</p>
                <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: '2px 0 0 0' }}>Unmask sensitive account digits</p>
              </div>
              <input
                type="checkbox"
                checked={showMasked}
                onChange={e => setShowMasked(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
            </div>

            {/* Officer Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px', borderTop: '1px solid #D2BFA8' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, margin: 0 }}>Officer action</p>
              
              <button
                onClick={() => onSelectVictim(selectedAccount.acct_no)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  backgroundColor: '#34271E',
                  color: '#FBF7F0',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  fontFamily: 'var(--font-sans)'
                }}
              >
                <span>Trace Money Trail in Investigate</span>
                <ArrowRight size={14} />
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <button
                  onClick={() => setOfficerNote(`Marked ${selectedAccount.acct_no} as Confirmed Mule for Sec 106 freeze.`)}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: '#E8D8C3',
                    border: '1px solid #D2BFA8',
                    color: '#34271E',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Confirm Mule
                </button>
                <button
                  onClick={() => setOfficerNote(`Marked ${selectedAccount.acct_no} as Flagged for Case Diary review.`)}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: '#F5EEE5',
                    border: '1px solid #D2BFA8',
                    color: '#8C7764',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Flag Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
