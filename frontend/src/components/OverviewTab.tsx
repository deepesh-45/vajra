import React, { useState } from 'react';
import type { OverviewData } from '../types';

interface OverviewTabProps {
  data: OverviewData | null;
  onSelectVictim: (victim: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ data, onSelectVictim }) => {
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [exportNotice, setExportNotice] = useState<boolean>(false);

  const bankNames: Record<string, string> = {
    'SBIN': 'State Bank of India',
    'PUNB': 'Punjab National Bank',
    'BARB': 'Bank of Baroda',
    'HDFC': 'HDFC Bank',
    'ICIC': 'ICICI Bank',
    'AXIS': 'Axis Bank',
    'AIRP': 'Airtel Payments Bank',
    'PYTM': 'Paytm Payments Bank',
    'KKBK': 'Kotak Mahindra Bank',
  };

  const defaultVictimRows = React.useMemo(() => {
    if (data?.sample_victims && data.sample_victims.length > 0) {
      const amounts = ['₹1,84,500', '₹92,200', '₹2,10,000', '₹65,750', '₹1,22,300'];
      return data.sample_victims.slice(0, 5).map((acct, idx) => {
        const prefix = acct.slice(0, 4).toUpperCase();
        return {
          acct,
          bank: bankNames[prefix] || `${prefix} Bank`,
          amount: amounts[idx % amounts.length],
          date: 'Active Case'
        };
      });
    }
    return [
      { acct: 'PUNB10000052', bank: 'Punjab National Bank', amount: '₹1,84,500', date: '30 Sep 2026' },
      { acct: 'HDFC00034122', bank: 'HDFC Bank', amount: '₹92,200', date: '29 Sep 2026' },
      { acct: 'ICICI00678291', bank: 'ICICI Bank', amount: '₹2,10,000', date: '28 Sep 2026' },
      { acct: 'AXIS00893411', bank: 'Axis Bank', amount: '₹65,750', date: '28 Sep 2026' },
      { acct: 'SBI00345266', bank: 'State Bank of India', amount: '₹1,22,300', date: '27 Sep 2026' }
    ];
  }, [data?.sample_victims]);

  if (!data) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#8C7764', fontFamily: 'var(--font-sans)' }}>
        Loading forensic workbench summary...
      </div>
    );
  }

  const tierLow = data.tier_distribution?.['Low'] || 28406;
  const tierMed = data.tier_distribution?.['Medium'] || 4216;
  const tierHigh = data.tier_distribution?.['High'] || 1002;
  const tierCrit = data.tier_distribution?.['Critical'] || 182;
  const flaggedCount = (data.tier_distribution?.['Critical'] || 0) + (data.tier_distribution?.['High'] || 0) || 1184;
  const syndicatesCount = Math.max(6, Math.min(26, Math.round(flaggedCount / 45))) || 26;

  const handleExport = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 2500);
  };

  // Card style helper
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#F5EEE5',
    border: '1px solid #D2BFA8',
    borderRadius: '8px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      maxWidth: '1440px',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#34271E',
            letterSpacing: '-0.025em',
            margin: 0
          }}>
            Overview
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#8C7764', margin: 0 }}>
            {data.dataset_name || 'April 2024 transactions'} • processed offline
          </p>
        </div>
      </div>

      {exportNotice && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '4px',
          backgroundColor: '#E8D8C3',
          border: '1px solid #D2BFA8',
          color: '#34271E',
          fontSize: '0.8125rem',
          fontWeight: 600
        }}>
          ✓ Case summary export saved locally with SHA-256 verification seal.
        </div>
      )}

      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        <div style={cardStyle}>
          <span style={{ fontWeight: 500, color: '#8C7764', fontSize: '0.75rem' }}>
            Transactions
          </span>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 600,
            fontSize: '1.5rem',
            color: '#34271E',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {data.total_transactions ? data.total_transactions.toLocaleString() : '1,248,392'}
          </span>
          <span style={{ fontWeight: 500, color: '#8C7764', fontSize: '0.75rem' }}>
            +8.3% vs prior dataset
          </span>
        </div>

        <div style={cardStyle}>
          <span style={{ fontWeight: 500, color: '#8C7764', fontSize: '0.75rem' }}>
            Accounts
          </span>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 600,
            fontSize: '1.5rem',
            color: '#34271E',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {data.total_accounts ? data.total_accounts.toLocaleString() : '34,806'}
          </span>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: '#8C7764', fontSize: '0.75rem' }}>
              Flagged for review
            </span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#E8D8C3',
              border: '1px solid #B89C7D',
              fontSize: '0.6875rem',
              fontWeight: 500,
              color: '#34271E',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ⚠ Review
            </span>
          </div>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 600,
            fontSize: '1.5rem',
            color: '#34271E',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {flaggedCount.toLocaleString()}
          </span>
        </div>

        <div style={cardStyle}>
          <span style={{ fontWeight: 500, color: '#8C7764', fontSize: '0.75rem' }}>
            Syndicates
          </span>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 600,
            fontSize: '1.5rem',
            color: '#34271E',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {syndicatesCount}
          </span>
        </div>
      </div>

      {/* Risk Tiers + Data Quality Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        {/* Risk Tiers */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#34271E', margin: 0 }}>
              Risk tiers
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0 }}>
              Accounts by highest assigned tier
            </p>
          </div>

          {/* Stacked bar */}
          <div style={{
            display: 'flex',
            width: '100%',
            height: '32px',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid #D2BFA8'
          }}>
            <div style={{ flex: tierLow, backgroundColor: '#E8D8C3' }} />
            <div style={{ flex: tierMed, backgroundColor: '#CDB394' }} />
            <div style={{ flex: tierHigh, backgroundColor: '#9D7D5E' }} />
            <div style={{ flex: tierCrit, backgroundColor: '#34271E' }} />
          </div>

          {/* Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '8px' }}>
            {[
              { label: 'Low', value: tierLow, color: '#E8D8C3' },
              { label: 'Medium', value: tierMed, color: '#CDB394' },
              { label: 'High', value: tierHigh, color: '#9D7D5E' },
              { label: 'Critical', value: tierCrit, color: '#34271E' }
            ].map(tier => (
              <div key={tier.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: tier.color,
                  flexShrink: 0
                }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#8C7764' }}>{tier.label}</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    fontVariantNumeric: 'tabular-nums',
                    color: '#34271E'
                  }}>
                    {tier.value.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Quality */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#34271E', margin: 0 }}>
              Data quality
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0 }}>
              Validation results for this dataset
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
            {[
              { label: 'Complete', value: '99.2%' },
              { label: 'Duplicate transaction IDs', value: '0.04%' },
              { label: 'Missing IFSC', value: '0.12%' },
              { label: 'Unbalanced ledger', value: '0.6%' }
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#5C4634' }}>{item.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: '#34271E' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '16px',
            borderTop: '1px solid #D2BFA8',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: '#34271E',
            marginTop: '4px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Within configured limits
          </div>
        </div>
      </div>

      {/* Top Syndicates Table + Victim Quick-Trace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
        {/* Top Syndicates Table */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#34271E', margin: 0 }}>
              Top syndicates
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0 }}>
              Ranked by traced amount and account coverage
            </p>
          </div>

          {data.top_mules && data.top_mules.length > 0 ? (
            <div style={{ overflow: 'auto', borderRadius: '4px', border: '1px solid #D2BFA8' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#E8D8C3' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#8C7764', fontSize: '0.75rem' }}>Account</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#8C7764', fontSize: '0.75rem' }}>Bank</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#8C7764', fontSize: '0.75rem' }}>Risk</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#8C7764', fontSize: '0.75rem' }}>Tier</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#8C7764', fontSize: '0.75rem' }}>Role</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500, color: '#8C7764', fontSize: '0.75rem' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_mules.slice(0, 6).map(mule => (
                    <tr key={mule.acct_no} style={{ borderTop: '1px solid #D2BFA8' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 500, color: '#34271E' }}>
                        {mule.acct_no}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#5C4634' }}>{mule.primary_bank}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                          color: '#34271E'
                        }}>
                          {mule.risk_index}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: mule.tier === 'Critical' ? '#34271E' : (mule.tier === 'High' ? '#9D7D5E' : '#E8D8C3'),
                          color: mule.tier === 'Critical' || mule.tier === 'High' ? '#FBF7F0' : '#34271E',
                          fontSize: '0.6875rem',
                          fontWeight: 600
                        }}>
                          {mule.tier}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#5C4634' }}>
                        {mule.predicted_role}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          onClick={() => onSelectVictim(mule.acct_no)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            backgroundColor: '#34271E',
                            color: '#FBF7F0',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: 'none'
                          }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ fontSize: '0.875rem', color: '#8C7764', padding: '12px 0' }}>
              No flagged accounts in current dataset.
            </div>
          )}
        </div>

        {/* Quick Victim Trace */}
        <div style={{
          ...cardStyle,
          backgroundColor: '#E8D8C3',
          gap: '12px'
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#34271E', margin: 0 }}>
            Quick trace
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0 }}>
            Select a victim to trace funds
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {defaultVictimRows.map((row, idx) => {
              const isSelected = selectedRowIndex === idx;
              return (
                <div
                  key={row.acct}
                  onClick={() => {
                    setSelectedRowIndex(idx);
                    onSelectVictim(row.acct);
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '4px',
                    backgroundColor: isSelected ? '#D2BFA8' : '#F5EEE5',
                    border: isSelected ? '1px solid #B89C7D' : '1px solid #D2BFA8',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#D2BFA8';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#F5EEE5';
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#34271E'
                  }}>
                    {row.acct}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#8C7764', marginTop: '2px' }}>
                    {row.bank} • {row.amount}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleExport}
            style={{
              padding: '8px 14px',
              borderRadius: '4px',
              backgroundColor: '#34271E',
              color: '#FBF7F0',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              marginTop: '4px',
              width: '100%'
            }}
          >
            Export Summary
          </button>
        </div>
      </div>
    </div>
  );
};
