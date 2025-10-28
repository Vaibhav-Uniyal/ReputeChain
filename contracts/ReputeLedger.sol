// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReputeLedger
 * @notice A blockchain-based transparent researcher reputation ledger
 * 
 * ReputeChain transforms academic contributions into verifiable, tamper-proof records.
 * Features:
 * - Decentralized researcher identity (DID)
 * - Contribution tracking (publications, reviews, datasets, code)
 * - Non-tradable ReputeTokens for academic credibility
 * - Smart contract-based verification
 * - Immutable provenance layer
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputeLedger is ERC721, Ownable {
    
    // ==================== STRUCTS ====================
    
    /**
     * @notice Represents a research contribution event
     * @param contributor The researcher's blockchain address
     * @param contributionType Type of contribution (Publication, Review, Dataset, Code)
     * @param timestamp When the contribution was recorded
     * @param metadata Hash of verification data (DOI, GitHub commit, review ID)
     * @param validator The institution/publisher that validated this contribution
     * @param tokenAmount ReputeTokens awarded for this contribution
     */
    struct Contribution {
        address contributor;
        ContributionType contributionType;
        uint256 timestamp;
        string metadata; // Hash of verification data
        address validator; // Institution/publisher node
        uint256 tokenAmount;
        bool verified;
    }
    
    /**
     * @notice Represents a researcher's reputation profile
     * @param totalTokens Total ReputeTokens earned
     * @param contributionCount Number of contributions recorded
     * @param lastUpdate Timestamp of most recent contribution
     * @param verifiedInstitutions List of validators that have verified this researcher
     */
    struct ResearcherProfile {
        uint256 totalTokens;
        uint256 contributionCount;
        uint256 lastUpdate;
        address[] verifiedInstitutions;
        bool isRegistered;
    }
    
    // ==================== ENUMS ====================
    
    enum ContributionType {
        PUBLICATION,       // 0
        PEER_REVIEW,        // 1
        DATASET,           // 2
        CODE_CONTRIBUTION, // 3
        MENTORSHIP,        // 4
        GRANT_ACQUISITION  // 5
    }
    
    // ==================== STATE VARIABLES ====================
    
    // Global ID counter for contributions
    uint256 private _contributionCounter;
    
    // Mapping from contribution ID to Contribution struct
    mapping(uint256 => Contribution) public contributions;
    
    // Mapping from address to ResearcherProfile
    mapping(address => ResearcherProfile) public researchers;
    
    // Mapping from address to array of contribution IDs
    mapping(address => uint256[]) public researcherContributions;
    
    // Authorized validators (institutions, publishers)
    mapping(address => bool) public authorizedValidators;
    
    // Token reward mapping by contribution type
    mapping(ContributionType => uint256) public tokenRewards;
    
    // Mapping for ORCID to address
    mapping(string => address) public orcidToAddress;
    mapping(address => string) public addressToOrcid;
    
    // ==================== EVENTS ====================
    
    event ContributionRecorded(
        uint256 indexed contributionId,
        address indexed contributor,
        ContributionType contributionType,
        string metadata,
        uint256 timestamp,
        uint256 tokenAmount
    );
    
    event ReputeTokensAwarded(
        address indexed researcher,
        uint256 amount,
        uint256 totalTokens
    );
    
    event ResearcherRegistered(
        address indexed researcher,
        string orcid
    );
    
    event ValidatorAuthorized(
        address indexed validator,
        bool authorized
    );
    
    event ContributionVerified(
        uint256 indexed contributionId,
        address indexed validator
    );
    
    // ==================== MODIFIERS ====================
    
    modifier onlyValidator() {
        require(authorizedValidators[msg.sender], "Only authorized validators can perform this action");
        _;
    }
    
    modifier validContributionType(ContributionType _type) {
        require(uint256(_type) <= uint256(ContributionType.GRANT_ACQUISITION), "Invalid contribution type");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() ERC721("ReputeChain Ledger", "REPUTE") Ownable(msg.sender) {
        // Initialize token rewards by contribution type
        tokenRewards[ContributionType.PUBLICATION] = 100;
        tokenRewards[ContributionType.PEER_REVIEW] = 30;
        tokenRewards[ContributionType.DATASET] = 60;
        tokenRewards[ContributionType.CODE_CONTRIBUTION] = 40;
        tokenRewards[ContributionType.MENTORSHIP] = 50;
        tokenRewards[ContributionType.GRANT_ACQUISITION] = 150;
        
        // Authorize contract deployer as initial validator
        authorizedValidators[msg.sender] = true;
        
        emit ValidatorAuthorized(msg.sender, true);
    }
    
    // ==================== PUBLIC FUNCTIONS ====================
    
    /**
     * @notice Register a researcher with their ORCID identifier
     * @param orcid The researcher's ORCID ID
     */
    function registerResearcher(string calldata orcid) external {
        require(!researchers[msg.sender].isRegistered, "Researcher already registered");
        require(orcidToAddress[orcid] == address(0), "ORCID already linked");
        require(bytes(orcid).length > 0, "ORCID cannot be empty");
        
        researchers[msg.sender] = ResearcherProfile({
            totalTokens: 0,
            contributionCount: 0,
            lastUpdate: block.timestamp,
            verifiedInstitutions: new address[](0),
            isRegistered: true
        });
        
        orcidToAddress[orcid] = msg.sender;
        addressToOrcid[msg.sender] = orcid;
        
        emit ResearcherRegistered(msg.sender, orcid);
    }
    
    /**
     * @notice Record a contribution and award ReputeTokens
     * @param researcher The address of the contributing researcher
     * @param contributionType The type of contribution made
     * @param metadata Hash of verification data (DOI, GitHub commit, etc.)
     * @param validator The institution/publisher validating this contribution
     */
    function recordContribution(
        address researcher,
        ContributionType contributionType,
        string calldata metadata,
        address validator
    ) external onlyValidator validContributionType(contributionType) returns (uint256) {
        require(researchers[researcher].isRegistered, "Researcher not registered");
        require(authorizedValidators[validator], "Validator not authorized");
        require(bytes(metadata).length > 0, "Metadata cannot be empty");
        
        uint256 contributionId = _recordContributionInternal(researcher, contributionType, metadata, validator);
        
        return contributionId;
    }
    
    /**
     * @notice Internal function to record a contribution
     * @param researcher The address of the contributing researcher
     * @param contributionType The type of contribution made
     * @param metadata Hash of verification data
     * @param validator The validator address
     * @return The contribution ID
     */
    function _recordContributionInternal(
        address researcher,
        ContributionType contributionType,
        string memory metadata,
        address validator
    ) internal validContributionType(contributionType) returns (uint256) {
        uint256 contributionId = ++_contributionCounter;
        
        Contribution memory newContribution = Contribution({
            contributor: researcher,
            contributionType: contributionType,
            timestamp: block.timestamp,
            metadata: metadata,
            validator: validator,
            tokenAmount: tokenRewards[contributionType],
            verified: true
        });
        
        contributions[contributionId] = newContribution;
        researcherContributions[researcher].push(contributionId);
        
        // Update researcher profile
        researchers[researcher].totalTokens += newContribution.tokenAmount;
        researchers[researcher].contributionCount += 1;
        researchers[researcher].lastUpdate = block.timestamp;
        
        // Add validator to verified institutions if not already present
        if (!isInstitutionVerified(researcher, validator)) {
            researchers[researcher].verifiedInstitutions.push(validator);
        }
        
        emit ContributionRecorded(
            contributionId,
            researcher,
            contributionType,
            metadata,
            block.timestamp,
            newContribution.tokenAmount
        );
        
        emit ReputeTokensAwarded(
            researcher,
            newContribution.tokenAmount,
            researchers[researcher].totalTokens
        );
        
        emit ContributionVerified(contributionId, validator);
        
        return contributionId;
    }
    
    /**
     * @notice Batch record multiple contributions at once
     * @param researcherAddrs Array of researcher addresses
     * @param types Array of contribution types
     * @param metadatas Array of metadata hashes
     * @param validator The validator address
     */
    function recordContributionsBatch(
        address[] calldata researcherAddrs,
        ContributionType[] calldata types,
        string[] calldata metadatas,
        address validator
    ) external onlyValidator returns (uint256[] memory) {
        require(researcherAddrs.length == types.length && types.length == metadatas.length, "Array length mismatch");
        require(authorizedValidators[validator], "Validator not authorized");
        
        uint256[] memory contributionIds = new uint256[](researcherAddrs.length);
        
        for (uint256 i = 0; i < researcherAddrs.length; i++) {
            require(researchers[researcherAddrs[i]].isRegistered, "Researcher not registered");
            require(bytes(metadatas[i]).length > 0, "Metadata cannot be empty");
            
            // Call internal function to record contribution
            contributionIds[i] = _recordContributionInternal(researcherAddrs[i], types[i], metadatas[i], validator);
        }
        
        return contributionIds;
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @notice Get total ReputeTokens for a researcher
     * @param researcher The researcher's address
     * @return Total tokens earned
     */
    function getResearcherTokens(address researcher) external view returns (uint256) {
        return researchers[researcher].totalTokens;
    }
    
    /**
     * @notice Get contribution count for a researcher
     * @param researcher The researcher's address
     * @return Number of contributions
     */
    function getResearcherContributionCount(address researcher) external view returns (uint256) {
        return researchers[researcher].contributionCount;
    }
    
    /**
     * @notice Get all contribution IDs for a researcher
     * @param researcher The researcher's address
     * @return Array of contribution IDs
     */
    function getResearcherContributionIds(address researcher) external view returns (uint256[] memory) {
        return researcherContributions[researcher];
    }
    
    /**
     * @notice Get full contribution details
     * @param contributionId The contribution ID
     * @return Full Contribution struct
     */
    function getContribution(uint256 contributionId) external view returns (Contribution memory) {
        return contributions[contributionId];
    }
    
    /**
     * @notice Get researcher's reputation profile
     * @param researcher The researcher's address
     * @return Full ResearcherProfile struct
     */
    function getResearcherProfile(address researcher) external view returns (ResearcherProfile memory) {
        return researchers[researcher];
    }
    
    /**
     * @notice Get ORCID for an address
     * @param researcher The researcher's address
     * @return ORCID ID
     */
    function getOrcidForAddress(address researcher) external view returns (string memory) {
        return addressToOrcid[researcher];
    }
    
    /**
     * @notice Get address for an ORCID
     * @param orcid The ORCID ID
     * @return Researcher's address
     */
    function getAddressForOrcid(string calldata orcid) external view returns (address) {
        return orcidToAddress[orcid];
    }
    
    /**
     * @notice Get token reward for a contribution type
     * @param contributionType The type of contribution
     * @return Token reward amount
     */
    function getTokenReward(ContributionType contributionType) external view returns (uint256) {
        return tokenRewards[contributionType];
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @notice Authorize or revoke validator privileges
     * @param validator The validator address
     * @param authorized Whether to authorize or revoke
     */
    function setValidator(address validator, bool authorized) external onlyOwner {
        authorizedValidators[validator] = authorized;
        emit ValidatorAuthorized(validator, authorized);
    }
    
    /**
     * @notice Update token rewards for a contribution type
     * @param contributionType The contribution type
     * @param newReward The new token reward amount
     */
    function updateTokenReward(ContributionType contributionType, uint256 newReward) external onlyOwner validContributionType(contributionType) {
        require(newReward > 0, "Reward must be greater than 0");
        tokenRewards[contributionType] = newReward;
    }
    
    // ==================== INTERNAL FUNCTIONS ====================
    
    /**
     * @notice Check if an institution is already verified for a researcher
     * @param researcher The researcher's address
     * @param institution The institution address
     * @return Whether the institution is verified
     */
    function isInstitutionVerified(address researcher, address institution) internal view returns (bool) {
        address[] memory institutions = researchers[researcher].verifiedInstitutions;
        for (uint256 i = 0; i < institutions.length; i++) {
            if (institutions[i] == institution) {
                return true;
            }
        }
        return false;
    }
}
