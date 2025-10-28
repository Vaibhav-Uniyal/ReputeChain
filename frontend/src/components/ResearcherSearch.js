import React, { useState } from 'react';
import { ethers } from 'ethers';
import ContractAddress, { REPUTE_LEDGER_ABI } from '../config';

function ResearcherSearch({ provider }) {
  const [searchAddress, setSearchAddress] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchResearcher = async () => {
    if (!searchAddress.trim()) {
      setError('Please enter a researcher address');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const contract = new ethers.Contract(ContractAddress, REPUTE_LEDGER_ABI, provider);
      
      // Get profile
      const [profile, contributions] = await Promise.all([
        contract.getResearcherProfile(searchAddress),
        contract.getResearcherContributionCount(searchAddress)
      ]);

      if (!profile.isRegistered) {
        setError('Researcher not found or not registered');
        setLoading(false);
        return;
      }

      // Get contribution IDs
      const contributionIds = await contract.getResearcherContributionIds(searchAddress);
      
      setResults({
        address: searchAddress,
        totalTokens: profile.totalTokens.toString(),
        contributionCount: contributions.toString(),
        lastUpdate: new Date(profile.lastUpdate * 1000).toLocaleDateString(),
        contributions: contributionIds
      });

    } catch (err) {
      console.error('Search error:', err);
      setError('Error searching researcher: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">👤 Search Researcher</h2>
      
      <div className="input-group">
        <label>Researcher Wallet Address</label>
        <input
          type="text"
          placeholder="0x..."
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
        />
      </div>

      <button 
        className="btn btn-primary" 
        onClick={searchResearcher}
        disabled={loading}
      >
        {loading ? 'Searching...' : '🔍 Search'}
      </button>

      {error && <div className="error">{error}</div>}

      {results && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Researcher Profile</h3>
          <div className="stats-grid">
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="stat-value" style={{ fontSize: '2rem' }}>{results.totalTokens}</div>
              <div className="stat-label">ReputeTokens</div>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="stat-value" style={{ fontSize: '2rem' }}>{results.contributionCount}</div>
              <div className="stat-label">Contributions</div>
            </div>
          </div>
          <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <p><strong>Address:</strong> {results.address}</p>
            <p><strong>Last Update:</strong> {results.lastUpdate}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResearcherSearch;

