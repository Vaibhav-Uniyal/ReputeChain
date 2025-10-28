import React, { useState, useEffect } from 'react';
import { getReputationStats } from '../utils/contract';

function Dashboard({ provider, signer, account }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    if (!provider || !account) return;
    
    setLoading(true);
    try {
      const researcherStats = await getReputationStats(provider, account);
      setStats(researcherStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [provider, account]);

  if (loading) {
    return (
      <div className="card">
        <div className="loading">Loading your reputation data...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card">
        <h2 className="card-title">🎯 My Reputation Dashboard</h2>
        <p style={{ color: '#666' }}>Connect to see your ReputeChain stats</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card-title">🎯 My Reputation Dashboard</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalTokens}</div>
          <div className="stat-label">Total ReputeTokens</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.contributionCount}</div>
          <div className="stat-label">Contributions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.verifiedInstitutions.length}</div>
          <div className="stat-label">Verified Institutions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.isRegistered ? '✅' : '❌'}</div>
          <div className="stat-label">Registration Status</div>
        </div>
      </div>

      {stats.contributions && stats.contributions.length > 0 && (
        <div className="contribution-list">
          <h3 style={{ marginBottom: '15px' }}>Recent Contributions</h3>
          {stats.contributions.slice(0, 5).map((contribution, idx) => (
            <div key={idx} className="contribution-item">
              <div className="contribution-type">
                {getContributionTypeName(contribution.contributionType)}
              </div>
              <div className="contribution-meta">
                Tokens: {contribution.tokenAmount} | 
                Time: {new Date(contribution.timestamp * 1000).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-secondary" onClick={loadStats} style={{ marginTop: '20px' }}>
        🔄 Refresh Stats
      </button>
    </div>
  );
}

function getContributionTypeName(type) {
  const names = [
    'Publication',
    'Peer Review',
    'Dataset',
    'Code Contribution',
    'Mentorship',
    'Grant Acquisition'
  ];
  return names[type] || 'Unknown';
}

export default Dashboard;

