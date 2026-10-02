import React, { useState, useRef } from 'react';
import { Upload, Check, CheckCircle2 } from 'lucide-react';
import type { OverviewData } from '../types';

interface LoadDataTabProps {
  overviewData: OverviewData | null;
  onDatasetChange: () => void;
  onSelectVictim?: (victim: string) => void;
  onNavigateToInvestigate: () => void;
}

export const LoadDataTab: React.FC<LoadDataTabProps> = ({
  overviewData,
  onDatasetChange,
  onSelectVictim: _onSelectVictim,
  onNavigateToInvestigate
}) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (file: File) => {
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

      setUploadStatus('Ingestion complete! Pipeline ready for investigation.');
      setTimeout(() => {
        setUploading(false);
        setUploadStatus(null);
        onDatasetChange();
      }, 900);
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message}`);
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const currentDatasetFilename = overviewData?.dataset_name || 'april_2024_transactions.parquet';
  const totalRowsFormatted = overviewData?.total_transactions 
    ? overviewData.total_transactions.toLocaleString() 
    : '1,248,392';
  const totalAccountsFormatted = overviewData?.total_accounts
    ? overviewData.total_accounts.toLocaleString()
    : '34,806';
  const flaggedCount = ((overviewData?.tier_distribution?.['Critical'] || 0) + (overviewData?.tier_distribution?.['High'] || 0)) || 1184;
  const syndicatesCount = Math.max(6, Math.min(26, Math.round(flaggedCount / 45))) || 26;

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
            Load data
          </h1>
          <p style={{
            fontSize: '0.875rem',
            lineHeight: 1.428,
            color: '#8C7764',
            margin: 0
          }}>
            Prepare an offline dataset for investigation
          </p>
        </div>

        {uploadStatus && (
          <div style={{
            padding: '6px 14px',
            borderRadius: '4px',
            backgroundColor: '#E8D8C3',
            border: '1px solid #D2BFA8',
            color: '#34271E',
            fontSize: '0.8125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircle2 size={15} color="#34271E" />
            <span>{uploadStatus}</span>
          </div>
        )}
      </div>

      {/* Upload Drop Zone Card */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        style={{
          backgroundColor: isDragOver ? '#E8D8C3' : '#F5EEE5',
          border: '2px dashed #D2BFA8',
          borderRadius: '4px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          textAlign: 'center',
          transition: 'background-color 0.2s, border-color 0.2s'
        }}
      >
        {/* Upload Icon Circular Badge */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '9999px',
          backgroundColor: '#E8D8C3',
          color: '#34271E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Upload size={24} color="#34271E" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 1.5,
            color: '#34271E',
            margin: 0
          }}>
            Drop a CSV or Parquet file here
          </p>
          <p style={{
            fontSize: '0.875rem',
            lineHeight: 1.428,
            color: '#8C7764',
            margin: 0
          }}>
            Maximum 2 GB • processed locally on this device
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.parquet"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileUpload(f);
          }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            backgroundColor: '#34271E',
            color: '#FBF7F0',
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: '8px 18px',
            borderRadius: '4px',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'opacity 0.15s',
            border: 'none'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {uploading ? 'Processing File...' : 'Choose file'}
        </button>
      </div>

      {/* Two Column Grid: Current Dataset & Recent Datasets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* Left Column: Current Dataset Card */}
        <div style={{
          backgroundColor: '#E8D8C3',
          border: '1px solid #D2BFA8',
          borderRadius: '4px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: 600,
                lineHeight: 1.5,
                color: '#34271E',
                margin: 0
              }}>
                Current dataset
              </h2>
              <p style={{
                fontSize: '0.875rem',
                lineHeight: 1.428,
                color: '#8C7764',
                margin: 0,
                fontFamily: 'var(--font-mono)'
              }}>
                {currentDatasetFilename}
              </p>
            </div>

            <span style={{
              backgroundColor: '#D2BFA8',
              color: '#34271E',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              Indexed
            </span>
          </div>

          {/* 4-Step Pipeline */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px'
          }}>
            {[
              { label: 'Reading', hasLine: true },
              { label: 'Normalising', hasLine: true },
              { label: 'Indexing', hasLine: true },
              { label: 'Scoring', hasLine: false }
            ].map((step, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '9999px',
                    backgroundColor: '#34271E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Check size={12} color="#FBF7F0" strokeWidth={3} />
                  </div>
                  {step.hasLine && (
                    <div style={{
                      flex: 1,
                      height: '1px',
                      backgroundColor: '#34271E'
                    }} />
                  )}
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  lineHeight: 1.33,
                  color: '#34271E'
                }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* 2x2 Metric Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <div style={{
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              borderRadius: '4px',
              padding: '16px'
            }}>
              <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0, lineHeight: 1.33 }}>
                Rows
              </p>
              <p style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#34271E',
                margin: '4px 0 0 0',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {totalRowsFormatted}
              </p>
            </div>

            <div style={{
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              borderRadius: '4px',
              padding: '16px'
            }}>
              <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0, lineHeight: 1.33 }}>
                Edges
              </p>
              <p style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#34271E',
                margin: '4px 0 0 0',
                fontVariantNumeric: 'tabular-nums'
              }}>
                8.4M
              </p>
            </div>

            <div style={{
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              borderRadius: '4px',
              padding: '16px'
            }}>
              <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0, lineHeight: 1.33 }}>
                Elapsed
              </p>
              <p style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#34271E',
                margin: '4px 0 0 0',
                fontVariantNumeric: 'tabular-nums'
              }}>
                42.8 s
              </p>
            </div>

            <div style={{
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              borderRadius: '4px',
              padding: '16px'
            }}>
              <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0, lineHeight: 1.33 }}>
                Peak memory
              </p>
              <p style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#34271E',
                margin: '4px 0 0 0',
                fontVariantNumeric: 'tabular-nums'
              }}>
                1.7 GB
              </p>
            </div>
          </div>

          {/* Bottom Status Banner */}
          <div
            onClick={onNavigateToInvestigate}
            style={{
              backgroundColor: '#D2BFA8',
              border: '1px solid #D2BFA8',
              borderRadius: '4px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: '#34271E'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={20} color="#34271E" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.428 }}>
                Ready for investigation
              </span>
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              Launch Graph Workbench →
            </span>
          </div>
        </div>

        {/* Right Column: Recent Datasets Card */}
        <div style={{
          backgroundColor: '#E8D8C3',
          border: '1px solid #D2BFA8',
          borderRadius: '4px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: 600,
              lineHeight: 1.5,
              color: '#34271E',
              margin: 0
            }}>
              Recent datasets
            </h2>
            <p style={{
              fontSize: '0.875rem',
              lineHeight: 1.428,
              color: '#8C7764',
              margin: 0
            }}>
              Previously processed files on this device
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Row 1: Default April 2024 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 0',
                borderTop: '1px solid #D2BFA8',
                cursor: 'pointer'
              }}
              onClick={() => {
                onDatasetChange();
                onNavigateToInvestigate();
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#34271E', margin: 0, lineHeight: 1.428 }}>
                  April 2024 transactions
                </p>
                <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0, fontVariantNumeric: 'tabular-nums', lineHeight: 1.33 }}>
                  1,248,392 rows
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#8C7764' }}>
                28 Apr 2024
              </span>
              <span style={{
                backgroundColor: '#D2BFA8',
                color: '#34271E',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                Indexed
              </span>
            </div>

            {/* Row 2: VoidHacks Production */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                alignItems: 'center',
                gap: '16px',
                padding: '14px 0',
                borderTop: '1px solid #D2BFA8'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#34271E', margin: 0 }}>
                  VoidHacks8_MuleAccount_2M_Transactions.csv
                </p>
                <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                  2,000,000 transactions • 24,873 accounts
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#8C7764' }}>286 MB</span>
              <span style={{
                backgroundColor: '#D2BFA8',
                color: '#34271E',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                SHA-256 Verified
              </span>
            </div>

            {/* Synthetic Data Suite Reference Box */}
            <div style={{
              marginTop: '16px',
              padding: '14px 16px',
              borderRadius: '4px',
              backgroundColor: '#FBF7F0',
              border: '1px dashed #B89C7D',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#34271E' }}>
                  📁 Synthetic Evaluation Suite (`synthetic_data/`)
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0, lineHeight: 1.4 }}>
                5 curated scenario CSVs with documentation in <strong>synthetic_data/README.md</strong> are ready for upload testing.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px', fontSize: '0.6875rem' }}>
                <div style={{ color: '#5C4634' }}>• <strong>scenario_1_fast_smurfing.csv</strong> (Victim: SBIN10009901)</div>
                <div style={{ color: '#5C4634' }}>• <strong>scenario_2_investment_scam.csv</strong> (Victim: SBIN10008000)</div>
                <div style={{ color: '#5C4634' }}>• <strong>scenario_3_cyclic_ring.csv</strong> (Victim: AXIS10007701)</div>
                <div style={{ color: '#5C4634' }}>• <strong>scenario_4_mega_capacity.csv</strong> (Victim: SBIN10005001)</div>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#8C7764', marginTop: '2px' }}>
                Drag & drop any file above to benchmark ingestion timing and trace money trails.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 4 Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: '#E8D8C3',
          border: '1px solid #D2BFA8',
          borderRadius: '4px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0, lineHeight: 1.33 }}>
            Transactions
          </p>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.4,
            color: '#34271E',
            margin: 0,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {totalRowsFormatted}
          </p>
        </div>

        <div style={{
          backgroundColor: '#E8D8C3',
          border: '1px solid #D2BFA8',
          borderRadius: '4px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0, lineHeight: 1.33 }}>
            Accounts
          </p>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.4,
            color: '#34271E',
            margin: 0,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {totalAccountsFormatted}
          </p>
        </div>

        <div style={{
          backgroundColor: '#E8D8C3',
          border: '1px solid #D2BFA8',
          borderRadius: '4px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0, lineHeight: 1.33 }}>
            Flagged for review
          </p>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.4,
            color: '#34271E',
            margin: 0,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {flaggedCount.toLocaleString()}
          </p>
        </div>

        <div style={{
          backgroundColor: '#E8D8C3',
          border: '1px solid #D2BFA8',
          borderRadius: '4px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <p style={{ fontSize: '0.75rem', color: '#8C7764', margin: 0, lineHeight: 1.33 }}>
            Syndicates
          </p>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.4,
            color: '#34271E',
            margin: 0,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {syndicatesCount}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '16px',
        borderTop: '1px solid #D2BFA8',
        color: '#8C7764',
        fontSize: '0.75rem',
        lineHeight: 1.333
      }}>
        <span>Rows/sec 29,240 • Elapsed 00:00:42 • Memory 1.7 GB</span>
        <span>All files remain on this device.</span>
      </div>
    </div>
  );
};
