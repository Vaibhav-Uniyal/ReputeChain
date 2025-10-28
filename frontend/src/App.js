import React, { useState, useEffect } from 'react';
import './App.css';
import { ethers } from 'ethers';
import Dashboard from './components/Dashboard';
import ResearcherSearch from './components/ResearcherSearch';
import ContributorPortal from './components/ContributorPortal';
import ContractAddress from './config';

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [network, setNetwork] = useState(null);

  // Connect to MetaMask wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        
        const accounts = await provider.listAccounts();
        
        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0].address);
        setNetwork(network);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  // Get current wallet info
  useEffect(() => {
    const checkWallet = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();
          setProvider(provider);
          setSigner(signer);
          setAccount(accounts[0].address);
          setNetwork(network);
        }
      }
    };
    
    checkWallet();
    
    // Listen for account changes
    window.ethereum?.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setProvider(null);
        setSigner(null);
      } else {
        checkWallet();
      }
    });
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>🔗 ReputeChain</h1>
        <p>Transparent Researcher Reputation Ledger</p>
      </header>

      <div className="container">
        {!account ? (
          <div className="card">
            <h2>Connect Your Wallet</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Connect your MetaMask wallet to interact with ReputeChain
            </p>
            <button className="btn btn-primary" onClick={connectWallet}>
              🔐 Connect MetaMask
            </button>
          </div>
        ) : (
          <div>
            <div className="wallet-info">
              <p><strong>Connected Wallet:</strong></p>
              <p className="wallet-address">{account}</p>
              {network && (
                <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                  Network: {network.name} (Chain ID: {network.chainId})
                </p>
              )}
            </div>

            <div className="grid-2">
              <div>
                <ResearcherSearch provider={provider} />
              </div>
              <div>
                <ContributorPortal provider={provider} signer={signer} account={account} />
              </div>
            </div>

            <Dashboard provider={provider} signer={signer} account={account} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

