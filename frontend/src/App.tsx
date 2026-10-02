import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OverviewTab } from './components/OverviewTab';
import { InvestigateTab } from './components/InvestigateTab';
import { AccountsTab } from './components/AccountsTab';
import { SyndicatesTab } from './components/SyndicatesTab';
import { LegalReportsTab } from './components/LegalReportsTab';
import { DatasetTab } from './components/DatasetTab';
import { LoadDataTab } from './components/LoadDataTab';
import { SettingsTab } from './components/SettingsTab';
import type { OverviewData } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedVictim, setSelectedVictim] = useState<string>('AIRP10000024');
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);

  const loadOverview = () => {
    fetch('/api/overview')
      .then(res => res.json())
      .then(data => {
        setOverviewData(data);
        if (data.sample_victims && data.sample_victims.length > 0) {
          setSelectedVictim(data.sample_victims[0]);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleSelectPreset = (preset: any) => {
    loadOverview();
    setSelectedVictim(preset.default_victim);
    setActiveTab('investigate');
  };

  const handleSelectVictim = (victim: string) => {
    setSelectedVictim(victim);
    setActiveTab('investigate');
  };

  const handleNavigateToLegal = (victim: string) => {
    setSelectedVictim(victim);
    setActiveTab('legal');
  };

  const datasetName = overviewData?.dataset_name || 'No dataset loaded';
  const totalRows = overviewData?.total_transactions || 0;

  return (
    <div style={{
      fontFamily: 'var(--font-sans)',
      color: '#5C4634',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#FBF7F0'
    }}>
      {/* Top Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        telemetry={overviewData?.telemetry || null}
        datasetName={datasetName}
        totalTransactions={totalRows}
        onDatasetReload={loadOverview}
        onSelectPreset={handleSelectPreset}
        onSelectAccount={handleSelectVictim}
      />

      {/* Body: Sidebar + Main Content */}
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main style={{
          flex: 1,
          minWidth: 0,
          backgroundColor: '#FBF7F0',
          padding: '24px 24px',
          overflowY: 'auto'
        }}>
          {activeTab === 'load' && (
            <LoadDataTab
              overviewData={overviewData}
              onDatasetChange={loadOverview}
              onSelectVictim={handleSelectVictim}
              onNavigateToInvestigate={() => setActiveTab('investigate')}
            />
          )}

          {activeTab === 'overview' && (
            <OverviewTab
              data={overviewData}
              onSelectVictim={handleSelectVictim}
            />
          )}

          {activeTab === 'investigate' && (
            <InvestigateTab
              initialVictim={selectedVictim}
              onNavigateToLegal={handleNavigateToLegal}
              onDatasetChange={loadOverview}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsTab
              data={overviewData}
              onSelectVictim={handleSelectVictim}
            />
          )}

          {activeTab === 'syndicates' && (
            <SyndicatesTab
              data={overviewData}
              onSelectVictim={handleSelectVictim}
            />
          )}

          {activeTab === 'legal' && (
            <LegalReportsTab
              victimAccount={selectedVictim}
            />
          )}

          {(activeTab === 'dataset' || activeTab === 'bench') && (
            <DatasetTab
              onSelectVictim={handleSelectVictim}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab />
          )}
        </main>
      </div>
    </div>
  );
};
export default App;
