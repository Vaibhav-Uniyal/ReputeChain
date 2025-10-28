import React, { useState } from 'react';
import { ethers } from 'ethers';
import ContractAddress, { REPUTE_LEDGER_ABI } from '../config';

function ContributorPortal({ provider, signer, account }) {
  const [orcid, setOrcid] = useState('');
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const registerResearcher = async () => {
    if (!orcid.trim()) {
      setMessage('Please enter your ORCID');
      setIsSuccess(false);
      return;
    }

    setRegistering(true);
    setMessage('');

    try {
      const contract = new ethers.Contract(ContractAddress, REPUTE_LEDGER_ABI, signer);
      const tx = await contract.registerResearcher(orcid);
      
      setMessage('Transaction sent! Waiting for confirmation...');
      await tx.wait();
      
      setMessage('Successfully registered with ReputeChain!');
      setIsSuccess(true);
      setOrcid('');
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('Registration failed: ' + error.message);
      setIsSuccess(false);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">📝 Contributor Portal</h2>
      
      <div className="input-group">
        <label>Your ORCID ID</label>
        <input
          type="text"
          placeholder="0000-0002-1825-0097"
          value={orcid}
          onChange={(e) => setOrcid(e.target.value)}
        />
        <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
          Get your ORCID at orcid.org
        </small>
      </div>

      <button 
        className="btn btn-primary" 
        onClick={registerResearcher}
        disabled={registering || !account}
      >
        {registering ? 'Registering...' : '✅ Register as Researcher'}
      </button>

      {message && (
        <div className={isSuccess ? 'success' : 'error'} style={{ marginTop: '15px' }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '10px' }}>Contribution Types</h4>
        <ul style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.8' }}>
          <li>📄 Publication - 100 tokens</li>
          <li>✍️ Peer Review - 30 tokens</li>
          <li>💾 Dataset - 60 tokens</li>
          <li>💻 Code - 40 tokens</li>
          <li>🎓 Mentorship - 50 tokens</li>
          <li>💰 Grant - 150 tokens</li>
        </ul>
      </div>
    </div>
  );
}

export default ContributorPortal;

