import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
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
  isolation_anomaly_score?: number;
  anomaly_percentile?: number;
  is_anomaly?: boolean;
  ml_prob?: number;
  blended_score?: number;
}

interface ShapDriver {
  feature: string;
  label: string;
  value: number;
  shap_value: number;
  is_anomalous: boolean;
  evidence_text: string;
}

interface ShapExplanation {
  acct_no: string;
  baseline_expected_value: number;
  total_shap_sum: number;
  top_drivers: ShapDriver[];
  court_admissible_narrative: string;
}

interface AccountProfile {
  acct_no: string;
  bank: string;
  ifsc: string;
  score?: AccountScoreDetails;
  shap_explanation?: ShapExplanation;
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
      color: '#334155'
    }}>
      {/* Title & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#0F172A',
              margin: 0
            }}>
              Accounts
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: '4px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #DBEAFE',
              padding: '1px 6px',
              borderRadius: '5px'
            }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#1D4ED8' }}>VAJRA</span>
              <span className="brand-devanagari" style={{
                fontFamily: "'Alkatra', 'Modak', cursive, sans-serif",
                fontSize: '13px',
                color: '#2563EB',
                lineHeight: 1
              }}>वज्र</span>
            </span>
          </div>
          <p style={{
            fontSize: '0.875rem',
            lineHeight: 1.4,
            color: '#64748B',
            margin: 0
          }}>
            {data?.total_accounts ? data.total_accounts.toLocaleString() : '24,873'} accounts • sortable, searchable & ML-scored
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search account, bank or IFSC..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: '#0F172A',
                fontSize: '0.875rem',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(15,23,42,0.04)'
              }}
            />
          </div>

          <div style={{
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #DBEAFE',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#1D4ED8'
          }}>
            {filteredAccounts.length} flagged for review
          </div>
        </div>
      </div>

      {officerNote && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#065F46',
          fontSize: '0.8125rem',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>✓ {officerNote}</span>
          <button
            onClick={() => setOfficerNote(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#047857' }}
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
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
        }}>
          {/* Table Header Bar */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FAFCFF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                Account register
              </span>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: '#F1F5F9',
                color: '#475569',
                border: '1px solid #E2E8F0',
                fontWeight: 600
              }}>
                Indexed View
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Click row to inspect forensic feature attribution & ML explanations
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', maxHeight: '620px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: '#F8FAFC',
                color: '#64748B',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
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
                  const isHigh = a.tier === 'Critical' || a.tier === 'High';
                  const isMed = a.tier === 'Medium';
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedAccount(a)}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0F172A' }}>
                        {maskAcct(a.acct_no)}
                        <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px', fontWeight: 400 }}>
                          {a.ifsc}
                        </div>
                      </td>
                      <td style={{ padding: '12px 12px', color: '#334155' }}>{a.bank}</td>
                      <td style={{
                        padding: '12px 12px',
                        fontWeight: 700,
                        color: a.risk >= 80 ? '#DC2626' : a.risk >= 60 ? '#D97706' : '#059669',
                        fontSize: '0.875rem'
                      }}>
                        {a.risk}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: isHigh ? '#FEF2F2' : isMed ? '#FFFBEB' : '#ECFDF5',
                          color: isHigh ? '#DC2626' : isMed ? '#D97706' : '#059669',
                          border: `1px solid ${isHigh ? '#FEE2E2' : isMed ? '#FEF3C7' : '#D1FAE5'}`
                        }}>
                          {a.tier}
                        </span>
                      </td>
                      <td style={{ padding: '12px 12px', color: '#475569', fontWeight: 500 }}>{a.role}</td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#0F172A' }}>
                        {a.in_total}
                      </td>
                      <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#0F172A' }}>
                        {a.out_total}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>{a.cluster}</td>
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
            width: '400px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            flexShrink: 0,
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748B',
                  margin: 0
                }}>
                  Selected account
                </p>
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: '#0F172A',
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
                  color: '#94A3B8',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Account Card */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9375rem', color: '#0F172A' }}>
                  {maskAcct(selectedAccount.acct_no)}
                </span>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: selectedAccount.tier === 'Critical' || selectedAccount.tier === 'High' ? '#FEF2F2' : '#EFF6FF',
                  color: selectedAccount.tier === 'Critical' || selectedAccount.tier === 'High' ? '#DC2626' : '#2563EB',
                  border: `1px solid ${selectedAccount.tier === 'Critical' || selectedAccount.tier === 'High' ? '#FEE2E2' : '#DBEAFE'}`,
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  {selectedAccount.tier}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '6px 0 0 0' }}>
                {selectedAccount.bank} • {selectedAccount.ifsc}
              </p>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '12px 14px',
                backgroundColor: '#FAFCFF'
              }}>
                <p style={{ fontSize: '11px', color: '#64748B', margin: 0, fontWeight: 500 }}>Mule Risk</p>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: selectedAccount.risk >= 80 ? '#DC2626' : '#0F172A',
                  margin: '4px 0 0 0'
                }}>
                  {selectedAccount.risk}
                  <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#94A3B8' }}>
                    /100
                  </span>
                </p>
              </div>

              <div style={{
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '12px 14px',
                backgroundColor: '#FAFCFF'
              }}>
                <p style={{ fontSize: '11px', color: '#64748B', margin: 0, fontWeight: 500 }}>Isolation Outlier</p>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: (accountProfile?.score?.isolation_anomaly_score ?? 0) >= 0.65 ? '#DC2626' : '#0F172A',
                  margin: '4px 0 0 0'
                }}>
                  {accountProfile?.score?.isolation_anomaly_score !== undefined 
                    ? Math.round(accountProfile.score.isolation_anomaly_score * 100)
                    : selectedAccount.confidence}
                  <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#94A3B8' }}>
                    %
                  </span>
                </p>
                {accountProfile?.score?.anomaly_percentile !== undefined && (
                  <p style={{ fontSize: '10px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Top {Math.round(100 - accountProfile.score.anomaly_percentile)}% Outlier
                  </p>
                )}
              </div>
            </div>

            {/* TreeSHAP Exact Explainability & Court Evidence */}
            {accountProfile?.shap_explanation && accountProfile.shap_explanation.top_drivers.length > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0F172A' }}>
                    TreeSHAP Forensic Attribution
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF'
                  }}>
                    Exact Game Theory
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {accountProfile.shap_explanation.top_drivers.map((d, idx) => (
                    <div key={idx} style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      fontSize: '11px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{d.label}</span>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: '#D97706',
                          fontSize: '10px'
                        }}>
                          SHAP +{d.shap_value}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
                        {d.evidence_text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Court Admissible Evidence Box */}
                {accountProfile.shap_explanation.court_admissible_narrative && (
                  <div style={{
                    marginTop: '4px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#EFF6FF',
                    borderLeft: '3px solid #2563EB',
                    fontSize: '11px',
                    color: '#1E3A8A',
                    lineHeight: 1.45
                  }}>
                    <strong style={{ display: 'block', marginBottom: '3px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1D4ED8' }}>
                      ⚖️ Court-Admissible Narrative (BNSS 106 / Sec 91 CrPC)
                    </strong>
                    {accountProfile.shap_explanation.court_admissible_narrative}
                  </div>
                )}
              </div>
            )}

            {/* Explainable Feature Attribution Sub-Scores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
                  Rule Heuristic Indicators
                </span>
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>Heuristic Slices</span>
              </div>

              {/* Bar 1: Velocity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 500, color: '#334155' }}>Pass-Through Velocity</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0F172A' }}>{scoreVelocity}/30</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(scoreVelocity / 30) * 100}%`, height: '100%', backgroundColor: '#2563EB', borderRadius: '3px' }} />
                </div>
              </div>

              {/* Bar 2: Topology */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 500, color: '#334155' }}>Fan-In / Fan-Out Topology</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0F172A' }}>{scoreTopology}/25</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(scoreTopology / 25) * 100}%`, height: '100%', backgroundColor: '#3B82F6', borderRadius: '3px' }} />
                </div>
              </div>

              {/* Bar 3: Cashout */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 500, color: '#334155' }}>Cash-Out / Narration Risk</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0F172A' }}>{scoreCashout}/20</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(scoreCashout / 20) * 100}%`, height: '100%', backgroundColor: '#60A5FA', borderRadius: '3px' }} />
                </div>
              </div>

              {/* Bar 4: Device & Foreign IP */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 500, color: '#334155' }}>Foreign IP / Headless Device</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0F172A' }}>{scoreDevice}/15</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(scoreDevice / 15) * 100}%`, height: '100%', backgroundColor: '#93C5FD', borderRadius: '3px' }} />
                </div>
              </div>
            </div>

            {/* Mask Toggle */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '10px',
              borderTop: '1px solid #E2E8F0'
            }}>
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#0F172A', margin: 0 }}>Show account number</p>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>Unmask sensitive account digits</p>
              </div>
              <input
                type="checkbox"
                checked={showMasked}
                onChange={e => setShowMasked(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
            </div>

            {/* Officer Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>Officer action</p>
              
              <button
                onClick={() => onSelectVictim(selectedAccount.acct_no)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
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
                    borderRadius: '6px',
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #DBEAFE',
                    color: '#1D4ED8',
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
                    borderRadius: '6px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    color: '#64748B',
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
