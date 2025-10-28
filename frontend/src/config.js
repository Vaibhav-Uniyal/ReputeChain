// Contract Address Configuration
// Update this after deploying the contract

// Default to Hardhat local network address
// Replace with your deployed contract address
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// ABI - This will be generated from the compiled contract
// For now, using key function signatures
const REPUTE_LEDGER_ABI = [
  "function registerResearcher(string calldata orcid) external",
  "function recordContribution(address researcher, uint8 contributionType, string calldata metadata, address validator) external returns (uint256)",
  "function getResearcherTokens(address researcher) external view returns (uint256)",
  "function getResearcherContributionCount(address researcher) external view returns (uint256)",
  "function getResearcherContributionIds(address researcher) external view returns (uint256[])",
  "function getContribution(uint256 contributionId) external view returns (tuple(address contributor, uint8 contributionType, uint256 timestamp, string metadata, address validator, uint256 tokenAmount, bool verified))",
  "function getResearcherProfile(address researcher) external view returns (tuple(uint256 totalTokens, uint256 contributionCount, uint256 lastUpdate, address[] verifiedInstitutions, bool isRegistered))",
  "function authorizedValidators(address) external view returns (bool)",
  "event ContributionRecorded(uint256 indexed contributionId, address indexed contributor, uint8 contributionType, string metadata, uint256 timestamp, uint256 tokenAmount)"
];

export default CONTRACT_ADDRESS;
export { REPUTE_LEDGER_ABI };

