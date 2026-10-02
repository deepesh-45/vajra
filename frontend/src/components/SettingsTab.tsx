import React, { useState } from 'react';
import { Save, RefreshCw, CheckCircle2 } from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const [flaggedThreshold, setFlaggedThreshold] = useState(70);
  const [highThreshold, setHighThreshold] = useState(75);
  const [criticalThreshold, setCriticalThreshold] = useState(90);
  const [rapidThreshold, setRapidThreshold] = useState(800000);

  const [rapidWeight, setRapidWeight] = useState(24);
  const [sharedWeight, setSharedWeight] = useState(18);
  const [burstWeight, setBurstWeight] = useState(16);
  const [loopWeight, setLoopWeight] = useState(22);

  const [airGappedMode, setAirGappedMode] = useState(true);
  const [cpuThreads, setCpuThreads] = useState(8);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleReset = () => {
    setFlaggedThreshold(70);
    setHighThreshold(75);
    setCriticalThreshold(90);
    setRapidThreshold(800000);
    setRapidWeight(24);
    setSharedWeight(18);
    setBurstWeight(16);
    setLoopWeight(22);
  };

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      fontFamily: 'var(--font-sans)',
      color: '#5C4634'
    }}>
      {/* Title Header */}
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
            Settings
          </h1>
          <p style={{
            fontSize: '0.875rem',
            lineHeight: 1.428,
            color: '#8C7764',
            margin: 0
          }}>
            Local configuration & model calibration for this offline forensic workstation
          </p>
        </div>

        {savedNotice && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '4px',
            backgroundColor: '#E8D8C3',
            border: '1px solid #D2BFA8',
            color: '#34271E',
            fontSize: '0.8125rem',
            fontWeight: 600
          }}>
            <CheckCircle2 size={16} />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Card 1: Risk Thresholds */}
      <div style={{
        backgroundColor: '#E8D8C3',
        borderRadius: '8px',
        border: '1px solid #D2BFA8',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#34271E',
          margin: 0
        }}>
          Risk thresholds
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#5C4634' }}>
              Flagged review threshold (score)
            </label>
            <input
              type="number"
              value={flaggedThreshold}
              onChange={e => setFlaggedThreshold(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                backgroundColor: '#F5EEE5',
                border: '1px solid #D2BFA8',
                color: '#5C4634',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#5C4634' }}>
              High tier threshold (score)
            </label>
            <input
              type="number"
              value={highThreshold}
              onChange={e => setHighThreshold(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                backgroundColor: '#F5EEE5',
                border: '1px solid #D2BFA8',
                color: '#5C4634',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#5C4634' }}>
              Critical tier threshold (score)
            </label>
            <input
              type="number"
              value={criticalThreshold}
              onChange={e => setCriticalThreshold(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                backgroundColor: '#F5EEE5',
                border: '1px solid #D2BFA8',
                color: '#5C4634',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#5C4634' }}>
            Rapid pass-through trigger threshold (₹ INR)
          </label>
          <input
            type="number"
            value={rapidThreshold}
            onChange={e => setRapidThreshold(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              color: '#5C4634',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      {/* Card 2: Scoring Weights */}
      <div style={{
        backgroundColor: '#E8D8C3',
        borderRadius: '8px',
        border: '1px solid #D2BFA8',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#34271E',
          margin: 0
        }}>
          GNN & Hybrid Feature Weights
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>Rapid pass-through velocity</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#8C7764' }}>Time between incoming credits and outgoing debits</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min="0"
                max="50"
                value={rapidWeight}
                onChange={e => setRapidWeight(Number(e.target.value))}
                style={{ width: '160px', accentColor: '#34271E' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, width: '32px', textAlign: 'right' }}>
                {rapidWeight}%
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>Shared beneficiary syndication</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#8C7764' }}>Co-occurrence in common recipient nodes across hops</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min="0"
                max="50"
                value={sharedWeight}
                onChange={e => setSharedWeight(Number(e.target.value))}
                style={{ width: '160px', accentColor: '#34271E' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, width: '32px', textAlign: 'right' }}>
                {sharedWeight}%
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>Burst timing dispersion</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#8C7764' }}>Clustered transactions occurring inside tight temporal windows</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min="0"
                max="50"
                value={burstWeight}
                onChange={e => setBurstWeight(Number(e.target.value))}
                style={{ width: '160px', accentColor: '#34271E' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, width: '32px', textAlign: 'right' }}>
                {burstWeight}%
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>Cyclic loop & smurfing topology</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#8C7764' }}>Graph motifs showing round-trip laundering loops</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min="0"
                max="50"
                value={loopWeight}
                onChange={e => setLoopWeight(Number(e.target.value))}
                style={{ width: '160px', accentColor: '#34271E' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, width: '32px', textAlign: 'right' }}>
                {loopWeight}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Offline Air-Gap & Hardware Runtime */}
      <div style={{
        backgroundColor: '#E8D8C3',
        borderRadius: '8px',
        border: '1px solid #D2BFA8',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#34271E',
          margin: 0
        }}>
          Offline Air-Gap & Hardware Optimization
        </h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>Enforce 100% Offline Air-Gap</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#8C7764' }}>Blocks all external HTTP outbound requests; strictly local RAM inference</p>
          </div>
          <input
            type="checkbox"
            checked={airGappedMode}
            onChange={e => setAirGappedMode(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>Parallel CPU Worker Threads</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#8C7764' }}>Multithreaded vector indexing for Parquet dataset ingestion</p>
          </div>
          <select
            value={cpuThreads}
            onChange={e => setCpuThreads(Number(e.target.value))}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              color: '#5C4634',
              fontSize: '0.875rem'
            }}
          >
            <option value={4}>4 Threads</option>
            <option value={8}>8 Threads (Recommended)</option>
            <option value={12}>12 Threads</option>
            <option value={16}>16 Threads</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleSave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '4px',
            backgroundColor: '#34271E',
            color: '#FBF7F0',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            fontFamily: 'var(--font-sans)'
          }}
        >
          <Save size={16} />
          <span>Save Configuration</span>
        </button>

        <button
          onClick={handleReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '4px',
            backgroundColor: '#F5EEE5',
            color: '#5C4634',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            border: '1px solid #D2BFA8',
            fontFamily: 'var(--font-sans)'
          }}
        >
          <RefreshCw size={16} />
          <span>Reset to Defaults</span>
        </button>
      </div>
    </div>
  );
};
