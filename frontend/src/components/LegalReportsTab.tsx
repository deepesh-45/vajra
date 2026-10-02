import { useState, useEffect } from 'react';
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
  Info
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
  const [docType, setDocType] = useState<'diary' | 'freeze' | 'freeze_hi'>('freeze');
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

  const handlePrint = () => {
    window.print();
  };

  const activeProfile = profilesList.find(p => p.id === selectedProfile);
  const isStale = reportData?.staleness?.is_stale || packMeta?.staleness?.is_stale;
  const stalenessWarning = reportData?.staleness?.warning || packMeta?.staleness?.warning;

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Title Header with Draft & Version Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#0F172A',
              margin: 0
            }}>
              Reports & Statutory Notices
            </h1>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FDE68A',
              padding: '2px 8px',
              borderRadius: '6px',
              letterSpacing: '0.04em'
            }}>
              DRAFT
            </span>
            {packMeta?.pack_version && (
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                Legal Pack v{packMeta.pack_version}
              </span>
            )}
          </div>
          <p style={{
            fontSize: '0.875rem',
            lineHeight: 1.4,
            color: '#64748B',
            margin: 0
          }}>
            Ollama is used strictly as a prose writer; all legal section citations and clauses derive from human-reviewed statute packs.
          </p>
        </div>

        {/* Watch List Toggle Button */}
        <button
          onClick={() => setShowWatchList(!showWatchList)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '8px',
            backgroundColor: showWatchList ? '#EFF6FF' : '#FFFFFF',
            border: '1px solid #CBD5E1',
            color: '#1E293B',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Scale size={14} color="#2563EB" />
          <span>Legal Cell Watch List</span>
          <span style={{
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            fontSize: '10px',
            borderRadius: '10px',
            padding: '0 5px',
            fontWeight: 700
          }}>
            {packMeta?.watch_list?.length || 4}
          </span>
        </button>
      </div>

      {/* Staleness / Unreviewed Warning Banner */}
      {isStale && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FCD34D',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#92400E',
          fontSize: '13px'
        }}>
          <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong>Legal Pack Advisory: </strong>
            {stalenessWarning || "Legal pack not recently reviewed — confirm current law before use."}
          </div>
          <span style={{ fontSize: '11px', color: '#B45309', fontWeight: 600 }}>
            Valid as of: {packMeta?.valid_as_of || '2026-10-02'}
          </span>
        </div>
      )}

      {/* Watch List Modal / Expansion Box */}
      {showWatchList && (
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} color="#2563EB" />
            <strong style={{ fontSize: '13px', color: '#0F172A' }}>
              Indore Police Commissionerate Legal Cell Watch List (Pre-Dispatch Verification)
            </strong>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
            {(packMeta?.watch_list || [
              "Confirm whether a lien under s.106 BNSS suffices or a Magistrate order under s.107 BNSS is required in target High Court jurisdiction",
              "Verify compliance with MHA SOP dated 10 April 2026: 7-day bank upload, 15-day IO decision, 90-day grievance expiry",
              "Ensure no blanket whole-account debit-freeze is ordered without explicit written judicial authorization",
              "Confirm mandatory intimation is delivered to the Jurisdictional Judicial Magistrate forthwith"
            ]).map((item: string, idx: number) => (
              <li key={idx}><strong>{item}</strong></li>
            ))}
          </ul>
        </div>
      )}

      {/* Document Selector, Profile Switcher & Actions */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '16px 20px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
      }}>
        {/* Top Row: Document Type Pills */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setDocType('freeze')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: docType === 'freeze' ? '#2563EB' : '#F8FAFC',
                color: docType === 'freeze' ? '#FFFFFF' : '#334155',
                border: `1px solid ${docType === 'freeze' ? '#2563EB' : '#E2E8F0'}`,
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Building2 size={16} />
              <span>Statutory Bank Lien Notice (English)</span>
            </button>

            <button
              onClick={() => setDocType('freeze_hi')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: docType === 'freeze_hi' ? '#2563EB' : '#F8FAFC',
                color: docType === 'freeze_hi' ? '#FFFFFF' : '#334155',
                border: `1px solid ${docType === 'freeze_hi' ? '#2563EB' : '#E2E8F0'}`,
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Building2 size={16} />
              <span>बैंक लीन आदेश (हिन्दी - परीक्षित खंड)</span>
            </button>

            <button
              onClick={() => setDocType('diary')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: docType === 'diary' ? '#2563EB' : '#F8FAFC',
                color: docType === 'diary' ? '#FFFFFF' : '#334155',
                border: `1px solid ${docType === 'diary' ? '#2563EB' : '#E2E8F0'}`,
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <FileText size={16} />
              <span>Case Diary (Sec 192 BNSS / 172 CrPC)</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={16} color="#16A34A" /> : <Copy size={16} />}
              <span>{copied ? 'Copied' : 'Copy Notice'}</span>
            </button>

            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#2563EB',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                color: '#FFFFFF',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
              }}
            >
              <Printer size={16} />
              <span>Print Official Draft</span>
            </button>
          </div>
        </div>

        {/* Second Row: Jurisdiction Profile Switcher & Target Bank */}
        {docType !== 'diary' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #F1F5F9',
            flexWrap: 'wrap'
          }}>
            {/* Legal Profile Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                Legal Jurisdiction Profile:
              </span>
              <select
                value={selectedProfile}
                onChange={e => setSelectedProfile(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#F8FAFC',
                  color: '#0F172A',
                  cursor: 'pointer',
                  maxWidth: '360px'
                }}
              >
                {profilesList.length > 0 ? (
                  profilesList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="indore_default">Indore / MP High Court Default (Archana v State of MP, 2026)</option>
                    <option value="bombay_strict_107">Bombay High Court Strict Profile (Section 107 BNSS Attachment)</option>
                    <option value="delhi_magistrate_attachment">Delhi High Court Seizure & Judicial Attachment Profile</option>
                    <option value="permissive_106">Allahabad / Permissive Police Seizure Profile (Section 106 BNSS)</option>
                  </>
                )}
              </select>
            </div>

            {/* Target Bank Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                Target Bank:
              </span>
              <select
                value={targetBank}
                onChange={e => setTargetBank(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
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
                <option value="IPOS">India Post Payments Bank</option>
              </select>
            </div>

            {/* Profile Brief Description */}
            {activeProfile && (
              <span style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
                {activeProfile.description}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dual Verification (AST Facts + Legal Citations) Certificate Banner */}
      {reportData?.verification && (
        <div style={{
          backgroundColor: reportData.verification.verified ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${reportData.verification.verified ? '#A7F3D0' : '#FECACA'}`,
          borderRadius: '12px',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={28} color={reportData.verification.verified ? '#059669' : '#DC2626'} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: reportData.verification.verified ? '#065F46' : '#991B1B' }}>
                {reportData.verification.compliance_status}
              </div>
              <div style={{ fontSize: '12px', color: reportData.verification.verified ? '#047857' : '#B91C1C', marginTop: '2px' }}>
                Fact Guardrail: {reportData.verification.counts?.accounts_checked || 0} Accounts, {reportData.verification.counts?.txns_checked || 0} Txns Verified ·
                Legal Guardrail: {reportData.verification.counts?.citations_checked || 0} Statutory Citations Verified Against Legal Pack
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginBottom: '2px' }}>
              <Sparkles size={12} color="#059669" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#065F46' }}>
                {reportData.writer_engine || 'Deterministic Engine (Code-Selected Clauses)'}
              </span>
            </div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#047857' }}>
              SHA-256: {reportData.sha256?.slice(0, 24)}...
            </div>
          </div>
        </div>
      )}

      {/* Legal Notice Document Preview */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        minHeight: '480px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
            Generating court-ready legal notice with code-selected statutory clauses...
          </div>
        ) : reportData?.raw_text ? (
          <pre style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: 1.6,
            color: '#0F172A',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0
          }}>
            {reportData.raw_text}
          </pre>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
            No notice generated. Please select a victim account to initiate.
          </div>
        )}
      </div>
    </div>
  );
};
