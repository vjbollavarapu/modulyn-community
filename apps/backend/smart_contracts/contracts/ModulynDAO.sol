// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./ModulynToken.sol";

/**
 * @title ModulynDAO
 * @dev Decentralized Autonomous Organization for Modulyn ERP governance
 * @notice This contract handles community governance, treasury management, and proposal execution
 */
contract ModulynDAO is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // ==================== CUSTOM ERRORS ====================
    
    error NotTheProposer();
    error InvalidProposalId();
    error ProposalDoesNotExist();
    error InsufficientVotingPowerToPropose();
    error VotingNotStarted();
    error VotingEnded();
    error InvalidProposalStatus();
    error InvalidVoteValue();
    error AlreadyVoted();
    error NoVotingPower();
    error VotingNotEnded();
    error ProposalNotActive();
    error ProposalAlreadyExecuted();
    error ProposalIsCancelled();
    error QuorumNotMet();
    error ProposalNotPassed();
    error VotingAlreadyStarted();
    error ProposalAlreadyCancelled();
    error InvalidRecipient();
    error InvalidAmount();
    error TransactionAlreadyExecuted();
    error InsufficientETHBalance();
    error ETHTransferFailed();
    error InsufficientTokenBalance();
    error TokenTransferFailed();
    error IncorrectETHAmount();

    // ==================== STRUCTS ====================
    
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        bool executed;
        bool cancelled;
        bytes32 executionHash;
        ProposalType proposalType;
        ProposalStatus status;
    }

    struct Vote {
        bool hasVoted;
        uint8 support; // 0 = against, 1 = for, 2 = abstain
        uint256 votingPower;
    }

    struct TreasuryTransaction {
        uint256 id;
        address to;
        uint256 amount;
        address token;
        string description;
        bool executed;
        uint256 proposalId;
        uint256 timestamp;
    }

    // ==================== ENUMS ====================
    
    enum ProposalType {
        Treasury,      // Treasury spending proposal
        Parameter,     // Parameter change proposal
        Upgrade,       // Contract upgrade proposal
        Community,     // Community initiative proposal
        Emergency      // Emergency proposal
    }

    enum ProposalStatus {
        Pending,       // Proposal created, waiting for voting to start
        Active,        // Voting is active
        Succeeded,     // Proposal passed
        Defeated,      // Proposal failed
        Executed,      // Proposal executed
        Cancelled      // Proposal cancelled
    }

    // ==================== STATE VARIABLES ====================
    
    ModulynToken public immutable token;
    
    uint256 public constant VOTING_DELAY = 1 days;        // 1 day delay before voting starts
    uint256 public constant VOTING_PERIOD = 3 days;       // 3 days voting period
    uint256 public constant PROPOSAL_THRESHOLD = 1000 * 10**18; // 1000 MOD minimum to propose
    uint256 public constant QUORUM_THRESHOLD = 10000 * 10**18;  // 10000 MOD quorum requirement
    
    uint256 public nextProposalId = 1;
    uint256 public nextTreasuryTransactionId = 1;
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(uint256 => TreasuryTransaction) public treasuryTransactions;
    
    // Treasury
    mapping(address => uint256) public treasuryBalances; // token => balance
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        ProposalType proposalType,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,
        uint256 votingPower,
        string reason
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    
    event TreasuryTransactionCreated(
        uint256 indexed transactionId,
        uint256 indexed proposalId,
        address indexed to,
        uint256 amount,
        address token
    );
    
    event TreasuryTransactionExecuted(uint256 indexed transactionId);
    
    // ==================== MODIFIERS ====================
    
    modifier onlyProposer(uint256 proposalId) {
        if (proposals[proposalId].proposer != msg.sender) revert NotTheProposer();
        _;
    }
    
    modifier validProposal(uint256 proposalId) {
        if (proposalId == 0 || proposalId >= nextProposalId) revert InvalidProposalId();
        _;
    }
    
    modifier proposalExists(uint256 proposalId) {
        if (proposals[proposalId].id == 0) revert ProposalDoesNotExist();
        _;
    }

    // ==================== CONSTRUCTOR ====================
    
    constructor(address _token) Ownable() {
        token = ModulynToken(_token);
    }

    // ==================== PROPOSAL FUNCTIONS ====================
    
    /**
     * @dev Create a new proposal
     * @param title Proposal title
     * @param description Proposal description
     * @param proposalType Type of proposal
     * @param executionHash Hash of execution data
     */
    function propose(
        string calldata title,
        string calldata description,
        ProposalType proposalType,
        bytes32 executionHash
    ) external returns (uint256) {
        if (token.balanceOf(msg.sender) < PROPOSAL_THRESHOLD) revert InsufficientVotingPowerToPropose();
        
        uint256 proposalId = nextProposalId++;
        uint256 startTime = block.timestamp + VOTING_DELAY;
        uint256 endTime = startTime + VOTING_PERIOD;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            startTime: startTime,
            endTime: endTime,
            votesFor: 0,
            votesAgainst: 0,
            votesAbstain: 0,
            executed: false,
            cancelled: false,
            executionHash: executionHash,
            proposalType: proposalType,
            status: ProposalStatus.Pending
        });
        
        emit ProposalCreated(proposalId, msg.sender, title, proposalType, startTime, endTime);
        
        return proposalId;
    }
    
    /**
     * @dev Cast a vote on a proposal
     * @param proposalId Proposal ID to vote on
     * @param support 0 = against, 1 = for, 2 = abstain
     * @param reason Reason for the vote
     */
    function castVote(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) external validProposal(proposalId) proposalExists(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        uint256 _startTime = proposal.startTime; // Cache storage read
        uint256 _endTime = proposal.endTime; // Cache storage read
        ProposalStatus _status = proposal.status; // Cache storage read
        
        if (block.timestamp < _startTime) revert VotingNotStarted();
        if (block.timestamp > _endTime) revert VotingEnded();
        if (_status != ProposalStatus.Pending && _status != ProposalStatus.Active) revert InvalidProposalStatus();
        if (support > 2) revert InvalidVoteValue();
        if (votes[proposalId][msg.sender].hasVoted) revert AlreadyVoted();
        
        uint256 votingPower = token.getVotes(msg.sender);
        if (votingPower == 0) revert NoVotingPower();
        
        // Update proposal status to active if it's the first vote
        if (_status == ProposalStatus.Pending) {
            proposal.status = ProposalStatus.Active;
        }
        
        // Record the vote
        votes[proposalId][msg.sender] = Vote({
            hasVoted: true,
            support: support,
            votingPower: votingPower
        });
        
        // Update proposal vote counts
        if (support == 0) {
            proposal.votesAgainst += votingPower;
        } else if (support == 1) {
            proposal.votesFor += votingPower;
        } else if (support == 2) {
            proposal.votesAbstain += votingPower;
        }
        
        emit VoteCast(proposalId, msg.sender, support, votingPower, reason);
    }
    
    /**
     * @dev Execute a proposal
     * @param proposalId Proposal ID to execute
     */
    function executeProposal(uint256 proposalId) 
        external 
        validProposal(proposalId) 
        proposalExists(proposalId) 
        nonReentrant 
    {
        Proposal storage proposal = proposals[proposalId];
        uint256 _endTime = proposal.endTime; // Cache storage read
        ProposalStatus _status = proposal.status; // Cache storage read
        bool _executed = proposal.executed; // Cache storage read
        bool _cancelled = proposal.cancelled; // Cache storage read
        uint256 _votesFor = proposal.votesFor; // Cache storage read
        uint256 _votesAgainst = proposal.votesAgainst; // Cache storage read
        
        if (block.timestamp <= _endTime) revert VotingNotEnded();
        if (_status != ProposalStatus.Active) revert ProposalNotActive();
        if (_executed) revert ProposalAlreadyExecuted();
        if (_cancelled) revert ProposalIsCancelled();
        
        // Check if proposal passed
        uint256 totalVotes = _votesFor + proposal.votesAbstain + _votesAgainst;
        if (totalVotes < QUORUM_THRESHOLD) revert QuorumNotMet();
        if (_votesFor <= _votesAgainst) revert ProposalNotPassed();
        
        proposal.status = ProposalStatus.Succeeded;
        proposal.executed = true;
        
        // Execute proposal based on type
        if (proposal.proposalType == ProposalType.Treasury) {
            _executeTreasuryProposal(proposalId);
        }
        // Add other proposal type executions here
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Cancel a proposal (only proposer can cancel before voting starts)
     * @param proposalId Proposal ID to cancel
     */
    function cancelProposal(uint256 proposalId) 
        external 
        validProposal(proposalId) 
        proposalExists(proposalId) 
        onlyProposer(proposalId) 
    {
        Proposal storage proposal = proposals[proposalId];
        if (block.timestamp >= proposal.startTime) revert VotingAlreadyStarted();
        if (proposal.cancelled) revert ProposalAlreadyCancelled();
        
        proposal.status = ProposalStatus.Cancelled;
        proposal.cancelled = true;
        
        emit ProposalCancelled(proposalId);
    }

    // ==================== TREASURY FUNCTIONS ====================
    
    /**
     * @dev Create a treasury transaction proposal
     * @param to Recipient address
     * @param amount Amount to transfer
     * @param tokenAddress Token address (address(0) for ETH)
     * @param description Transaction description
     */
    function createTreasuryTransaction(
        address to,
        uint256 amount,
        address tokenAddress,
        string calldata description
    ) external returns (uint256) {
        if (to == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        
        // Create proposal
        bytes32 executionHash = keccak256(abi.encodePacked(
            "TREASURY_TRANSACTION",
            to,
            amount,
            tokenAddress,
            block.timestamp
        ));
        
        // Create proposal directly (inline the propose logic)
        if (token.balanceOf(msg.sender) < PROPOSAL_THRESHOLD) revert InsufficientVotingPowerToPropose();
        
        uint256 proposalId = nextProposalId++;
        uint256 startTime = block.timestamp + VOTING_DELAY;
        uint256 endTime = startTime + VOTING_PERIOD;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: "Treasury Transaction",
            description: description,
            startTime: startTime,
            endTime: endTime,
            votesFor: 0,
            votesAgainst: 0,
            votesAbstain: 0,
            executed: false,
            cancelled: false,
            executionHash: executionHash,
            proposalType: ProposalType.Treasury,
            status: ProposalStatus.Pending
        });
        
        emit ProposalCreated(proposalId, msg.sender, "Treasury Transaction", ProposalType.Treasury, startTime, endTime);
        
        // Create treasury transaction
        uint256 transactionId = nextTreasuryTransactionId++;
        treasuryTransactions[transactionId] = TreasuryTransaction({
            id: transactionId,
            to: to,
            amount: amount,
            token: tokenAddress,
            description: description,
            executed: false,
            proposalId: proposalId,
            timestamp: block.timestamp
        });
        
        emit TreasuryTransactionCreated(transactionId, proposalId, to, amount, tokenAddress);
        
        return proposalId;
    }
    
    /**
     * @dev Execute treasury transaction
     * @param transactionId Transaction ID to execute
     */
    function _executeTreasuryProposal(uint256 transactionId) internal {
        TreasuryTransaction storage transaction = treasuryTransactions[transactionId];
        if (transaction.executed) revert TransactionAlreadyExecuted();
        
        if (transaction.token == address(0)) {
            // ETH transfer
            if (address(this).balance < transaction.amount) revert InsufficientETHBalance();
            (bool success, ) = transaction.to.call{value: transaction.amount}("");
            if (!success) revert ETHTransferFailed();
        } else {
            // ERC20 transfer
            IERC20 token = IERC20(transaction.token);
            if (token.balanceOf(address(this)) < transaction.amount) revert InsufficientTokenBalance();
            if (!token.transfer(transaction.to, transaction.amount)) revert TokenTransferFailed();
        }
        
        transaction.executed = true;
        emit TreasuryTransactionExecuted(transactionId);
    }
    
    /**
     * @dev Deposit tokens to treasury
     * @param tokenAddress Token address (address(0) for ETH)
     * @param amount Amount to deposit
     */
    function depositToTreasury(address tokenAddress, uint256 amount) external payable {
        if (tokenAddress == address(0)) {
            if (msg.value != amount) revert IncorrectETHAmount();
            treasuryBalances[address(0)] += amount;
        } else {
            IERC20 token = IERC20(tokenAddress);
            if (!token.transferFrom(msg.sender, address(this), amount)) revert TokenTransferFailed();
            treasuryBalances[tokenAddress] += amount;
        }
    }

    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Get proposal details
     * @param proposalId Proposal ID
     * @return Proposal struct
     */
    function getProposal(uint256 proposalId) external view validProposal(proposalId) returns (Proposal memory) {
        return proposals[proposalId];
    }
    
    /**
     * @dev Get vote details for a proposal
     * @param proposalId Proposal ID
     * @param voter Voter address
     * @return Vote struct
     */
    function getVote(uint256 proposalId, address voter) external view returns (Vote memory) {
        return votes[proposalId][voter];
    }
    
    /**
     * @dev Get treasury transaction details
     * @param transactionId Transaction ID
     * @return TreasuryTransaction struct
     */
    function getTreasuryTransaction(uint256 transactionId) external view returns (TreasuryTransaction memory) {
        return treasuryTransactions[transactionId];
    }
    
    /**
     * @dev Get treasury balance for a token
     * @param tokenAddress Token address (address(0) for ETH)
     * @return balance Treasury balance
     */
    function getTreasuryBalance(address tokenAddress) external view returns (uint256 balance) {
        if (tokenAddress == address(0)) {
            return address(this).balance;
        } else {
            IERC20 token = IERC20(tokenAddress);
            return token.balanceOf(address(this));
        }
    }
    
    /**
     * @dev Get DAO statistics
     * @return totalProposals Total number of proposals
     * @return activeProposals Number of active proposals
     * @return executedProposals Number of executed proposals
     * @return totalTreasuryTransactions Total number of treasury transactions
     */
    function getDAOStats() external view returns (
        uint256 totalProposals,
        uint256 activeProposals,
        uint256 executedProposals,
        uint256 totalTreasuryTransactions
    ) {
        uint256 _nextProposalId = nextProposalId; // Cache storage read
        totalProposals = _nextProposalId - 1;
        totalTreasuryTransactions = nextTreasuryTransactionId - 1;
        
        // Optimize loop with unchecked increment and cached storage reads
        for (uint256 i = 1; i < _nextProposalId;) {
            Proposal storage proposal = proposals[i]; // Cache storage read
            if (proposal.status == ProposalStatus.Active) {
                activeProposals++;
            } else if (proposal.executed) {
                executedProposals++;
            }
            unchecked {
                i++;
            }
        }
    }
    
    /**
     * @dev Check if a proposal can be executed
     * @param proposalId Proposal ID
     * @return canExecute Whether proposal can be executed
     */
    function canExecuteProposal(uint256 proposalId) external view returns (bool canExecute) {
        Proposal memory proposal = proposals[proposalId];
        
        if (proposal.id == 0 || proposal.executed || proposal.cancelled) {
            return false;
        }
        
        if (block.timestamp <= proposal.endTime) {
            return false;
        }
        
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
        if (totalVotes < QUORUM_THRESHOLD) {
            return false;
        }
        
        return proposal.votesFor > proposal.votesAgainst;
    }

    // ==================== RECEIVE FUNCTION ====================
    
    receive() external payable {
        treasuryBalances[address(0)] += msg.value;
    }
}
