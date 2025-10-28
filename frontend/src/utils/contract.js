import { ethers } from 'ethers';
import ContractAddress, { REPUTE_LEDGER_ABI } from '../config';

/**
 * Get reputation stats for a researcher
 */
export async function getReputationStats(provider, address) {
  try {
    const contract = new ethers.Contract(ContractAddress, REPUTE_LEDGER_ABI, provider);
    
    const profile = await contract.getResearcherProfile(address);
    
    if (!profile.isRegistered) {
      return null;
    }

    // Get contributions
    const contributionIds = await contract.getResearcherContributionIds(address);
    const contributions = [];
    
    for (const id of contributionIds) {
      const contribution = await contract.getContribution(id);
      contributions.push({
        id: id.toString(),
        contributionType: contribution.contributionType,
        timestamp: contribution.timestamp.toString(),
        tokenAmount: contribution.tokenAmount.toString(),
        verified: contribution.verified
      });
    }

    return {
      totalTokens: profile.totalTokens.toString(),
      contributionCount: profile.contributionCount.toString(),
      lastUpdate: profile.lastUpdate.toString(),
      verifiedInstitutions: profile.verifiedInstitutions,
      isRegistered: profile.isRegistered,
      contributions: contributions
    };
  } catch (error) {
    console.error('Error getting reputation stats:', error);
    throw error;
  }
}

/**
 * Register a new researcher
 */
export async function registerResearcher(signer, orcid) {
  try {
    const contract = new ethers.Contract(ContractAddress, REPUTE_LEDGER_ABI, signer);
    const tx = await contract.registerResearcher(orcid);
    return tx;
  } catch (error) {
    console.error('Error registering researcher:', error);
    throw error;
  }
}

/**
 * Record a contribution
 */
export async function recordContribution(signer, researcher, contributionType, metadata, validator) {
  try {
    const contract = new ethers.Contract(ContractAddress, REPUTE_LEDGER_ABI, signer);
    const tx = await contract.recordContribution(researcher, contributionType, metadata, validator);
    return tx;
  } catch (error) {
    console.error('Error recording contribution:', error);
    throw error;
  }
}

/**
 * Get contribution type name
 */
export function getContributionTypeName(type) {
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

