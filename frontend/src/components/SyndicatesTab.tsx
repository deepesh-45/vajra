import React, { useState } from 'react';
import { Search, Info, ChevronRight } from 'lucide-react';
import type { OverviewData } from '../types';

interface SyndicatesTabProps {
  data: OverviewData | null;
  onSelectVictim: (victim: string) => void;
}

interface ClusterCard {
  id: string;
  name: string;
  accountsCount: number;
  confidence: number;
  tier: 'Critical' | 'High' | 'Medium';
  layers: { l1: number; l2: number; l3: number };
  victims: number;
  volume: string;
  coverage: string;
  sharedSignals: string;
  seedVictim: string;
}

export const SyndicatesTab: React.FC<SyndicatesTabProps> = ({ data, onSelectVictim }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'traced' | 'size' | 'coverage'>('traced');

  const sampleVictims = data?.sample_victims || ['AIRP10000024', 'SBIN10005001', 'PUNB10000052'];

  const clusters: ClusterCard[] = [
    {
      id: 'cluster-a17',
      name: 'Cluster A-17 (Multi-Hop Layering Ring)',
      accountsCount: 18,
      confidence: 94,
      tier: 'Critical',
      layers: { l1: 6, l2: 8, l3: 4 },
      victims: 4,
      volume: '₹1,84,20,000',
      coverage: '94%',
      sharedSignals: 'Same beneficiary • 11 min rapid pass-through burst',
      seedVictim: sampleVictims[0] || 'AIRP10000024'
    },
    {
      id: 'cluster-b04',
      name: 'Cluster B-04 (Fan-Out Mule Syndicate)',
      accountsCount: 14,
      confidence: 88,
      tier: 'High',
      layers: { l1: 4, l2: 6, l3: 4 },
      victims: 2,
      volume: '₹98,50,000',
      coverage: '89%',
      sharedSignals: 'Common mobile app device ID • IP foreign hop',
      seedVictim: sampleVictims[1] || 'SBIN10005001'
    },
    {
      id: 'cluster-c09',
      name: 'Cluster C-09 (High-Frequency Funnel Ring)',
      accountsCount: 22,
      confidence: 96,
      tier: 'Critical',
      layers: { l1: 8, l2: 10, l3: 4 },
      victims: 6,
      volume: '₹3,42,00,000',
      coverage: '97%',
      sharedSignals: 'Sub-5-minute transfers • Terminal ATM cash withdrawals',
      seedVictim: sampleVictims[2] || 'PUNB10000052'
    },
    {
      id: 'cluster-d02',
      name: 'Cluster D-02 (Inter-Bank Smurfing Pool)',
      accountsCount: 9,
      confidence: 78,
      tier: 'Medium',
      layers: { l1: 3, l2: 4, l3: 2 },
      victims: 2,
      volume: '₹46,10,000',
      coverage: '81%',
      sharedSignals: 'Split amounts under ₹50,000 reporting threshold',
      seedVictim: sampleVictims[0] || 'AIRP10000024'
    },
    {
      id: 'cluster-e11',
      name: 'Cluster E-11 (Merchant Gateway Shells)',
      accountsCount: 11,
      confidence: 83,
      tier: 'High',
      layers: { l1: 3, l2: 5, l3: 3 },
      victims: 3,
      volume: '₹72,80,000',
      coverage: '85%',
      sharedSignals: 'Fictitious corporate IFSC patterns • Rapid drain',
      seedVictim: sampleVictims[1] || 'SBIN10005001'
    },
    {
      id: 'cluster-f03',
      name: 'Cluster F-03 (Cyclic Wash Laundering Loop)',
      accountsCount: 16,
      confidence: 91,
      tier: 'Critical',
      layers: { l1: 5, l2: 7, l3: 4 },
      victims: 5,
      volume: '₹2,15,40,000',
      coverage: '92%',
      sharedSignals: 'Cyclic round-trip transactions • Layer 2 loop topology',
      seedVictim: sampleVictims[2] || 'PUNB10000052'
    }
  ];

  const filteredClusters = clusters.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.sharedSignals.toLowerCase().includes(q);
  });

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
      {/* Title & Info Bar */}
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
            Syndicates
          </h1>
          <p style={{
            fontSize: '0.875rem',
            lineHeight: 1.428,
            color: '#8C7764',
            margin: 0
          }}>
            Clusters grouped by shared transaction signals & coordinated money laundering patterns
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.75rem',
          color: '#8C7764'
        }}>
          <span>Confidence is calibrated across multi-layer GNN graph embeddings</span>
          <Info size={16} />
        </div>
      </div>

      {/* Filter and Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', width: '420px' }}>
          <Search size={16} color="#8C7764" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search cluster or shared signal..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: '4px',
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              color: '#5C4634',
              fontSize: '0.875rem',
              outline: 'none',
              fontFamily: 'var(--font-sans)'
            }}
          />
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          style={{
            padding: '10px 16px',
            borderRadius: '4px',
            backgroundColor: '#F5EEE5',
            border: '1px solid #D2BFA8',
            color: '#5C4634',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer'
          }}
        >
          <option value="traced">Sort by traced volume</option>
          <option value="size">Sort by cluster size</option>
          <option value="coverage">Sort by recovery coverage</option>
        </select>

        <div style={{
          padding: '8px 16px',
          borderRadius: '4px',
          backgroundColor: '#E8D8C3',
          border: '1px solid #D2BFA8',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#34271E'
        }}>
          Showing {filteredClusters.length} identified syndicates
        </div>
      </div>

      {/* Syndicates 3-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {filteredClusters.map(cluster => (
          <div
            key={cluster.id}
            style={{
              backgroundColor: '#E8D8C3',
              borderRadius: '8px',
              border: '1px solid #D2BFA8',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#34271E', margin: 0 }}>
                  {cluster.name}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#8C7764', margin: '4px 0 0 0' }}>
                  {cluster.accountsCount} mule accounts
                </p>
              </div>

              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: cluster.tier === 'Critical' ? '#8F6B4F' : '#B28C68',
                color: '#FBF7F0'
              }}>
                {cluster.tier} • {cluster.confidence}% conf
              </span>
            </div>

            {/* Layer Badges */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: '#F5EEE5',
                color: '#5C4634',
                border: '1px solid #D2BFA8',
                fontSize: '11px',
                fontWeight: 600
              }}>
                L1 {cluster.layers.l1}
              </span>
              <span style={{
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: '#F5EEE5',
                color: '#5C4634',
                border: '1px solid #D2BFA8',
                fontSize: '11px',
                fontWeight: 600
              }}>
                L2 {cluster.layers.l2}
              </span>
              <span style={{
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: '#F5EEE5',
                color: '#5C4634',
                border: '1px solid #D2BFA8',
                fontSize: '11px',
                fontWeight: 600
              }}>
                L3 {cluster.layers.l3}
              </span>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0 }}>Victims</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#34271E', margin: '2px 0 0 0' }}>
                  {cluster.victims}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0 }}>Volume</p>
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#34271E',
                  margin: '2px 0 0 0'
                }}>
                  {cluster.volume}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0 }}>Coverage</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#34271E', margin: '2px 0 0 0' }}>
                  {cluster.coverage}
                </p>
              </div>
            </div>

            {/* Shared Signals */}
            <div>
              <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0 }}>Shared signals</p>
              <p style={{ fontSize: '0.8125rem', color: '#5C4634', margin: '4px 0 0 0', fontWeight: 500 }}>
                {cluster.sharedSignals}
              </p>
            </div>

            {/* Action */}
            <button
              onClick={() => onSelectVictim(cluster.seedVictim)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: '4px',
                backgroundColor: '#34271E',
                color: '#FBF7F0',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                marginTop: 'auto'
              }}
            >
              <span>Open in Investigate</span>
              <ChevronRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
