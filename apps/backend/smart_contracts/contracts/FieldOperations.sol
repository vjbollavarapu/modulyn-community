// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title FieldOperations
 * @dev Smart contract for managing field service operations, job dispatch, and payments
 * @author Modulyn ERP
 */
contract FieldOperations is ReentrancyGuard, Ownable {
    
    // ==================== CUSTOM ERRORS ====================
    
    error TeamNotRegisteredOrInactive();
    error ClientNotRegisteredOrInactive();
    error InvalidJobId();
    error JobNotAssigned();
    error NotAssignedToThisJob();
    error JobNotInProgress();
    error JobNotCompleted();
    error PaymentAlreadyReleased();
    error JobNotCancellable();
    error InvalidAmount();
    error InsufficientBalance();
    error TransferFailed();
    error InvalidRating();
    error InvalidFeePercentage();
    error InvalidWallet();
    error NoFundsToWithdraw();
    error WithdrawalFailed();
    error TeamAlreadyRegistered();
    error ClientAlreadyRegistered();
    error PaymentMustBeGreaterThanZero();
    error ScheduledTimeMustBeInFuture();
    error InsufficientTokenAllowance();
    error JobNotAvailableForAssignment();
    error TeamNotActive();
    error NotAuthorized();
    error RatingOutOfRange();
    error FeeExceedsMaximum();
    error InvalidWalletAddress();
    
    // Events
    event JobCreated(uint256 indexed jobId, address indexed client, uint256 amount);
    event JobAssigned(uint256 indexed jobId, address indexed team, uint256 timestamp);
    event JobStarted(uint256 indexed jobId, address indexed team, uint256 timestamp);
    event JobCompleted(uint256 indexed jobId, address indexed team, uint256 timestamp);
    event PaymentReleased(uint256 indexed jobId, address indexed team, uint256 amount);
    event TeamRegistered(address indexed team, string name, uint256 timestamp);
    event ClientRegistered(address indexed client, string name, uint256 timestamp);
    
    // Structs
    struct Job {
        uint256 jobId;
        address client;
        address team;
        string title;
        string description;
        string serviceAddress;
        uint256 scheduledTime;
        uint256 estimatedDuration;
        uint256 payment;
        JobStatus status;
        uint256 createdAt;
        uint256 completedAt;
        bool paymentReleased;
    }
    
    struct Team {
        address teamAddress;
        string name;
        string teamType;
        bool isActive;
        uint256 totalJobs;
        uint256 completedJobs;
        uint256 rating;
        uint256 registeredAt;
    }
    
    struct Client {
        address clientAddress;
        string name;
        string contactInfo;
        bool isActive;
        uint256 totalJobs;
        uint256 totalSpent;
        uint256 registeredAt;
    }
    
    // Enums
    enum JobStatus {
        Created,
        Assigned,
        InProgress,
        Completed,
        Cancelled
    }
    
    // State Variables
    uint256 public nextJobId = 1;
    uint256 public platformFeePercentage = 5; // 5% platform fee
    address public platformWallet;
    IERC20 public paymentToken; // ERC20 token for payments
    
    // Mappings
    mapping(uint256 => Job) public jobs;
    mapping(address => Team) public teams;
    mapping(address => Client) public clients;
    mapping(address => uint256[]) public clientJobs;
    mapping(address => uint256[]) public teamJobs;
    mapping(uint256 => string) public jobPhotos; // IPFS hashes for job photos
    
    // Modifiers
    modifier onlyRegisteredTeam() {
        if (!teams[msg.sender].isActive) revert TeamNotRegisteredOrInactive();
        _;
    }
    
    modifier onlyRegisteredClient() {
        if (!clients[msg.sender].isActive) revert ClientNotRegisteredOrInactive();
        _;
    }
    
    modifier validJob(uint256 _jobId) {
        if (_jobId == 0 || _jobId >= nextJobId) revert InvalidJobId();
        _;
    }
    
    constructor(address _paymentToken, address _platformWallet) {
        paymentToken = IERC20(_paymentToken);
        platformWallet = _platformWallet;
    }
    
    /**
     * @dev Register a new field service team
     * @param _name Team name
     * @param _teamType Type of team (cleaning, maintenance, etc.)
     */
    function registerTeam(string calldata _name, string calldata _teamType) external {
        if (teams[msg.sender].isActive) revert TeamAlreadyRegistered();
        
        teams[msg.sender] = Team({
            teamAddress: msg.sender,
            name: _name,
            teamType: _teamType,
            isActive: true,
            totalJobs: 0,
            completedJobs: 0,
            rating: 0,
            registeredAt: block.timestamp
        });
        
        emit TeamRegistered(msg.sender, _name, block.timestamp);
    }
    
    /**
     * @dev Register a new client
     * @param _name Client name
     * @param _contactInfo Contact information
     */
    function registerClient(string calldata _name, string calldata _contactInfo) external {
        if (clients[msg.sender].isActive) revert ClientAlreadyRegistered();
        
        clients[msg.sender] = Client({
            clientAddress: msg.sender,
            name: _name,
            contactInfo: _contactInfo,
            isActive: true,
            totalJobs: 0,
            totalSpent: 0,
            registeredAt: block.timestamp
        });
        
        emit ClientRegistered(msg.sender, _name, block.timestamp);
    }
    
    /**
     * @dev Create a new field service job
     * @param _title Job title
     * @param _description Job description
     * @param _serviceAddress Service location address
     * @param _scheduledTime Scheduled time for the job
     * @param _estimatedDuration Estimated duration in seconds
     * @param _payment Payment amount in tokens
     */
    function createJob(
        string memory _title,
        string memory _description,
        string memory _serviceAddress,
        uint256 _scheduledTime,
        uint256 _estimatedDuration,
        uint256 _payment
    ) external onlyRegisteredClient {
        if (_payment == 0) revert PaymentMustBeGreaterThanZero();
        if (_scheduledTime <= block.timestamp) revert ScheduledTimeMustBeInFuture();
        
        // Transfer payment to contract (escrow)
        if (!paymentToken.transferFrom(msg.sender, address(this), _payment)) {
            revert TransferFailed();
        }
        
        uint256 jobId = nextJobId++;
        
        jobs[jobId] = Job({
            jobId: jobId,
            client: msg.sender,
            team: address(0),
            title: _title,
            description: _description,
            serviceAddress: _serviceAddress,
            scheduledTime: _scheduledTime,
            estimatedDuration: _estimatedDuration,
            payment: _payment,
            status: JobStatus.Created,
            createdAt: block.timestamp,
            completedAt: 0,
            paymentReleased: false
        });
        
        clientJobs[msg.sender].push(jobId);
        clients[msg.sender].totalJobs++;
        
        emit JobCreated(jobId, msg.sender, _payment);
    }
    
    /**
     * @dev Assign a job to a team
     * @param _jobId Job ID
     * @param _team Team address
     */
    function assignJob(uint256 _jobId, address _team) external validJob(_jobId) {
        Job storage job = jobs[_jobId];
        if (job.status != JobStatus.Created) revert JobNotAvailableForAssignment();
        if (!teams[_team].isActive) revert TeamNotActive();
        
        job.team = _team;
        job.status = JobStatus.Assigned;
        
        teamJobs[_team].push(_jobId);
        teams[_team].totalJobs++;
        
        emit JobAssigned(_jobId, _team, block.timestamp);
    }
    
    /**
     * @dev Start a job (called by assigned team)
     * @param _jobId Job ID
     */
    function startJob(uint256 _jobId) external validJob(_jobId) onlyRegisteredTeam {
        Job storage job = jobs[_jobId];
        if (job.team != msg.sender) revert NotAssignedToThisJob();
        if (job.status != JobStatus.Assigned) revert JobNotAssigned();
        
        job.status = JobStatus.InProgress;
        
        emit JobStarted(_jobId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Complete a job (called by assigned team)
     * @param _jobId Job ID
     * @param _completionPhotos IPFS hash of completion photos
     */
    function completeJob(uint256 _jobId, string calldata _completionPhotos) 
        external 
        validJob(_jobId) 
        onlyRegisteredTeam 
    {
        Job storage job = jobs[_jobId];
        if (job.team != msg.sender) revert NotAssignedToThisJob();
        if (job.status != JobStatus.InProgress) revert JobNotInProgress();
        
        job.status = JobStatus.Completed;
        job.completedAt = block.timestamp;
        jobPhotos[_jobId] = _completionPhotos;
        
        teams[msg.sender].completedJobs++;
        
        emit JobCompleted(_jobId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Release payment to team after job completion
     * @param _jobId Job ID
     */
    function releasePayment(uint256 _jobId) external validJob(_jobId) {
        Job storage job = jobs[_jobId];
        if (job.status != JobStatus.Completed) revert JobNotCompleted();
        if (job.paymentReleased) revert PaymentAlreadyReleased();
        if (job.client != msg.sender && msg.sender != owner()) revert NotAuthorized();
        
        job.paymentReleased = true;
        
        // Calculate platform fee
        uint256 platformFee = (job.payment * platformFeePercentage) / 100;
        uint256 teamPayment = job.payment - platformFee;
        
        // Transfer payment to team
        if (!paymentToken.transfer(job.team, teamPayment)) {
            revert TransferFailed();
        }
        
        // Transfer platform fee
        if (platformFee > 0) {
            if (!paymentToken.transfer(platformWallet, platformFee)) {
                revert TransferFailed();
            }
        }
        
        // Update client total spent
        clients[job.client].totalSpent += job.payment;
        
        emit PaymentReleased(_jobId, job.team, teamPayment);
    }
    
    /**
     * @dev Cancel a job (only by client or owner)
     * @param _jobId Job ID
     */
    function cancelJob(uint256 _jobId) external validJob(_jobId) {
        Job storage job = jobs[_jobId];
        if (job.client != msg.sender && msg.sender != owner()) {
            revert NotAuthorized();
        }
        if (job.status != JobStatus.Created && job.status != JobStatus.Assigned) {
            revert JobNotCancellable();
        }
        
        job.status = JobStatus.Cancelled;
        
        // Refund payment to client
        if (!paymentToken.transfer(job.client, job.payment)) {
            revert TransferFailed();
        }
    }
    
    /**
     * @dev Update team rating after job completion
     * @param _team Team address
     * @param _rating New rating (1-5)
     */
    function updateTeamRating(address _team, uint256 _rating) external onlyOwner {
        if (_rating < 1 || _rating > 5) revert RatingOutOfRange();
        if (!teams[_team].isActive) revert TeamNotActive();
        
        // Calculate new average rating
        uint256 totalRating = teams[_team].rating * teams[_team].completedJobs;
        totalRating += _rating;
        teams[_team].rating = totalRating / (teams[_team].completedJobs + 1);
    }
    
    /**
     * @dev Get job details
     * @param _jobId Job ID
     * @return Job struct
     */
    function getJob(uint256 _jobId) external view validJob(_jobId) returns (Job memory) {
        return jobs[_jobId];
    }
    
    /**
     * @dev Get team details
     * @param _team Team address
     * @return Team struct
     */
    function getTeam(address _team) external view returns (Team memory) {
        return teams[_team];
    }
    
    /**
     * @dev Get client details
     * @param _client Client address
     * @return Client struct
     */
    function getClient(address _client) external view returns (Client memory) {
        return clients[_client];
    }
    
    /**
     * @dev Get jobs for a client
     * @param _client Client address
     * @return Array of job IDs
     */
    function getClientJobs(address _client) external view returns (uint256[] memory) {
        return clientJobs[_client];
    }
    
    /**
     * @dev Get jobs for a team
     * @param _team Team address
     * @return Array of job IDs
     */
    function getTeamJobs(address _team) external view returns (uint256[] memory) {
        return teamJobs[_team];
    }
    
    /**
     * @dev Update platform fee percentage (only owner)
     * @param _newFeePercentage New fee percentage
     */
    function updatePlatformFee(uint256 _newFeePercentage) external onlyOwner {
        if (_newFeePercentage > 20) revert FeeExceedsMaximum();
        platformFeePercentage = _newFeePercentage;
    }
    
    /**
     * @dev Update platform wallet (only owner)
     * @param _newWallet New platform wallet address
     */
    function updatePlatformWallet(address _newWallet) external onlyOwner {
        if (_newWallet == address(0)) revert InvalidWalletAddress();
        platformWallet = _newWallet;
    }
    
    /**
     * @dev Emergency withdraw (only owner)
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        if (!paymentToken.transfer(owner(), _amount)) {
            revert WithdrawalFailed();
        }
    }
}
