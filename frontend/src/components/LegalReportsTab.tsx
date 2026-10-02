import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Printer,
  Copy,
  Check,
  FileText,
  Building2,
  AlertTriangle,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LegalReportsTabProps {
  victimAccount: string;
}

interface ProfileItem {
  id: string;
  name: string;
  title: string;
  primary_act: string;
  description: string;
  clause_count: number;
  review_days: number;
  max_days: number;
  allowed_citations: string[];
}

export const LegalReportsTab: React.FC<LegalReportsTabProps> = ({ victimAccount }) => {
  const [docType, setDocType] = useState<'freeze' | 'freeze_hi' | 'diary'>('freeze');
  const [targetBank, setTargetBank] = useState<string>('AXIS');
  const [selectedProfile, setSelectedProfile] = useState<string>('indore_default');
  const [profilesList, setProfilesList] = useState<ProfileItem[]>([]);
  const [packMeta, setPackMeta] = useState<any | null>(null);
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showWatchList, setShowWatchList] = useState(false);

  // Fetch Legal Pack Profiles on mount
  useEffect(() => {
    fetch('/api/reports/profiles')
      .then(res => res.json())
      .then(data => {
        setPackMeta(data);
        if (data.profiles && data.profiles.length > 0) {
          setProfilesList(data.profiles);
        }
      })
      .catch(console.error);
  }, []);

  const fetchDocument = async () => {
    if (!victimAccount) return;
    setLoading(true);

    try {
      if (docType === 'diary') {
        const resp = await fetch('/api/reports/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ victim_account: victimAccount })
        });
        const data = await resp.json();
        setReportData(data);
      } else if (docType === 'freeze') {
        const resp = await fetch('/api/reports/freeze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            victim_account: victimAccount,
            target_bank: targetBank,
            profile_id: selectedProfile,
            use_ollama: true
          })
        });
        const data = await resp.json();
        setReportData(data);
      } else {
        const resp = await fetch('/api/reports/freeze-hindi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            victim_account: victimAccount,
            target_bank: targetBank,
            profile_id: selectedProfile
          })
        });
        const data = await resp.json();
        setReportData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [docType, targetBank, selectedProfile, victimAccount]);

  const handleCopy = () => {
    if (reportData?.raw_text) {
      navigator.clipboard.writeText(reportData.raw_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Clean, dedicated print mechanism that prints strictly the document text
  const handlePrint = () => {
    if (!reportData?.raw_text) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const title = docType === 'diary'
      ? `Case_Diary_${victimAccount}`
      : `Statutory_Lien_Notice_${targetBank}_${victimAccount}`;

    const escapedText = reportData.raw_text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 18mm 16mm 18mm 16mm;
            }
            body {
              font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
              font-size: 10pt;
              line-height: 1.5;
              color: #000000;
              background: #FFFFFF;
              margin: 0;
              padding: 0;
              white-space: pre-wrap;
              word-break: break-word;
            }
          </style>
        </head>
        <body>${escapedText}</body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  };

  const isStale = reportData?.staleness?.is_stale || packMeta?.staleness?.is_stale;
  const stalenessWarning = reportData?.staleness?.warning || packMeta?.staleness?.warning;

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Sleek Top Header Bar (No-Print) */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#0F172A',
              margin: 0
            }}>
              Statutory Notices & Reports
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
            <span style={{
              fontSize: '10.5px',
              fontWeight: 700,
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FDE68A',
              padding: '1px 7px',
              borderRadius: '5px',
              letterSpacing: '0.04em'
            }}>
              DRAFT
            </span>
            {packMeta?.pack_version && (
              <span style={{
                fontSize: '10.5px',
                fontWeight: 600,
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                padding: '1px 7px',
                borderRadius: '5px'
              }}>
                Pack v{packMeta.pack_version}
              </span>
            )}
          </div>
          <p style={{
            fontSize: '0.8125rem',
            color: '#64748B',
            margin: '2px 0 0 0'
          }}>
            Investigating victim: <strong style={{ color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{victimAccount || 'No account selected'}</strong> · Police Commissionerate, Indore
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleCopy}
            disabled={!reportData?.raw_text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 13px',
              borderRadius: '7px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#334155',
              cursor: reportData?.raw_text ? 'pointer' : 'not-allowed',
              opacity: reportData?.raw_text ? 1 : 0.6,
              boxShadow: '0 1px 2px rgba(15,23,42,0.03)'
            }}
          >
            {copied ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!reportData?.raw_text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 15px',
              borderRadius: '7px',
              backgroundColor: '#2563EB',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#FFFFFF',
              cursor: reportData?.raw_text ? 'pointer' : 'not-allowed',
              opacity: reportData?.raw_text ? 1 : 0.6,
              boxShadow: '0 1px 3px rgba(37,99,235,0.25)'
            }}
          >
            <Printer size={14} />
            <span>Print Document</span>
          </button>
        </div>
      </div>

      {/* Streamlined Control Bar (No-Print) */}
      <div className="no-print" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '8px 14px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        boxShadow: '0 1px 2px rgba(15,23,42,0.02)'
      }}>
        {/* Left: Document Type Segmented Control */}
        <div style={{
          display: 'inline-flex',
          backgroundColor: '#F1F5F9',
          borderRadius: '7px',
          padding: '2px',
          gap: '2px'
        }}>
          <button
            onClick={() => setDocType('freeze')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: docType === 'freeze' ? '#FFFFFF' : 'transparent',
              color: docType === 'freeze' ? '#0F172A' : '#64748B',
              fontWeight: docType === 'freeze' ? 600 : 500,
              fontSize: '12px',
              border: 'none',
              boxShadow: docType === 'freeze' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer'
            }}
          >
            <Building2 size={13} color={docType === 'freeze' ? '#2563EB' : '#64748B'} />
            <span>Bank Lien Notice (EN)</span>
          </button>

          <button
            onClick={() => setDocType('freeze_hi')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: docType === 'freeze_hi' ? '#FFFFFF' : 'transparent',
              color: docType === 'freeze_hi' ? '#0F172A' : '#64748B',
              fontWeight: docType === 'freeze_hi' ? 600 : 500,
              fontSize: '12px',
              border: 'none',
              boxShadow: docType === 'freeze_hi' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer'
            }}
          >
            <Building2 size={13} color={docType === 'freeze_hi' ? '#2563EB' : '#64748B'} />
            <span>हिन्दी नोटिस (HI)</span>
          </button>

          <button
            onClick={() => setDocType('diary')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: docType === 'diary' ? '#FFFFFF' : 'transparent',
              color: docType === 'diary' ? '#0F172A' : '#64748B',
              fontWeight: docType === 'diary' ? 600 : 500,
              fontSize: '12px',
              border: 'none',
              boxShadow: docType === 'diary' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer'
            }}
          >
            <FileText size={13} color={docType === 'diary' ? '#2563EB' : '#64748B'} />
            <span>Case Diary (Sec 192)</span>
          </button>
        </div>

        {/* Right Controls: Jurisdiction & Bank Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {docType !== 'diary' && (
            <>
              {/* Profile Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 500 }}>
                  Profile:
                </span>
                <select
                  value={selectedProfile}
                  onChange={e => setSelectedProfile(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    backgroundColor: '#F8FAFC',
                    color: '#0F172A',
                    cursor: 'pointer',
                    maxWidth: '260px'
                  }}
                >
                  {profilesList.length > 0 ? (
                    profilesList.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name.split(' (')[0]}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="indore_default">Indore / MP High Court</option>
                      <option value="bombay_strict_107">Bombay High Court (Sec 107)</option>
                      <option value="delhi_magistrate_attachment">Delhi High Court (Attachment)</option>
                      <option value="permissive_106">Allahabad High Court (Sec 106)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Target Bank */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 500 }}>
                  Bank:
                </span>
                <select
                  value={targetBank}
                  onChange={e => setTargetBank(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    cursor: 'pointer'
                  }}
                >
                  <option value="AXIS">AXIS Bank</option>
                  <option value="HDFC">HDFC Bank</option>
                  <option value="KKBK">Kotak Mahindra Bank</option>
                  <option value="SBIN">State Bank of India</option>
                  <option value="ICIC">ICICI Bank</option>
                  <option value="PUNB">Punjab National Bank</option>
                  <option value="BARB">Bank of Baroda</option>
                  <option value="IPOS">India Post Payments</option>
                </select>
              </div>
            </>
          )}

          {/* Legal Watchlist Toggle */}
          <button
            onClick={() => setShowWatchList(!showWatchList)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 9px',
              borderRadius: '6px',
              backgroundColor: showWatchList ? '#EFF6FF' : '#F8FAFC',
              border: `1px solid ${showWatchList ? '#BFDBFE' : '#E2E8F0'}`,
              color: '#334155',
              fontSize: '11.5px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <Scale size={12} color="#2563EB" />
            <span>Watchlist</span>
            <span style={{
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontSize: '9.5px',
              borderRadius: '8px',
              padding: '0 4px',
              fontWeight: 700
            }}>
              {packMeta?.watch_list?.length || 4}
            </span>
            {showWatchList ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Expandable Legal Cell Watchlist Drawer (No-Print) */}
      {showWatchList && (
        <div className="no-print animate-fade-in" style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Indore Legal Cell Advisory Checkpoints (Archana v State of MP, 2026)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
            {(packMeta?.watch_list || [
              "Lien restricted strictly to traced disputed amount",
              "Mandatory prompt intimation to Jurisdictional Magistrate",
              "MHA 10-April-2026 SOP: 7-day bank upload, 15-day IO review, 90-day expiry",
              "Preservation of certified electronic KYC logs under Sec 63 BSA"
            ]).map((item: string, idx: number) => (
              <div key={idx} style={{
                fontSize: '11px',
                color: '#475569',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                lineHeight: 1.4
              }}>
                <span style={{ color: '#2563EB', fontWeight: 700 }}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slim Verification Status Strip (No-Print) */}
      <div className="no-print" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 12px',
        backgroundColor: reportData?.verification?.verified ? '#F0FDF4' : '#FEF2F2',
        border: `1px solid ${reportData?.verification?.verified ? '#BBF7D0' : '#FECACA'}`,
        borderRadius: '7px',
        fontSize: '11px',
        color: reportData?.verification?.verified ? '#166534' : '#991B1B'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={14} color={reportData?.verification?.verified ? '#16A34A' : '#DC2626'} />
          <span style={{ fontWeight: 600 }}>
            {reportData?.verification?.verified
              ? 'Dual Verified: 100% Factually & Legally Validated'
              : 'Verification Warning / Pending Review'}
          </span>
          {reportData?.total_lien_inr !== undefined && (
            <span style={{ color: '#4B5563' }}>
              · Lien: <strong style={{ color: '#0F172A' }}>₹{Number(reportData.total_lien_inr).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong> ({reportData.accounts_count} Accounts)
            </span>
          )}
          {isStale && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              color: '#B45309',
              backgroundColor: '#FEF3C7',
              padding: '1px 6px',
              borderRadius: '4px',
              fontWeight: 600
            }}>
              <AlertTriangle size={11} />
              <span>{stalenessWarning || 'Pack needs periodic review'}</span>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748B' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <Sparkles size={11} color="#2563EB" />
            <span>{reportData?.writer_engine || 'Deterministic Legal Pack Engine'}</span>
          </span>
          {reportData?.sha256 && (
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              SHA: {reportData.sha256.slice(0, 12)}
            </span>
          )}
        </div>
      </div>

      {/* Printable Document Sheet Canvas */}
      <div className="printable-document-container" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
        overflow: 'hidden'
      }}>
        {/* Subtle Canvas Top Bar (No-Print) */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          fontSize: '11px',
          color: '#64748B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={12} color="#2563EB" />
            <strong style={{ color: '#334155' }}>
              {docType === 'diary'
                ? 'CRIMINAL CASE DIARY ENTRY (SEC 192 BNSS / 172 CRPC)'
                : docType === 'freeze_hi'
                ? 'सांविधिक बैंक लीन नोटिस (हिन्दी प्रारूप)'
                : 'STATUTORY REQUISITION & AMOUNT LIEN NOTICE'}
            </strong>
          </div>
          <span>Official Police Document Preview</span>
        </div>

        {/* The Raw Document Text (Strictly Printed) */}
        <div style={{ padding: '24px 28px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: '13px' }}>
              Generating court-ready legal notice with code-selected statutory clauses...
            </div>
          ) : reportData?.raw_text ? (
            <pre className="printable-document-content" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: 1.55,
              color: '#0F172A',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0
            }}>
              {reportData.raw_text}
            </pre>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontSize: '13px' }}>
              No document generated. Select a valid victim account to initiate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalReportsTab;
