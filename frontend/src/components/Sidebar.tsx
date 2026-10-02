import React from 'react';
import {
  FolderOpen,
  LayoutDashboard,
  Network,
  Users,
  Share2,
  FileText,
  Database,
  Settings,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Ordered as requested: Load Data (Studies) first, followed by Overview, Graph Explorer, Accounts, Syndicates, Dataset, Reports, Settings
const navItems = [
  { id: 'load', label: 'Load Data', icon: FolderOpen },
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'investigate', label: 'Graph Explorer', icon: Network },
  { id: 'accounts', label: 'Accounts', icon: Users },
  { id: 'syndicates', label: 'Syndicates', icon: Share2 },
  { id: 'dataset', label: 'Dataset', icon: Database },
  { id: 'legal', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="no-print" style={{
      width: '250px',
      minWidth: '250px',
      backgroundColor: 'var(--sidebar-bg, #F4EDE4)',
      borderRight: '1px solid var(--sidebar-border, #E2D7C8)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 16px',
      flexShrink: 0,
      userSelect: 'none',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '1px 0 3px rgba(60, 45, 30, 0.03)'
    }}>
      {/* Subtle atmospheric texture */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/sidebar_bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        opacity: 0.035,
        mixBlendMode: 'multiply',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Soft warm almond gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(244,237,228,0.96) 0%, rgba(244,237,228,0.92) 50%, rgba(244,237,228,0.98) 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Content wrapper with z-index to stay above background image */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column' }}>
        {/* Top Brand Header with Official Vajra Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 6px 20px 6px',
          borderBottom: '1px solid #E2D7C8'
        }}>
          {/* Logo container using official Vajra shield emblem */}
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2D7C8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 1px 3px rgba(60, 45, 30, 0.06)'
          }}>
            <img
              src="/vajra_logo.png"
              alt="Vajra"
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                VAJRA
              </span>
              <span className="brand-devanagari" style={{
                fontFamily: "'Alkatra', 'Modak', cursive, sans-serif",
                fontSize: '1.45rem',
                color: '#2563EB',
                lineHeight: 1
              }}>
                वज्र
              </span>
            </div>
            <span style={{
              fontSize: '0.6875rem',
              color: '#786A5C',
              fontWeight: 500,
              letterSpacing: '0.01em'
            }}>
              Financial Fraud Intelligence
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '18px' }}>
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
                  padding: '9px 14px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#2563EB' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#54473A',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, color 0.15s, box-shadow 0.15s',
                  textAlign: 'left',
                  border: 'none',
                  width: '100%',
                  boxShadow: isActive ? '0 2px 6px rgba(37, 99, 235, 0.28)' : 'none'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#EAE1D5';
                    e.currentTarget.style.color = '#1E293B';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#54473A';
                  }
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  color={isActive ? '#FFFFFF' : '#786A5C'}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Cyber Security Badge Card */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        padding: '12px 14px',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E2D7C8',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 2px 6px rgba(60, 45, 30, 0.05)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: '#EFF6FF',
          border: '1px solid #DBEAFE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <ShieldCheck size={18} color="#2563EB" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1E293B' }}>
            Fraud Detection
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#786A5C' }}>
            For a Safer Tomorrow
          </span>
        </div>
      </div>
    </aside>
  );
};
