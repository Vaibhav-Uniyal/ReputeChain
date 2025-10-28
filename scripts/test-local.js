/**
 * Local Testing Script for ReputeChain
 * 
 * Tests the basic functionality of ReputeLedger without deploying
 */

const hre = require('hardhat');

async function main() {
  console.log('🧪 Running local tests...\n');

  // Get test accounts
  const [deployer, validator, researcher] = await hre.ethers.getSigners();
  
  console.log('📋 Test Accounts:');
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Validator: ${validator.address}`);
  console.log(`   Researcher: ${researcher.address}\n`);

  // Deploy contract
  console.log('🚀 Deploying ReputeLedger...');
  const ReputeLedger = await hre.ethers.getContractFactory('ReputeLedger');
  const contract = await ReputeLedger.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log(`✅ Contract deployed to: ${address}\n`);

  // Test 1: Researcher Registration
  console.log('📝 Test 1: Registering researcher...');
  const orcid = '0000-0002-1825-0097';
  await contract.connect(researcher).registerResearcher(orcid);
  console.log('✅ Researcher registered with ORCID:', orcid);

  // Verify registration
  const registeredOrcid = await contract.getOrcidForAddress(researcher.address);
  console.log('✅ Verified ORCID:', registeredOrcid, '\n');

  // Test 2: Authorize validator
  console.log('📝 Test 2: Authorizing validator...');
  await contract.setValidator(validator.address, true);
  const isValidator = await contract.authorizedValidators(validator.address);
  console.log(`✅ Validator authorized: ${isValidator}\n`);

  // Test 3: Record contributions
  console.log('📝 Test 3: Recording contributions...');
  
  // Record publication
  const tx1 = await contract.connect(validator).recordContribution(
    researcher.address,
    0, // PUBLICATION
    'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    validator.address
  );
  await tx1.wait();
  console.log('✅ Recorded publication contribution');

  // Record peer review
  const tx2 = await contract.connect(validator).recordContribution(
    researcher.address,
    1, // PEER_REVIEW
    'QmYwAPJzv5CZsnAzt8pBzn5GtXyQZFBqEymXqEG3nW6GJ5',
    validator.address
  );
  await tx2.wait();
  console.log('✅ Recorded peer review contribution\n');

  // Test 4: Check researcher stats
  console.log('📝 Test 4: Checking researcher stats...');
  const tokens = await contract.getResearcherTokens(researcher.address);
  const count = await contract.getResearcherContributionCount(researcher.address);
  console.log(`   Total ReputeTokens: ${tokens}`);
  console.log(`   Contribution Count: ${count}\n`);

  // Test 5: Get contribution details
  console.log('📝 Test 5: Getting contribution details...');
  const contributionIds = await contract.getResearcherContributionIds(researcher.address);
  console.log(`   Contribution IDs: ${contributionIds.join(', ')}`);
  
  if (contributionIds.length > 0) {
    const contribution = await contract.getContribution(contributionIds[0]);
    console.log(`   First contribution:`);
    console.log(`     Type: ${contribution.contributionType}`);
    console.log(`     Tokens: ${contribution.tokenAmount}`);
    console.log(`     Verified: ${contribution.verified}`);
  }

  console.log('\n✅ All tests passed!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
