// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
/**
 * @title ModulynERP
 * @dev Main smart contract for Modulyn ERP Web3 integration
 * @notice This contract handles invoice escrow, payment automation, and data anchoring
 */
contract ModulynERP is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    
    // ==================== CUSTOM ERRORS ====================
    
    error InvalidClient();
    error InvalidVendor();
    error InvalidAmount();
    error InvalidDueDate();
    error InvoiceNotFound();
    error InvoiceNotSent();
    error InvoiceAlreadyPaid();
    error InvoiceAlreadySent();
    error OnlyClientCanPay();
    error NotAuthorizedForInvoice();
    error InsufficientBalance();
    error PaymentFailed();
    error InvalidProposalId();
    error ProposalNotActive();
    error AlreadyVoted();
    error ProposalNotExecutable();
    error InvalidDataHash();
    error DataNotAnchored();
    error InvalidVotingPower();
    error InvalidRecipient();
    error InvalidInvoiceId();
    error InvoiceNotReadyForPayment();
    error IncorrectETHAmount();
    error InsufficientContractBalance();
    error ETHTransferFailed();
    error TokenTransferFailed();
    error TokenTransferToVendorFailed();
    error OnlyVendorCanSend();
    error NoVotingPower();
    error InvalidVotingDuration();
    error VotingNotStarted();
    error VotingEnded();
    error VotingNotEnded();
    error ProposalNotPassed();
    error InsufficientVotingPower();
    error NoETHToWithdraw();
    error ETHWithdrawalFailed();
    error TokenWithdrawalFailed();
    error InvalidPaymentId();
    
    // ==================== STRUCTS ====================
    
    struct Invoice {
        uint256 invoiceId;
        address client;
        address vendor;
        uint256 amount;
        address tokenAddress; // ERC20 token address, address(0) for ETH
        string description;
        uint256 dueDate;
        InvoiceStatus status;
        uint256 createdAt;
        uint256 paidAt;
        bytes32 dataHash; // Hash of invoice data for anchoring
    }

    struct Payment {
        uint256 paymentId;
        uint256 invoiceId;
        address payer;
        address payee;
        uint256 amount;
        address tokenAddress;
        PaymentStatus status;
        uint256 createdAt;
        bytes32 transactionHash;
    }

    struct DataAnchor {
        bytes32 dataHash;
        string dataType; // "invoice", "payment", "contract", etc.
        uint256 timestamp;
        address anchorer;
        bool isVerified;
    }

    struct GovernanceProposal {
        uint256 proposalId;
        address proposer;
        string title;
        string description;
        uint256 votingPowerRequired;
        uint256 votingStart;
        uint256 votingEnd;
        uint256 votesFor;
        uint256 votesAgainst;
        ProposalStatus status;
        bytes32 executionHash;
    }

    // ==================== ENUMS ====================
    
    enum InvoiceStatus {
        Draft,
        Sent,
        Paid,
        Overdue,
        Cancelled
    }

    enum PaymentStatus {
        Pending,
        Processing,
        Completed,
        Failed,
        Refunded
    }

    enum ProposalStatus {
        Draft,
        Active,
        Passed,
        Rejected,
        Executed,
        Expired
    }

    // ==================== STATE VARIABLES ====================
    
    uint256 public nextInvoiceId = 1;
    uint256 public nextPaymentId = 1;
    uint256 public nextProposalId = 1;
    
    mapping(uint256 => Invoice) public invoices;
    mapping(uint256 => Payment) public payments;
    mapping(bytes32 => DataAnchor) public dataAnchors;
    mapping(uint256 => GovernanceProposal) public proposals;
    
    // Token balances for escrow
    mapping(address => mapping(address => uint256)) public escrowBalances; // token => user => balance
    
    // Governance
    mapping(address => uint256) public votingPower;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    // Events
    event InvoiceCreated(uint256 indexed invoiceId, address indexed client, address indexed vendor, uint256 amount);
    event InvoicePaid(uint256 indexed invoiceId, uint256 indexed paymentId, uint256 amount);
    event PaymentProcessed(uint256 indexed paymentId, address indexed payer, uint256 amount);
    event DataAnchored(bytes32 indexed dataHash, string dataType, address indexed anchorer);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 votingPower);
    event ProposalExecuted(uint256 indexed proposalId, bytes32 executionHash);
    
    // ==================== MODIFIERS ====================
    
    modifier onlyInvoiceParticipant(uint256 invoiceId) {
        Invoice storage invoice = invoices[invoiceId];
        if (msg.sender != invoice.client && msg.sender != invoice.vendor) {
            revert NotAuthorizedForInvoice();
        }
        _;
    }
    
    modifier validInvoice(uint256 invoiceId) {
        if (invoiceId == 0 || invoiceId >= nextInvoiceId) revert InvalidInvoiceId();
        _;
    }
    
    modifier validProposal(uint256 proposalId) {
        if (proposalId == 0 || proposalId >= nextProposalId) revert InvalidProposalId();
        _;
    }

    // ==================== CONSTRUCTOR ====================
    
    constructor() Ownable() {}

    // ==================== INVOICE MANAGEMENT ====================
    
    /**
     * @dev Create a new invoice
     * @param client Address of the client
     * @param amount Invoice amount
     * @param tokenAddress ERC20 token address (address(0) for ETH)
     * @param description Invoice description
     * @param dueDate Due date timestamp
     * @param dataHash Hash of invoice data for anchoring
     */
    function createInvoice(
        address client,
        uint256 amount,
        address tokenAddress,
        string calldata description,
        uint256 dueDate,
        bytes32 dataHash
    ) external returns (uint256) {
        if (client == address(0)) revert InvalidClient();
        if (amount == 0) revert InvalidAmount();
        if (dueDate <= block.timestamp) revert InvalidDueDate();
        
        uint256 invoiceId = nextInvoiceId++;
        
        invoices[invoiceId] = Invoice({
            invoiceId: invoiceId,
            client: client,
            vendor: msg.sender,
            amount: amount,
            tokenAddress: tokenAddress,
            description: description,
            dueDate: dueDate,
            status: InvoiceStatus.Draft,
            createdAt: block.timestamp,
            paidAt: 0,
            dataHash: dataHash
        });
        
        // Anchor invoice data
        _anchorData(dataHash, "invoice", msg.sender);
        
        emit InvoiceCreated(invoiceId, client, msg.sender, amount);
        
        return invoiceId;
    }
    
    /**
     * @dev Pay an invoice
     * @param invoiceId Invoice ID to pay
     */
    function payInvoice(uint256 invoiceId) 
        external 
        payable 
        nonReentrant 
        validInvoice(invoiceId) 
        onlyInvoiceParticipant(invoiceId) 
    {
        Invoice storage invoice = invoices[invoiceId];
        if (invoice.status != InvoiceStatus.Sent) revert InvoiceNotReadyForPayment();
        if (msg.sender != invoice.client) revert OnlyClientCanPay();
        
        uint256 paymentId = nextPaymentId++;
        
        if (invoice.tokenAddress == address(0)) {
            // ETH payment
            if (msg.value != invoice.amount) revert IncorrectETHAmount();
            if (address(this).balance < invoice.amount) revert InsufficientContractBalance();
            
            // Transfer ETH to vendor
            (bool success, ) = invoice.vendor.call{value: invoice.amount}("");
            if (!success) revert ETHTransferFailed();
        } else {
            // ERC20 payment
            IERC20 token = IERC20(invoice.tokenAddress);
            if (!token.transferFrom(msg.sender, address(this), invoice.amount)) revert TokenTransferFailed();
            if (!token.transfer(invoice.vendor, invoice.amount)) revert TokenTransferToVendorFailed();
        }
        
        // Update invoice status
        invoice.status = InvoiceStatus.Paid;
        invoice.paidAt = block.timestamp;
        
        // Create payment record
        payments[paymentId] = Payment({
            paymentId: paymentId,
            invoiceId: invoiceId,
            payer: msg.sender,
            payee: invoice.vendor,
            amount: invoice.amount,
            tokenAddress: invoice.tokenAddress,
            status: PaymentStatus.Completed,
            createdAt: block.timestamp,
            transactionHash: bytes32(0) // Will be set by frontend
        });
        
        // Anchor payment data
        bytes32 paymentHash = keccak256(abi.encodePacked(
            paymentId,
            invoiceId,
            msg.sender,
            invoice.vendor,
            invoice.amount,
            block.timestamp
        ));
        _anchorData(paymentHash, "payment", msg.sender);
        
        emit InvoicePaid(invoiceId, paymentId, invoice.amount);
        emit PaymentProcessed(paymentId, msg.sender, invoice.amount);
    }
    
    /**
     * @dev Send invoice to client
     * @param invoiceId Invoice ID to send
     */
    function sendInvoice(uint256 invoiceId) 
        external 
        validInvoice(invoiceId) 
        onlyInvoiceParticipant(invoiceId) 
    {
        Invoice storage invoice = invoices[invoiceId];
        if (invoice.status != InvoiceStatus.Draft) revert InvoiceAlreadySent();
        if (msg.sender != invoice.vendor) revert OnlyVendorCanSend();
        
        invoice.status = InvoiceStatus.Sent;
    }

    // ==================== DATA ANCHORING ====================
    
    /**
     * @dev Anchor data to blockchain
     * @param dataHash Hash of the data to anchor
     * @param dataType Type of data being anchored
     * @param anchorer Address of the person anchoring the data
     */
    function _anchorData(bytes32 dataHash, string memory dataType, address anchorer) internal {
        dataAnchors[dataHash] = DataAnchor({
            dataHash: dataHash,
            dataType: dataType,
            timestamp: block.timestamp,
            anchorer: anchorer,
            isVerified: true
        });
        
        emit DataAnchored(dataHash, dataType, anchorer);
    }
    
    /**
     * @dev Verify data integrity
     * @param dataHash Hash of the data to verify
     * @param data Original data
     * @return isValid Whether the data matches the hash
     */
    function verifyData(bytes32 dataHash, string calldata data) external pure returns (bool isValid) {
        bytes32 computedHash = keccak256(abi.encodePacked(data));
        return computedHash == dataHash;
    }

    // ==================== GOVERNANCE ====================
    
    /**
     * @dev Create a governance proposal
     * @param title Proposal title
     * @param description Proposal description
     * @param votingPowerRequired Minimum voting power required to pass
     * @param votingDuration Voting duration in seconds
     * @param executionHash Hash of execution data
     */
    function createProposal(
        string calldata title,
        string calldata description,
        uint256 votingPowerRequired,
        uint256 votingDuration,
        bytes32 executionHash
    ) external returns (uint256) {
        if (votingPower[msg.sender] == 0) revert NoVotingPower();
        if (votingDuration == 0) revert InvalidVotingDuration();
        
        uint256 proposalId = nextProposalId++;
        
        proposals[proposalId] = GovernanceProposal({
            proposalId: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            votingPowerRequired: votingPowerRequired,
            votingStart: block.timestamp,
            votingEnd: block.timestamp + votingDuration,
            votesFor: 0,
            votesAgainst: 0,
            status: ProposalStatus.Active,
            executionHash: executionHash
        });
        
        emit ProposalCreated(proposalId, msg.sender, title);
        
        return proposalId;
    }
    
    /**
     * @dev Cast a vote on a proposal
     * @param proposalId Proposal ID to vote on
     * @param support True for yes, false for no
     */
    function vote(uint256 proposalId, bool support) 
        external 
        validProposal(proposalId) 
    {
        GovernanceProposal storage proposal = proposals[proposalId];
        if (proposal.status != ProposalStatus.Active) revert ProposalNotActive();
        if (block.timestamp < proposal.votingStart) revert VotingNotStarted();
        if (block.timestamp > proposal.votingEnd) revert VotingEnded();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();
        if (votingPower[msg.sender] == 0) revert NoVotingPower();
        
        hasVoted[proposalId][msg.sender] = true;
        
        if (support) {
            proposal.votesFor += votingPower[msg.sender];
        } else {
            proposal.votesAgainst += votingPower[msg.sender];
        }
        
        emit VoteCast(proposalId, msg.sender, support, votingPower[msg.sender]);
    }
    
    /**
     * @dev Execute a passed proposal
     * @param proposalId Proposal ID to execute
     */
    function executeProposal(uint256 proposalId) 
        external 
        validProposal(proposalId) 
    {
        GovernanceProposal storage proposal = proposals[proposalId];
        if (proposal.status != ProposalStatus.Active) revert ProposalNotActive();
        if (block.timestamp <= proposal.votingEnd) revert VotingNotEnded();
        if (proposal.votesFor <= proposal.votesAgainst) revert ProposalNotPassed();
        if (proposal.votesFor < proposal.votingPowerRequired) revert InsufficientVotingPower();
        
        proposal.status = ProposalStatus.Executed;
        
        emit ProposalExecuted(proposalId, proposal.executionHash);
    }

    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @dev Set voting power for an address
     * @param account Address to set voting power for
     * @param power Voting power amount
     */
    function setVotingPower(address account, uint256 power) external onlyOwner {
        votingPower[account] = power;
    }
    
    /**
     * @dev Withdraw ETH from contract (emergency only)
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoETHToWithdraw();
        
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert ETHWithdrawalFailed();
    }
    
    /**
     * @dev Withdraw ERC20 tokens from contract (emergency only)
     * @param tokenAddress Token contract address
     * @param amount Amount to withdraw
     */
    function withdrawToken(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        if (!token.transfer(owner(), amount)) revert TokenWithdrawalFailed();
    }

    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Get invoice details
     * @param invoiceId Invoice ID
     * @return Invoice struct
     */
    function getInvoice(uint256 invoiceId) external view validInvoice(invoiceId) returns (Invoice memory) {
        return invoices[invoiceId];
    }
    
    /**
     * @dev Get payment details
     * @param paymentId Payment ID
     * @return Payment struct
     */
    function getPayment(uint256 paymentId) external view returns (Payment memory) {
        if (paymentId == 0 || paymentId >= nextPaymentId) revert InvalidPaymentId();
        return payments[paymentId];
    }
    
    /**
     * @dev Get proposal details
     * @param proposalId Proposal ID
     * @return GovernanceProposal struct
     */
    function getProposal(uint256 proposalId) external view validProposal(proposalId) returns (GovernanceProposal memory) {
        return proposals[proposalId];
    }
    
    /**
     * @dev Check if data is anchored
     * @param dataHash Data hash to check
     * @return isAnchored Whether data is anchored
     */
    function isDataAnchored(bytes32 dataHash) external view returns (bool isAnchored) {
        return dataAnchors[dataHash].isVerified;
    }
    
    /**
     * @dev Get contract statistics
     * @return totalInvoices Total number of invoices
     * @return totalPayments Total number of payments
     * @return totalProposals Total number of proposals
     * @return totalAnchors Total number of data anchors
     */
    function getStats() external view returns (
        uint256 totalInvoices,
        uint256 totalPayments,
        uint256 totalProposals,
        uint256 totalAnchors
    ) {
        return (
            nextInvoiceId - 1,
            nextPaymentId - 1,
            nextProposalId - 1,
            // Note: This is a simplified count, in production you'd track this properly
            nextInvoiceId + nextPaymentId - 2
        );
    }
}
