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
    <aside style={{
      width: '250px',
      minWidth: '250px',
      backgroundColor: '#091326',
      borderRight: '1px solid #142038',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 16px',
      flexShrink: 0,
      userSelect: 'none',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle atmospheric command center background image with low opacity */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/sidebar_bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        opacity: 0.12,
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Dark overlay gradient to ensure clean readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(9,19,38,0.92) 0%, rgba(9,19,38,0.82) 40%, rgba(9,19,38,0.96) 100%)',
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Logo container using user's uploaded official Vajra emblem */}
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            <img
              src="/vajra_logo.png"
              alt="Vajra"
              style={{
                width: '36px',
                height: '36px',
                objectFit: 'contain'
              }}
            />
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
              color: '#94A3B8',
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
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, color 0.15s',
                  textAlign: 'left',
                  border: 'none',
                  width: '100%',
                  boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none'
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
        position: 'relative',
        zIndex: 2,
        padding: '12px 14px',
        backgroundColor: 'rgba(13, 25, 50, 0.85)',
        backdropFilter: 'blur(8px)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <ShieldCheck size={18} color="#3B82F6" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F8FAFC' }}>
            Fraud Detection
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
            For a Safer Tomorrow
          </span>
        </div>
      </div>
    </aside>
  );
};
