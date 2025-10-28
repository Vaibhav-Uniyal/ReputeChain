const axios = require('axios');
const hre = require('hardhat');

/**
 * ORCID Ingestor Script for ReputeChain
 * 
 * This script demonstrates fetching researcher works from ORCID
 * and recording them on the ReputeChain blockchain.
 * 
 * Usage: npm run ingest
 * 
 * Requirements:
 * - Contract deployed (run: npm run deploy)
 * - Validator account configured
 * - ORCID access token (optional, uses public API)
 */

// ORCID API configuration
const ORCID_BASE_URL = 'https://pub.orcid.org/v3.0';

// Contribution type mapping
const CONTRIBUTION_TYPES = {
  PUBLICATION: 0,
  PEER_REVIEW: 1,
  DATASET: 2,
  CODE_CONTRIBUTION: 3,
  MENTORSHIP: 4,
  GRANT_ACQUISITION: 5
};

/**
 * Fetch works from ORCID API
 * @param {string} orcid - ORCID identifier
 * @returns {Promise<Array>} Array of work records
 */
async function fetchOrcidWorks(orcid) {
  try {
    console.log(`\n🔍 Fetching works for ORCID: ${orcid}...`);
    
    const response = await axios.get(`${ORCID_BASE_URL}/${orcid}/works`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const works = response.data.group;
    console.log(`✅ Found ${works.length} work(s)`);
    
    return works.map(item => item['work-summary'][0]);
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`⚠️  No works found for ORCID: ${orcid}`);
      return [];
    }
    console.error(`❌ Error fetching ORCID data:`, error.message);
    return [];
  }
}

/**
 * Extract metadata from ORCID work
 * @param {Object} work - ORCID work object
 * @returns {Object} Extracted metadata
 */
function extractWorkMetadata(work) {
  const title = work.title?.title?.value || 'Unknown Title';
  const doi = work.externalIds?.externalId?.find(
    id => id['external-id-type'] === 'doi'
  );
  
  const metadata = {
    title: title,
    doi: doi ? doi['external-id-value'] : null,
    url: work.url?.value || null,
    type: work.type || 'unknown',
    year: work['publication-date']?.year?.value || null
  };

  return metadata;
}

/**
 * Generate a hash-like identifier for the work
 * @param {Object} work - ORCID work object
 * @returns {string} Hash identifier
 */
function generateWorkHash(work) {
  const title = work.title?.title?.value || '';
  const doi = work.externalIds?.externalId?.find(
    id => id['external-id-type'] === 'doi'
  );
  
  // Use DOI if available, otherwise create hash from title + orcid
  const identifier = doi 
    ? `doi:${doi['external-id-value']}`
    : `orcid-work:${title.replace(/\s+/g, '-').substring(0, 50)}`;
  
  return Buffer.from(identifier).toString('base64').substring(0, 46);
}

/**
 * Record contributions to the blockchain
 * @param {string} contractAddress - Deployed contract address
 * @param {string} researcherAddress - Researcher's blockchain address
 * @param {Array} works - ORCID works array
 */
async function recordContributionsToChain(contractAddress, researcherAddress, works) {
  const [validator] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt('ReputeLedger', contractAddress);

  console.log(`\n📝 Recording ${works.length} contribution(s) to blockchain...`);
  
  let recordedCount = 0;

  for (const work of works) {
    try {
      const metadata = extractWorkMetadata(work);
      const workHash = generateWorkHash(work);
      
      console.log(`\n  📄 Title: ${metadata.title}`);
      console.log(`     DOI: ${metadata.doi || 'N/A'}`);
      console.log(`     Hash: ${workHash}`);
      
      // Record as PUBLICATION type
      const tx = await contract.connect(validator).recordContribution(
        researcherAddress,
        CONTRIBUTION_TYPES.PUBLICATION,
        workHash,
        validator.address
      );
      
      const receipt = await tx.wait();
      recordedCount++;
      
      console.log(`  ✅ Recorded on-chain (Tx: ${receipt.hash})`);
      
    } catch (error) {
      console.error(`  ❌ Error recording work:`, error.message);
    }
  }

  console.log(`\n🎉 Successfully recorded ${recordedCount}/${works.length} contributions`);
}

/**
 * Main ingestion function
 */
async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   ReputeChain ORCID Ingestor');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Configuration
  const ORCID_ID = process.env.TEST_ORCID || '0000-0002-1825-0097'; // Default test ORCID
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
  const RESEARCHER_ADDRESS = process.env.RESEARCHER_ADDRESS;

  if (!CONTRACT_ADDRESS) {
    console.error('❌ Error: CONTRACT_ADDRESS not set in .env file');
    console.log('💡 Run: npm run deploy first to get the contract address');
    process.exit(1);
  }

  if (!RESEARCHER_ADDRESS) {
    console.error('❌ Error: RESEARCHER_ADDRESS not set in .env file');
    console.log('💡 Add the researcher blockchain address to .env file');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   ORCID: ${ORCID_ID}`);
  console.log(`   Contract: ${CONTRACT_ADDRESS}`);
  console.log(`   Researcher: ${RESEARCHER_ADDRESS}`);

  try {
    // Fetch works from ORCID
    const works = await fetchOrcidWorks(ORCID_ID);

    if (works.length === 0) {
      console.log('\n⚠️  No works to record');
      process.exit(0);
    }

    // Record to blockchain
    await recordContributionsToChain(CONTRACT_ADDRESS, RESEARCHER_ADDRESS, works);

    // Display final stats
    const contract = await hre.ethers.getContractAt('ReputeLedger', CONTRACT_ADDRESS);
    const finalTokens = await contract.getResearcherTokens(RESEARCHER_ADDRESS);
    const finalCount = await contract.getResearcherContributionCount(RESEARCHER_ADDRESS);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Final Reputation Stats:');
    console.log(`   Total ReputeTokens: ${finalTokens}`);
    console.log(`   Total Contributions: ${finalCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Ingestor error:', error);
    process.exit(1);
  }
}

// Run the ingestor
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { fetchOrcidWorks, recordContributionsToChain };
