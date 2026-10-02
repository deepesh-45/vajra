import React from 'react';
import {
  LayoutDashboard,
  Search,
  Users,
  Network,
  FileText,
  Database,
  UploadCloud,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'investigate', label: 'Investigate', icon: Search },
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
      width: '240px',
      minWidth: '240px',
      backgroundColor: '#E8D8C3',
      borderRight: '1px solid #D2BFA8',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '8px',
      flexShrink: 0
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }} aria-label="Main navigation">
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
                padding: '9px 12px',
                borderRadius: '4px',
                backgroundColor: isActive ? '#D2BFA8' : 'transparent',
                color: '#34271E',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'background-color 0.15s, color 0.15s',
                textAlign: 'left',
                border: 'none',
                fontFamily: 'var(--font-sans)',
                width: '100%'
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(210, 191, 168, 0.4)';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} color="#34271E" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Offline Status Footer in Sidebar */}
      <div style={{
        padding: '12px',
        backgroundColor: '#F5EEE5',
        borderRadius: '4px',
        border: '1px solid #D2BFA8',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#34271E' }}>Air-Gapped Node</span>
          <span style={{
            fontSize: '9px',
            padding: '2px 6px',
            borderRadius: '3px',
            backgroundColor: '#D2BFA8',
            color: '#34271E',
            fontWeight: 700
          }}>
            LOCAL
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#8C7764' }}>
          Zero Cloud Egress • SHA-256 Verifiable
        </span>
      </div>
    </aside>
  );
};
