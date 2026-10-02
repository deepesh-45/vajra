import React from 'react';
import {
  LayoutDashboard,
  Users,
  Network,
  FileText,
  Database,
  UploadCloud,
  Settings,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'investigate', label: 'Graph Explorer', icon: Network },
  { id: 'accounts', label: 'Accounts', icon: Users },
  { id: 'syndicates', label: 'Syndicates', icon: Network },
  { id: 'legal', label: 'Reports', icon: FileText },
  { id: 'dataset', label: 'Dataset', icon: Database },
  { id: 'load', label: 'Load Data', icon: UploadCloud },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside style={{
      width: '250px',
      minWidth: '250px',
      backgroundColor: '#091326',
      backgroundImage: 'linear-gradient(180deg, #0A1428 0%, #060D1D 100%)',
      borderRight: '1px solid #142038',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 16px',
      flexShrink: 0,
      userSelect: 'none'
    }}>
      {/* Top Brand Header */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 8px 24px 8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
        }}>
          {/* Shield Badge Icon */}
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(37, 99, 235, 0.3)'
          }}>
            <ShieldAlert size={20} color="#60A5FA" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              Vajra
            </span>
            <span style={{
              fontSize: '0.6875rem',
              color: '#8FA0BE',
              fontWeight: 500,
              letterSpacing: '0.01em'
            }}>
              Financial Fraud Intelligence
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '20px' }}>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#2563EB' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  textAlign: 'left',
                  border: 'none',
                  width: '100%',
                  boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = '#F8FAFC';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  color={isActive ? '#FFFFFF' : '#94A3B8'}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Cyber Security Badge Card */}
      <div style={{
        padding: '14px',
        backgroundColor: '#0D1A34',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShieldCheck size={18} color="#60A5FA" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F8FAFC' }}>
            Fraud Detection
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
            For a Safer Tomorrow
          </span>
        </div>
      </div>
    </aside>
  );
};
