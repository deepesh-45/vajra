import { useState, useEffect } from 'react';
import { ShieldCheck, Printer, Copy, Check, FileText, Building2 } from 'lucide-react';

interface LegalReportsTabProps {
  victimAccount: string;
}

export const LegalReportsTab: React.FC<LegalReportsTabProps> = ({ victimAccount }) => {
  const [docType, setDocType] = useState<'diary' | 'freeze' | 'freeze_hi'>('diary');
  const [targetBank, setTargetBank] = useState<string>('AXIS');
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
          body: JSON.stringify({ victim_account: victimAccount, target_bank: targetBank })
        });
        const data = await resp.json();
        setReportData(data);
      } else {
        const resp = await fetch('/api/reports/freeze-hindi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ victim_account: victimAccount, target_bank: targetBank })
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
  }, [docType, targetBank, victimAccount]);

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

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: '#0F172A',
            margin: 0
          }}>
            Reports
          </h1>
          <p style={{
            fontSize: '0.875rem',
            lineHeight: 1.4,
            color: '#64748B',
            margin: 0
          }}>
            Generated case documents and statutory bank freeze notices
          </p>
        </div>
      </div>

      {/* Document Selector & Actions */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '16px 20px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
            <span>Police Case Diary (Sec 192 BNSS)</span>
          </button>

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
            <span>Bank Freeze Notice (English)</span>
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
            <span>बैंक फ्रीज आदेश (हिन्दी)</span>
          </button>

          {docType !== 'diary' && (
            <select
              value={targetBank}
              onChange={e => setTargetBank(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '13px',
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
          )}
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
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
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
            <span>Print Notice</span>
          </button>
        </div>
      </div>

      {/* Anti-Hallucination Guardrail Certificate Banner */}
      {reportData?.verification && (
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '12px',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={28} color="#059669" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#065F46' }}>
                {reportData.verification.compliance_status}
              </div>
              <div style={{ fontSize: '12px', color: '#047857' }}>
                Automated Programmatic Guardrail: Checked {reportData.verification.counts.accounts_checked} Accounts, {reportData.verification.counts.txns_checked} Transactions, {reportData.verification.counts.ifscs_checked} IFSCs. Zero Unverified Entities.
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#047857' }}>SHA-256 Digital Custody Hash:</div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#065F46' }}>
              {reportData.sha256?.slice(0, 24)}...
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
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Generating court-ready legal notice...</div>
        ) : reportData?.raw_text ? (
          <pre style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: 1.6,
            color: '#0F172A',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
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
