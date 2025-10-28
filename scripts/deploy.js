const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ReputeChain Ledger...\n");

  // Get signers
  const [deployer, validator1, validator2, researcher1, researcher2] = await hre.ethers.getSigners();

  console.log("📋 Deploying with account:", deployer.address);
  console.log("📋 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy the contract
  const ReputeLedger = await hre.ethers.getContractFactory("ReputeLedger");
  const reputeLedger = await ReputeLedger.deploy();

  await reputeLedger.waitForDeployment();
  const contractAddress = await reputeLedger.getAddress();

  console.log("✅ ReputeLedger deployed to:", contractAddress);
  console.log("🔗 Contract deployed at address:", contractAddress);

  // Authorize additional validators
  console.log("\n🔐 Authorizing validators...");
  await reputeLedger.setValidator(validator1.address, true);
  await reputeLedger.setValidator(validator2.address, true);
  console.log("✅ Authorized validators:", validator1.address, validator2.address);

  // Test registration
  console.log("\n👤 Registering test researchers...");
  const orcid1 = "0000-0002-1825-0097"; // Test ORCID
  const orcid2 = "0000-0003-0855-2010"; // Test ORCID
  
  await reputeLedger.connect(researcher1).registerResearcher(orcid1);
  await reputeLedger.connect(researcher2).registerResearcher(orcid2);
  console.log("✅ Registered researcher 1:", researcher1.address);
  console.log("✅ Registered researcher 2:", researcher2.address);

  // Test contribution recording
  console.log("\n📝 Recording test contributions...");
  
  // Record a publication contribution
  const contribution1 = await reputeLedger.connect(validator1).recordContribution(
    researcher1.address,
    0, // ContributionType.PUBLICATION
    "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", // IPFS hash or DOI
    validator1.address
  );
  await contribution1.wait();
  console.log("✅ Recorded publication contribution");

  // Record a peer review
  const contribution2 = await reputeLedger.connect(validator1).recordContribution(
    researcher2.address,
    1, // ContributionType.PEER_REVIEW
    "QmYwAPJzv5CZsnAzt8pBzn5GtXyQZFBqEymXqEG3nW6GJ5", // Review ID hash
    validator1.address
  );
  await contribution2.wait();
  console.log("✅ Recorded peer review contribution");

  // Get and display researcher stats
  console.log("\n📊 Researcher Statistics:");
  const tokens1 = await reputeLedger.getResearcherTokens(researcher1.address);
  const tokens2 = await reputeLedger.getResearcherTokens(researcher2.address);
  const count1 = await reputeLedger.getResearcherContributionCount(researcher1.address);
  const count2 = await reputeLedger.getResearcherContributionCount(researcher2.address);

  console.log(`\n👤 Researcher 1 (${researcher1.address}):`);
  console.log(`   - Total ReputeTokens: ${tokens1}`);
  console.log(`   - Contributions: ${count1}`);

  console.log(`\n👤 Researcher 2 (${researcher2.address}):`);
  console.log(`   - Total ReputeTokens: ${tokens2}`);
  console.log(`   - Contributions: ${count2}`);

  console.log("\n🎉 Deployment complete!");
  console.log("\n📌 Contract Address:", contractAddress);
  console.log("\n💡 Next steps:");
  console.log("   1. Save the contract address to .env file");
  console.log("   2. Run: npm run ingest");
  console.log("   3. Check Etherscan (if on testnet)\n");

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
