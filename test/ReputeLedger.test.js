const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReputeLedger", function () {
  let reputeLedger;
  let deployer, validator, researcher;

  beforeEach(async function () {
    // Get signers
    [deployer, validator, researcher] = await ethers.getSigners();

    // Deploy contract
    const ReputeLedger = await ethers.getContractFactory("ReputeLedger");
    reputeLedger = await ReputeLedger.deploy();
    await reputeLedger.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await reputeLedger.owner()).to.equal(deployer.address);
    });

    it("Should have correct token rewards", async function () {
      expect(await reputeLedger.tokenRewards(0)).to.equal(100); // PUBLICATION
      expect(await reputeLedger.tokenRewards(1)).to.equal(30);  // PEER_REVIEW
      expect(await reputeLedger.tokenRewards(2)).to.equal(60);  // DATASET
    });

    it("Should authorize deployer as validator", async function () {
      expect(await reputeLedger.authorizedValidators(deployer.address)).to.be.true;
    });
  });

  describe("Researcher Registration", function () {
    it("Should register a researcher with ORCID", async function () {
      const orcid = "0000-0002-1825-0097";
      await expect(reputeLedger.connect(researcher).registerResearcher(orcid))
        .to.emit(reputeLedger, "ResearcherRegistered")
        .withArgs(researcher.address, orcid);

      expect(await reputeLedger.getOrcidForAddress(researcher.address)).to.equal(orcid);
      expect(await reputeLedger.getAddressForOrcid(orcid)).to.equal(researcher.address);
    });

    it("Should prevent duplicate registration", async function () {
      const orcid = "0000-0002-1825-0097";
      await reputeLedger.connect(researcher).registerResearcher(orcid);
      
      await expect(
        reputeLedger.connect(researcher).registerResearcher(orcid)
      ).to.be.revertedWith("Researcher already registered");
    });

    it("Should prevent duplicate ORCID", async function () {
      const orcid = "0000-0002-1825-0097";
      await reputeLedger.connect(researcher).registerResearcher(orcid);
      
      const [anotherResearcher] = await ethers.getSigners();
      await expect(
        reputeLedger.connect(anotherResearcher).registerResearcher(orcid)
      ).to.be.revertedWith("ORCID already linked");
    });
  });

  describe("Contribution Recording", function () {
    beforeEach(async function () {
      // Register researcher and validator
      await reputeLedger.connect(researcher).registerResearcher("0000-0002-1825-0097");
      await reputeLedger.setValidator(validator.address, true);
    });

    it("Should record a publication contribution", async function () {
      const metadata = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      
      await expect(
        reputeLedger.connect(validator).recordContribution(
          researcher.address,
          0, // PUBLICATION
          metadata,
          validator.address
        )
      )
        .to.emit(reputeLedger, "ContributionRecorded")
        .to.emit(reputeLedger, "ReputeTokensAwarded");

      expect(await reputeLedger.getResearcherTokens(researcher.address)).to.equal(100);
      expect(await reputeLedger.getResearcherContributionCount(researcher.address)).to.equal(1);
    });

    it("Should record a peer review contribution", async function () {
      const metadata = "QmYwAPJzv5CZsnAzt8pBzn5GtXyQZFBqEymXqEG3nW6GJ5";
      
      await reputeLedger.connect(validator).recordContribution(
        researcher.address,
        1, // PEER_REVIEW
        metadata,
        validator.address
      );

      expect(await reputeLedger.getResearcherTokens(researcher.address)).to.equal(30);
    });

    it("Should prevent non-validators from recording", async function () {
      const metadata = "test-metadata";
      
      await expect(
        reputeLedger.connect(researcher).recordContribution(
          researcher.address,
          0,
          metadata,
          researcher.address
        )
      ).to.be.revertedWith("Only authorized validators can perform this action");
    });

    it("Should require researcher to be registered", async function () {
      const [, unregisteredResearcher] = await ethers.getSigners();
      
      await expect(
        reputeLedger.connect(validator).recordContribution(
          unregisteredResearcher.address,
          0,
          "test-metadata",
          validator.address
        )
      ).to.be.revertedWith("Researcher not registered");
    });
  });

  describe("Validator Management", function () {
    it("Should authorize a validator", async function () {
      await expect(reputeLedger.setValidator(validator.address, true))
        .to.emit(reputeLedger, "ValidatorAuthorized")
        .withArgs(validator.address, true);

      expect(await reputeLedger.authorizedValidators(validator.address)).to.be.true;
    });

    it("Should revoke validator access", async function () {
      await reputeLedger.setValidator(validator.address, true);
      await reputeLedger.setValidator(validator.address, false);
      
      expect(await reputeLedger.authorizedValidators(validator.address)).to.be.false;
    });

    it("Should only allow owner to manage validators", async function () {
      await expect(
        reputeLedger.connect(validator).setValidator(validator.address, true)
      ).to.be.reverted;
    });
  });

  describe("Token Rewards", function () {
    it("Should award correct tokens for different contribution types", async function () {
      await reputeLedger.connect(researcher).registerResearcher("0000-0002-1825-0097");
      await reputeLedger.setValidator(validator.address, true);

      // Publication: 100 tokens
      await reputeLedger.connect(validator).recordContribution(
        researcher.address, 0, "test", validator.address
      );
      expect(await reputeLedger.getResearcherTokens(researcher.address)).to.equal(100);

      // Dataset: 60 tokens (cumulative: 160)
      await reputeLedger.connect(validator).recordContribution(
        researcher.address, 2, "test", validator.address
      );
      expect(await reputeLedger.getResearcherTokens(researcher.address)).to.equal(160);
    });

    it("Should allow owner to update token rewards", async function () {
      await expect(reputeLedger.updateTokenReward(0, 150))
        .to.not.be.reverted;

      expect(await reputeLedger.tokenRewards(0)).to.equal(150);
    });
  });

  describe("Contribution Retrieval", function () {
    beforeEach(async function () {
      await reputeLedger.connect(researcher).registerResearcher("0000-0002-1825-0097");
      await reputeLedger.setValidator(validator.address, true);
    });

    it("Should retrieve contribution IDs for a researcher", async function () {
      await reputeLedger.connect(validator).recordContribution(
        researcher.address, 0, "metadata1", validator.address
      );
      await reputeLedger.connect(validator).recordContribution(
        researcher.address, 1, "metadata2", validator.address
      );

      const contributionIds = await reputeLedger.getResearcherContributionIds(researcher.address);
      expect(contributionIds.length).to.equal(2);
    });

    it("Should retrieve contribution details", async function () {
      await reputeLedger.connect(validator).recordContribution(
        researcher.address, 0, "test-metadata", validator.address
      );

      const contributionIds = await reputeLedger.getResearcherContributionIds(researcher.address);
      const contribution = await reputeLedger.getContribution(contributionIds[0]);

      expect(contribution.contributor).to.equal(researcher.address);
      expect(contribution.tokenAmount).to.equal(100);
      expect(contribution.verified).to.be.true;
    });
  });
});
