// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
 * @title ModulynToken
 * @dev ERC20 token for Modulyn ERP ecosystem with governance capabilities
 * @notice This token is used for governance, rewards, and payments within the Modulyn ecosystem
 */
contract ModulynToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard, ERC20Votes {
    
    // ==================== CUSTOM ERRORS ====================
    
    error InvalidBeneficiary();
    error InvalidAmount();
    error InvalidDuration();
    error VestingAlreadySetUp();
    error NoTokensToClaim();
    error StakeDurationTooShort();
    error StakeDurationTooLong();
    error InsufficientBalance();
    error InvalidStakeIndex();
    error StakeNotMature();
    error ArraysLengthMismatch();
    error InvalidRecipient();
    error RateTooHigh();
    error ExceedsMaxSupply();
    
    // ==================== STATE VARIABLES ====================
    
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100 million tokens
    
    // Token distribution
    uint256 public constant TEAM_ALLOCATION = 20_000_000 * 10**18; // 20%
    uint256 public constant COMMUNITY_ALLOCATION = 30_000_000 * 10**18; // 30%
    uint256 public constant TREASURY_ALLOCATION = 25_000_000 * 10**18; // 25%
    uint256 public constant REWARDS_ALLOCATION = 25_000_000 * 10**18; // 25%
    
    // Vesting
    mapping(address => uint256) public vestingAmount;
    mapping(address => uint256) public vestingStart;
    mapping(address => uint256) public vestingDuration;
    mapping(address => uint256) public vestingClaimed;
    
    // Staking
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 duration;
        uint256 rewards;
    }
    
    mapping(address => Stake[]) public stakes;
    uint256 public stakingRewardRate = 10; // 10% APY
    uint256 public constant MIN_STAKE_DURATION = 30 days;
    uint256 public constant MAX_STAKE_DURATION = 365 days;
    
    // Events
    event TokensVested(address indexed beneficiary, uint256 amount, uint256 duration);
    event VestingClaimed(address indexed beneficiary, uint256 amount);
    event TokensStaked(address indexed staker, uint256 amount, uint256 duration);
    event StakeUnlocked(address indexed staker, uint256 stakeIndex, uint256 amount, uint256 rewards);
    event RewardsDistributed(address indexed recipient, uint256 amount, string reason);
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() ERC20("Modulyn Token", "MOD") ERC20Permit("Modulyn Token") Ownable() {
        // Mint initial supply
        _mint(msg.sender, INITIAL_SUPPLY);
        
        // Set up initial vesting for team
        _setupVesting(msg.sender, TEAM_ALLOCATION, 2 * 365 days); // 2 year vesting
    }
    
    // ==================== VESTING FUNCTIONS ====================
    
    /**
     * @dev Set up vesting for an address
     * @param beneficiary Address to vest tokens to
     * @param amount Amount of tokens to vest
     * @param duration Vesting duration in seconds
     */
    function setupVesting(address beneficiary, uint256 amount, uint256 duration) external onlyOwner {
        if (beneficiary == address(0)) revert InvalidBeneficiary();
        if (amount == 0) revert InvalidAmount();
        if (duration == 0) revert InvalidDuration();
        if (vestingAmount[beneficiary] != 0) revert VestingAlreadySetUp();
        
        _setupVesting(beneficiary, amount, duration);
    }
    
    function _setupVesting(address beneficiary, uint256 amount, uint256 duration) internal {
        vestingAmount[beneficiary] = amount;
        vestingStart[beneficiary] = block.timestamp;
        vestingDuration[beneficiary] = duration;
        vestingClaimed[beneficiary] = 0;
        
        emit TokensVested(beneficiary, amount, duration);
    }
    
    /**
     * @dev Claim vested tokens
     */
    function claimVested() external nonReentrant {
        uint256 claimable = getClaimableAmount(msg.sender);
        if (claimable == 0) revert NoTokensToClaim();
        
        vestingClaimed[msg.sender] += claimable;
        _transfer(owner(), msg.sender, claimable);
        
        emit VestingClaimed(msg.sender, claimable);
    }
    
    /**
     * @dev Get claimable amount for an address
     * @param beneficiary Address to check
     * @return claimable Amount of tokens that can be claimed
     */
    function getClaimableAmount(address beneficiary) public view returns (uint256 claimable) {
        if (vestingAmount[beneficiary] == 0) return 0;
        
        uint256 elapsed = block.timestamp - vestingStart[beneficiary];
        if (elapsed >= vestingDuration[beneficiary]) {
            claimable = vestingAmount[beneficiary] - vestingClaimed[beneficiary];
        } else {
            uint256 totalVested = (vestingAmount[beneficiary] * elapsed) / vestingDuration[beneficiary];
            claimable = totalVested - vestingClaimed[beneficiary];
        }
    }

    // ==================== STAKING FUNCTIONS ====================
    
    /**
     * @dev Stake tokens for rewards
     * @param amount Amount of tokens to stake
     * @param duration Staking duration in seconds
     */
    function stake(uint256 amount, uint256 duration) external nonReentrant {
        if (amount == 0) revert InvalidAmount();
        if (duration < MIN_STAKE_DURATION) revert StakeDurationTooShort();
        if (duration > MAX_STAKE_DURATION) revert StakeDurationTooLong();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Calculate rewards
        uint256 rewards = (amount * stakingRewardRate * duration) / (100 * 365 days);
        
        // Create stake
        stakes[msg.sender].push(Stake({
            amount: amount,
            startTime: block.timestamp,
            duration: duration,
            rewards: rewards
        }));
        
        emit TokensStaked(msg.sender, amount, duration);
    }
    
    /**
     * @dev Unlock a stake
     * @param stakeIndex Index of the stake to unlock
     */
    function unlockStake(uint256 stakeIndex) external nonReentrant {
        if (stakeIndex >= stakes[msg.sender].length) revert InvalidStakeIndex();
        
        Stake storage stakeInfo = stakes[msg.sender][stakeIndex];
        if (block.timestamp < stakeInfo.startTime + stakeInfo.duration) revert StakeNotMature();
        
        uint256 stakeAmount = stakeInfo.amount;
        uint256 stakeRewards = stakeInfo.rewards;
        
        // Remove stake
        stakes[msg.sender][stakeIndex] = stakes[msg.sender][stakes[msg.sender].length - 1];
        stakes[msg.sender].pop();
        
        // Transfer staked tokens back
        _transfer(address(this), msg.sender, stakeAmount);
        
        // Mint rewards
        if (stakeRewards > 0) {
            _mint(msg.sender, stakeRewards);
        }
        
        emit StakeUnlocked(msg.sender, stakeIndex, stakeAmount, stakeRewards);
    }
    
    /**
     * @dev Get user's stakes
     * @param staker Address of the staker
     * @return userStakes Array of stakes
     */
    function getUserStakes(address staker) external view returns (Stake[] memory userStakes) {
        return stakes[staker];
    }

    // ==================== REWARD DISTRIBUTION ====================
    
    /**
     * @dev Distribute rewards to community members
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to distribute
     * @param reason Reason for distribution
     */
    function distributeRewards(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string calldata reason
    ) external onlyOwner {
        uint256 length = recipients.length; // Cache array length
        if (length != amounts.length) revert ArraysLengthMismatch();
        
        for (uint256 i = 0; i < length;) {
            address recipient = recipients[i]; // Cache calldata read
            uint256 amount = amounts[i]; // Cache calldata read
            if (recipient == address(0)) revert InvalidRecipient();
            if (amount == 0) revert InvalidAmount();
            
            _mint(recipient, amount);
            emit RewardsDistributed(recipient, amount, reason);
            
            unchecked {
                i++;
            }
        }
    }
    
    /**
     * @dev Set staking reward rate
     * @param newRate New reward rate (percentage)
     */
    function setStakingRewardRate(uint256 newRate) external onlyOwner {
        if (newRate > 100) revert RateTooHigh();
        stakingRewardRate = newRate;
    }

    // ==================== OVERRIDES ====================
    
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }
    
    function _mint(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(account, amount);
    }
    
    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
    
    // Note: ERC20Votes includes nonces functionality
    // No override needed as it's provided by ERC20Votes
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        _mint(to, amount);
    }

    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Get token information
     * @return tokenName Token name
     * @return tokenSymbol Token symbol
     * @return tokenDecimals Token decimals
     * @return tokenTotalSupply Total supply
     * @return tokenMaxSupply Maximum supply
     */
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenTotalSupply,
        uint256 tokenMaxSupply
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            MAX_SUPPLY
        );
    }
    
    /**
     * @dev Get vesting information for an address
     * @param beneficiary Address to check
     * @return amount Total vesting amount
     * @return start Vesting start time
     * @return duration Vesting duration
     * @return claimed Amount already claimed
     * @return claimable Amount currently claimable
     */
    function getVestingInfo(address beneficiary) external view returns (
        uint256 amount,
        uint256 start,
        uint256 duration,
        uint256 claimed,
        uint256 claimable
    ) {
        return (
            vestingAmount[beneficiary],
            vestingStart[beneficiary],
            vestingDuration[beneficiary],
            vestingClaimed[beneficiary],
            getClaimableAmount(beneficiary)
        );
    }
}
