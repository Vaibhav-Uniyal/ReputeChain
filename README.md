# ReputeChain 🔗

**Transparent Researcher Reputation Ledger**

ReputeChain is a blockchain-based system that transforms academic contributions into verifiable, tamper-proof records. Built to recognize the "invisible labor" of research — peer reviews, code maintenance, dataset curation, and mentorship — that traditional metrics often overlook.

## 🎯 Overview

ReputeChain provides:
- **Decentralized Researcher Identity** - Researcher-owned blockchain identity
- **Verifiable Contributions** - Cryptographically signed academic contributions
- **Tokenized Reputation** - Non-tradable ReputeTokens for academic credibility
- **Smart Contract Verification** - Automated trust through blockchain logic
- **ORCID Integration** - Link blockchain identity to ORCID profiles

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              ReputeChain Stack                       │
├─────────────────────────────────────────────────────┤
│  Frontend/UI        │  User Interface               │
├─────────────────────────────────────────────────────┤
│  Ingestor          │  ORCID API Integration         │
├─────────────────────────────────────────────────────┤
│  Smart Contracts   │  ReputeLedger.sol              │
├─────────────────────────────────────────────────────┤
│  Blockchain        │  Ethereum/Hardhat Network      │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ReputeChain

# Install dependencies
npm install
```

### Setup Environment

Create a `.env` file in the root directory:

```bash
# Optional: Test ORCID to use for ingestion
TEST_ORCID=0000-0002-1825-0097

# Will be populated after deployment
CONTRACT_ADDRESS=
RESEARCHER_ADDRESS=
```

### Running Locally

```bash
# 1. Start local Hardhat network
npm run node

# 2. In a new terminal, deploy contracts
npm run deploy

# 3. Update .env with CONTRACT_ADDRESS from deployment

# 4. Ingest ORCID data (optional)
npm run ingest

# 5. Compile contracts (if needed)
npm run compile

# 6. Run tests
npm test

# 7. Start React Frontend
cd frontend
npm install
npm start
```

## 🎨 Frontend UI

ReputeChain includes a beautiful React-based web interface.

### Running the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

### Frontend Features

- 🔐 **MetaMask Integration** - Connect your wallet
- 👤 **Researcher Search** - Find and view researcher profiles
- 📊 **Reputation Dashboard** - Real-time token tracking
- 📝 **Registration Portal** - Register as a researcher
- 💰 **Token Analytics** - View contribution statistics

## 📁 Project Structure

```
ReputeChain/
├── contracts/
│   └── ReputeLedger.sol          # Main smart contract
├── scripts/
│   ├── deploy.js                 # Deployment script
│   └── ingest-orcid.js           # ORCID data ingestor
├── frontend/                     # React UI
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── utils/               # Contract utilities
│   │   └── App.js               # Main app component
│   └── package.json             # Frontend dependencies
├── test/                         # Hardhat tests
├── hardhat.config.js             # Hardhat configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

## 📜 Smart Contract

### ReputeLedger.sol

The core smart contract that manages:
- Researcher registration with ORCID
- Contribution recording and verification
- ReputeToken awards
- Institutional validator authorization

**Key Features:**
- Non-tradable ReputeTokens
- Contribution types: Publication, Peer Review, Dataset, Code, Mentorship, Grants
- Institutional verification nodes
- Immutable record of academic contributions

### Contribution Types

| Type | Tokens | Description |
|------|--------|-------------|
| Publication | 100 | Peer-reviewed articles |
| Peer Review | 30 | Journal/conference reviews |
| Dataset | 60 | Open data contributions |
| Code Contribution | 40 | Open source contributions |
| Mentorship | 50 | Student/supervisor work |
| Grant Acquisition | 150 | Research funding |

## 🔧 Scripts

### Deploy Contract
```bash
npm run deploy
```
Deploys ReputeLedger to local Hardhat network and sets up test accounts.

### Ingest ORCID Data
```bash
npm run ingest
```
Fetches researcher works from ORCID API and records them on-chain.

### Compile Contracts
```bash
npm run compile
```
Compiles Solidity contracts.

### Run Tests
```bash
npm test
```
Runs Hardhat test suite.

## 🔐 Security

- **Identity Verification**: Researchers must register with blockchain account
- **Validator Authorization**: Only authorized institutions can verify contributions
- **Immutable Records**: Once recorded, contributions cannot be modified
- **Private Keys**: Never share your private keys or seed phrases

## 🌐 Integration

### ORCID API
ReputeChain integrates with ORCID API to fetch researcher publications:

```javascript
// Fetch works from ORCID
const works = await fetchOrcidWorks('0000-0002-1825-0097');

// Record to blockchain
await recordContributionsToChain(contractAddress, researcherAddress, works);
```

### Adding Validators
Authorize institutional validators:

```javascript
await reputeLedger.setValidator(validatorAddress, true);
```

## 📊 Contribution Tracking

Each contribution includes:
- **Contributor**: Blockchain address
- **Type**: Publication, Review, Dataset, etc.
- **Timestamp**: Blockchain block timestamp
- **Metadata**: DOI, GitHub hash, or IPFS hash
- **Validator**: Authorized institution
- **Tokens**: ReputeTokens awarded

## 🎓 Use Cases

1. **Early Career Researchers**
   - Build verifiable reputation beyond citation counts
   - Showcase peer review contributions

2. **Open Science Advocates**
   - Get credit for open datasets and code
   - Document transparent research practices

3. **Academic Institutions**
   - Verify researcher contributions independently
   - Reduce reliance on self-reported metrics

4. **Publishers & Journals**
   - Verify reviewer participation
   - Encourage quality peer review

## 🚧 Future Enhancements

- [ ] IPFS integration for off-chain data storage
- [ ] Zero-knowledge proofs for private data
- [ ] Multi-chain support (Polygon, Arbitrum)
- [ ] Web3 frontend dashboard
- [ ] DeFi integration for token staking
- [ ] DAO governance model

## 📖 Documentation

### Smart Contract API

```solidity
// Register as researcher
function registerResearcher(string calldata orcid) external;

// Record contribution (validators only)
function recordContribution(
    address researcher,
    ContributionType type,
    string calldata metadata,
    address validator
) external returns (uint256);

// Get researcher tokens
function getResearcherTokens(address researcher) external view returns (uint256);

// Get contribution details
function getContribution(uint256 id) external view returns (Contribution memory);
```

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional contribution types
- Improved ORCID data parsing
- Frontend development
- Test coverage
- Documentation

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Ethereum Foundation for blockchain infrastructure
- ORCID for researcher identification
- OpenZeppelin for secure smart contract libraries
- Hardhat team for development tools

## 📧 Contact

For questions or collaboration:
- GitHub Issues
- Email: [your-email]

---

**Built with ❤️ for transparent academic recognition**

```
╔══════════════════════════════════════════════╗
║         ReputeChain - Fair Academic Credit  ║
║   Every Contribution Visible & Verifiable   ║
╚══════════════════════════════════════════════╝
```

## 🔗 References

- [Ethereum Whitepaper](https://ethereum.org/en/whitepaper/)
- [ORCID API Documentation](https://info.orcid.org/documentation/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)

---

**Note**: This is a prototype implementation. For production use, conduct thorough security audits and testing.
