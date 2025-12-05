const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FieldOperations", function () {
  let FieldOperations;
  let ModulynToken;
  let owner;
  let platformWallet;
  let client1;
  let client2;
  let team1;
  let team2;
  let addr1;
  let addr2;

  const PLATFORM_FEE_PERCENTAGE = 5; // 5%

  beforeEach(async function () {
    [owner, platformWallet, client1, client2, team1, team2, addr1, addr2] = await ethers.getSigners();

    // Deploy ModulynToken
    const ModulynTokenFactory = await ethers.getContractFactory("ModulynToken");
    ModulynToken = await ModulynTokenFactory.deploy();
    await ModulynToken.waitForDeployment();

    // Deploy FieldOperations
    const FieldOperationsFactory = await ethers.getContractFactory("FieldOperations");
    FieldOperations = await FieldOperationsFactory.deploy(
      await ModulynToken.getAddress(),
      platformWallet.address
    );
    await FieldOperations.waitForDeployment();

    // Transfer tokens to clients and teams for testing
    const amount = ethers.parseEther("10000");
    await ModulynToken.transfer(client1.address, amount);
    await ModulynToken.transfer(client2.address, amount);
    await ModulynToken.transfer(team1.address, amount);
    await ModulynToken.transfer(team2.address, amount);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await FieldOperations.owner()).to.equal(owner.address);
    });

    it("Should set the correct payment token", async function () {
      expect(await FieldOperations.paymentToken()).to.equal(await ModulynToken.getAddress());
    });

    it("Should set the correct platform wallet", async function () {
      expect(await FieldOperations.platformWallet()).to.equal(platformWallet.address);
    });

    it("Should initialize with correct platform fee", async function () {
      expect(await FieldOperations.platformFeePercentage()).to.equal(PLATFORM_FEE_PERCENTAGE);
    });

    it("Should initialize with zero jobs", async function () {
      expect(await FieldOperations.nextJobId()).to.equal(1);
    });
  });

  describe("Team Registration", function () {
    it("Should register a new team", async function () {
      await expect(
        FieldOperations.connect(team1).registerTeam("Team Alpha", "cleaning")
      )
        .to.emit(FieldOperations, "TeamRegistered")
        .withArgs(team1.address, "Team Alpha", (timestamp) => timestamp > 0);

      const team = await FieldOperations.getTeam(team1.address);
      expect(team.teamAddress).to.equal(team1.address);
      expect(team.name).to.equal("Team Alpha");
      expect(team.teamType).to.equal("cleaning");
      expect(team.isActive).to.be.true;
      expect(team.totalJobs).to.equal(0);
      expect(team.completedJobs).to.equal(0);
      expect(team.rating).to.equal(0);
    });

    it("Should revert when team already registered", async function () {
      await FieldOperations.connect(team1).registerTeam("Team Alpha", "cleaning");

      await expect(
        FieldOperations.connect(team1).registerTeam("Team Beta", "maintenance")
      ).to.be.revertedWithCustomError(FieldOperations, "TeamAlreadyRegistered");
    });

    it("Should allow multiple teams to register", async function () {
      await FieldOperations.connect(team1).registerTeam("Team Alpha", "cleaning");
      await FieldOperations.connect(team2).registerTeam("Team Beta", "maintenance");

      const team1Data = await FieldOperations.getTeam(team1.address);
      const team2Data = await FieldOperations.getTeam(team2.address);

      expect(team1Data.name).to.equal("Team Alpha");
      expect(team2Data.name).to.equal("Team Beta");
    });

    it("Should register team with empty name", async function () {
      await FieldOperations.connect(team1).registerTeam("", "cleaning");

      const team = await FieldOperations.getTeam(team1.address);
      expect(team.name).to.equal("");
    });
  });

  describe("Client Registration", function () {
    it("Should register a new client", async function () {
      await expect(
        FieldOperations.connect(client1).registerClient("Client One", "client1@example.com")
      )
        .to.emit(FieldOperations, "ClientRegistered")
        .withArgs(client1.address, "Client One", (timestamp) => timestamp > 0);

      const client = await FieldOperations.getClient(client1.address);
      expect(client.clientAddress).to.equal(client1.address);
      expect(client.name).to.equal("Client One");
      expect(client.contactInfo).to.equal("client1@example.com");
      expect(client.isActive).to.be.true;
      expect(client.totalJobs).to.equal(0);
      expect(client.totalSpent).to.equal(0);
    });

    it("Should revert when client already registered", async function () {
      await FieldOperations.connect(client1).registerClient("Client One", "client1@example.com");

      await expect(
        FieldOperations.connect(client1).registerClient("Client Two", "client2@example.com")
      ).to.be.revertedWithCustomError(FieldOperations, "ClientAlreadyRegistered");
    });

    it("Should allow multiple clients to register", async function () {
      await FieldOperations.connect(client1).registerClient("Client One", "client1@example.com");
      await FieldOperations.connect(client2).registerClient("Client Two", "client2@example.com");

      const client1Data = await FieldOperations.getClient(client1.address);
      const client2Data = await FieldOperations.getClient(client2.address);

      expect(client1Data.name).to.equal("Client One");
      expect(client2Data.name).to.equal("Client Two");
    });
  });

  describe("Job Creation", function () {
    beforeEach(async function () {
      await FieldOperations.connect(client1).registerClient("Client One", "client1@example.com");
    });

    it("Should create a new job", async function () {
      const payment = ethers.parseEther("100");
      const scheduledTime = (await time.latest()) + 86400; // 1 day from now

      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      await expect(
        FieldOperations.connect(client1).createJob(
          "Office Cleaning",
          "Deep clean office space",
          "123 Main St",
          scheduledTime,
          3600, // 1 hour
          payment
        )
      )
        .to.emit(FieldOperations, "JobCreated")
        .withArgs(1, client1.address, payment);

      const job = await FieldOperations.getJob(1);
      expect(job.jobId).to.equal(1);
      expect(job.client).to.equal(client1.address);
      expect(job.title).to.equal("Office Cleaning");
      expect(job.description).to.equal("Deep clean office space");
      expect(job.serviceAddress).to.equal("123 Main St");
      expect(job.payment).to.equal(payment);
      expect(job.status).to.equal(0); // Created
      expect(job.team).to.equal(ethers.ZeroAddress);
      expect(job.paymentReleased).to.be.false;
    });

    it("Should revert with zero payment", async function () {
      const scheduledTime = (await time.latest()) + 86400;

      await expect(
        FieldOperations.connect(client1).createJob(
          "Test Job",
          "Description",
          "Address",
          scheduledTime,
          3600,
          0
        )
      ).to.be.revertedWithCustomError(FieldOperations, "PaymentMustBeGreaterThanZero");
    });

    it("Should revert with past scheduled time", async function () {
      const payment = ethers.parseEther("100");
      const pastTime = (await time.latest()) - 86400; // 1 day ago

      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      await expect(
        FieldOperations.connect(client1).createJob(
          "Test Job",
          "Description",
          "Address",
          pastTime,
          3600,
          payment
        )
      ).to.be.revertedWithCustomError(FieldOperations, "ScheduledTimeMustBeInFuture");
    });

    it("Should revert when client not registered", async function () {
      const payment = ethers.parseEther("100");
      const scheduledTime = (await time.latest()) + 86400;

      await ModulynToken.connect(addr1).approve(await FieldOperations.getAddress(), payment);

      await expect(
        FieldOperations.connect(addr1).createJob(
          "Test Job",
          "Description",
          "Address",
          scheduledTime,
          3600,
          payment
        )
      ).to.be.revertedWithCustomError(FieldOperations, "ClientNotRegisteredOrInactive");
    });

    it("Should transfer payment to contract (escrow)", async function () {
      const payment = ethers.parseEther("100");
      const scheduledTime = (await time.latest()) + 86400;

      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      const balanceBefore = await ModulynToken.balanceOf(await FieldOperations.getAddress());

      await FieldOperations.connect(client1).createJob(
        "Test Job",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );

      const balanceAfter = await ModulynToken.balanceOf(await FieldOperations.getAddress());
      expect(balanceAfter - balanceBefore).to.equal(payment);
    });

    it("Should update client job count", async function () {
      const payment = ethers.parseEther("100");
      const scheduledTime = (await time.latest()) + 86400;

      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      const clientBefore = await FieldOperations.getClient(client1.address);
      expect(clientBefore.totalJobs).to.equal(0);

      await FieldOperations.connect(client1).createJob(
        "Test Job",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );

      const clientAfter = await FieldOperations.getClient(client1.address);
      expect(clientAfter.totalJobs).to.equal(1);
    });

    it("Should add job to client jobs list", async function () {
      const payment = ethers.parseEther("100");
      const scheduledTime = (await time.latest()) + 86400;

      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      await FieldOperations.connect(client1).createJob(
        "Test Job",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );

      const clientJobs = await FieldOperations.getClientJobs(client1.address);
      expect(clientJobs.length).to.equal(1);
      expect(clientJobs[0]).to.equal(1);
    });
  });

  describe("Job Assignment", function () {
    let jobId;
    const payment = ethers.parseEther("100");

    beforeEach(async function () {
      await FieldOperations.connect(client1).registerClient("Client One", "client1@example.com");
      await FieldOperations.connect(team1).registerTeam("Team Alpha", "cleaning");

      const scheduledTime = (await time.latest()) + 86400;
      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      await FieldOperations.connect(client1).createJob(
        "Office Cleaning",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );
      jobId = 1;
    });

    it("Should assign job to team", async function () {
      await expect(
        FieldOperations.connect(owner).assignJob(jobId, team1.address)
      )
        .to.emit(FieldOperations, "JobAssigned")
        .withArgs(jobId, team1.address, (timestamp) => timestamp > 0);

      const job = await FieldOperations.getJob(jobId);
      expect(job.team).to.equal(team1.address);
      expect(job.status).to.equal(1); // Assigned
    });

    it("Should revert when job not available for assignment", async function () {
      await FieldOperations.connect(owner).assignJob(jobId, team1.address);

      await expect(
        FieldOperations.connect(owner).assignJob(jobId, team2.address)
      ).to.be.revertedWithCustomError(FieldOperations, "JobNotAvailableForAssignment");
    });

    it("Should revert when team not active", async function () {
      await expect(
        FieldOperations.connect(owner).assignJob(jobId, addr1.address)
      ).to.be.revertedWithCustomError(FieldOperations, "TeamNotActive");
    });

    it("Should revert with invalid job ID", async function () {
      await expect(
        FieldOperations.connect(owner).assignJob(999, team1.address)
      ).to.be.revertedWithCustomError(FieldOperations, "InvalidJobId");
    });

    it("Should add job to team jobs list", async function () {
      await FieldOperations.connect(owner).assignJob(jobId, team1.address);

      const teamJobs = await FieldOperations.getTeamJobs(team1.address);
      expect(teamJobs.length).to.equal(1);
      expect(teamJobs[0]).to.equal(jobId);
    });

    it("Should update team total jobs count", async function () {
      const teamBefore = await FieldOperations.getTeam(team1.address);
      expect(teamBefore.totalJobs).to.equal(0);

      await FieldOperations.connect(owner).assignJob(jobId, team1.address);

      const teamAfter = await FieldOperations.getTeam(team1.address);
      expect(teamAfter.totalJobs).to.equal(1);
    });
  });

  describe("Job Start", function () {
    let jobId;
    const payment = ethers.parseEther("100");

    beforeEach(async function () {
      await FieldOperations.connect(client1).registerClient("Client One", "client1@example.com");
      await FieldOperations.connect(team1).registerTeam("Team Alpha", "cleaning");

      const scheduledTime = (await time.latest()) + 86400;
      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      await FieldOperations.connect(client1).createJob(
        "Office Cleaning",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );
      jobId = 1;

      await FieldOperations.connect(owner).assignJob(jobId, team1.address);
    });

    it("Should start assigned job", async function () {
      await expect(
        FieldOperations.connect(team1).startJob(jobId)
      )
        .to.emit(FieldOperations, "JobStarted")
        .withArgs(jobId, team1.address, (timestamp) => timestamp > 0);

      const job = await FieldOperations.getJob(jobId);
      expect(job.status).to.equal(2); // InProgress
    });

    it("Should revert when not assigned team", async function () {
      // Register team2 first
      await FieldOperations.connect(team2).registerTeam("Team Beta", "maintenance");

      await expect(
        FieldOperations.connect(team2).startJob(jobId)
      ).to.be.revertedWithCustomError(FieldOperations, "NotAssignedToThisJob");
    });

    it("Should revert when job not assigned", async function () {
      // Create new job without assignment
      const scheduledTime = (await time.latest()) + 86400;
      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      await FieldOperations.connect(client1).createJob(
        "New Job",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );

      // Contract checks team assignment first, then status
      // Since job.team is address(0) and team1 is not address(0), it fails with "Not assigned to this job"
      await expect(
        FieldOperations.connect(team1).startJob(2)
      ).to.be.revertedWithCustomError(FieldOperations, "NotAssignedToThisJob");
    });

    it("Should revert when team not registered", async function () {
      await expect(
        FieldOperations.connect(addr1).startJob(jobId)
      ).to.be.revertedWithCustomError(FieldOperations, "TeamNotRegisteredOrInactive");
    });
  });

  describe("Job Completion", function () {
    let jobId;
    const payment = ethers.parseEther("100");

    beforeEach(async function () {
      await FieldOperations.connect(client1).registerClient("Client One", "client1@example.com");
      await FieldOperations.connect(team1).registerTeam("Team Alpha", "cleaning");

      const scheduledTime = (await time.latest()) + 86400;
      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      await FieldOperations.connect(client1).createJob(
        "Office Cleaning",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );
      jobId = 1;

      await FieldOperations.connect(owner).assignJob(jobId, team1.address);
      await FieldOperations.connect(team1).startJob(jobId);
    });

    it("Should complete job", async function () {
      const photosHash = "QmHash123";

      await expect(
        FieldOperations.connect(team1).completeJob(jobId, photosHash)
      )
        .to.emit(FieldOperations, "JobCompleted")
        .withArgs(jobId, team1.address, (timestamp) => timestamp > 0);

      const job = await FieldOperations.getJob(jobId);
      expect(job.status).to.equal(3); // Completed
      expect(job.completedAt).to.be.gt(0);
      expect(await FieldOperations.jobPhotos(jobId)).to.equal(photosHash);
    });

    it("Should revert when not assigned team", async function () {
      // Register team2 first
      await FieldOperations.connect(team2).registerTeam("Team Beta", "maintenance");

      await expect(
        FieldOperations.connect(team2).completeJob(jobId, "hash")
      ).to.be.revertedWithCustomError(FieldOperations, "NotAssignedToThisJob");
    });

    it("Should revert when job not in progress", async function () {
      // Try to complete before starting
      const scheduledTime = (await time.latest()) + 86400;
      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      await FieldOperations.connect(client1).createJob(
        "New Job",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );

      await FieldOperations.connect(owner).assignJob(2, team1.address);

      await expect(
        FieldOperations.connect(team1).completeJob(2, "hash")
      ).to.be.revertedWithCustomError(FieldOperations, "JobNotInProgress");
    });

    it("Should update team completed jobs count", async function () {
      const teamBefore = await FieldOperations.getTeam(team1.address);
      expect(teamBefore.completedJobs).to.equal(0);

      await FieldOperations.connect(team1).completeJob(jobId, "hash");

      const teamAfter = await FieldOperations.getTeam(team1.address);
      expect(teamAfter.completedJobs).to.equal(1);
    });
  });

  describe("Payment Release", function () {
    let jobId;
    const payment = ethers.parseEther("100");

    beforeEach(async function () {
      await FieldOperations.connect(client1).registerClient("Client One", "client1@example.com");
      await FieldOperations.connect(team1).registerTeam("Team Alpha", "cleaning");

      const scheduledTime = (await time.latest()) + 86400;
      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      await FieldOperations.connect(client1).createJob(
        "Office Cleaning",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );
      jobId = 1;

      await FieldOperations.connect(owner).assignJob(jobId, team1.address);
      await FieldOperations.connect(team1).startJob(jobId);
      await FieldOperations.connect(team1).completeJob(jobId, "hash");
    });

    it("Should release payment to team", async function () {
      const platformFee = (payment * BigInt(PLATFORM_FEE_PERCENTAGE)) / 100n;
      const teamPayment = payment - platformFee;

      const teamBalanceBefore = await ModulynToken.balanceOf(team1.address);
      const platformBalanceBefore = await ModulynToken.balanceOf(platformWallet.address);

      await expect(
        FieldOperations.connect(client1).releasePayment(jobId)
      )
        .to.emit(FieldOperations, "PaymentReleased")
        .withArgs(jobId, team1.address, teamPayment);

      const teamBalanceAfter = await ModulynToken.balanceOf(team1.address);
      const platformBalanceAfter = await ModulynToken.balanceOf(platformWallet.address);

      expect(teamBalanceAfter - teamBalanceBefore).to.equal(teamPayment);
      expect(platformBalanceAfter - platformBalanceBefore).to.equal(platformFee);

      const job = await FieldOperations.getJob(jobId);
      expect(job.paymentReleased).to.be.true;
    });

    it("Should revert when job not completed", async function () {
      // Create new job and assign but don't complete
      const scheduledTime = (await time.latest()) + 86400;
      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      await FieldOperations.connect(client1).createJob(
        "New Job",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );

      await FieldOperations.connect(owner).assignJob(2, team1.address);

      await expect(
        FieldOperations.connect(client1).releasePayment(2)
      ).to.be.revertedWithCustomError(FieldOperations, "JobNotCompleted");
    });

    it("Should revert when payment already released", async function () {
      await FieldOperations.connect(client1).releasePayment(jobId);

      await expect(
        FieldOperations.connect(client1).releasePayment(jobId)
      ).to.be.revertedWithCustomError(FieldOperations, "PaymentAlreadyReleased");
    });

    it("Should allow owner to release payment", async function () {
      const platformFee = (payment * BigInt(PLATFORM_FEE_PERCENTAGE)) / 100n;
      const teamPayment = payment - platformFee;

      await expect(
        FieldOperations.connect(owner).releasePayment(jobId)
      )
        .to.emit(FieldOperations, "PaymentReleased")
        .withArgs(jobId, team1.address, teamPayment);
    });

    it("Should revert when unauthorized caller", async function () {
      await expect(
        FieldOperations.connect(addr1).releasePayment(jobId)
      ).to.be.revertedWithCustomError(FieldOperations, "NotAuthorized");
    });

    it("Should update client total spent", async function () {
      const clientBefore = await FieldOperations.getClient(client1.address);
      expect(clientBefore.totalSpent).to.equal(0);

      await FieldOperations.connect(client1).releasePayment(jobId);

      const clientAfter = await FieldOperations.getClient(client1.address);
      expect(clientAfter.totalSpent).to.equal(payment);
    });
  });

  describe("Job Cancellation", function () {
    let jobId;
    const payment = ethers.parseEther("100");

    beforeEach(async function () {
      await FieldOperations.connect(client1).registerClient("Client One", "client1@example.com");
      await FieldOperations.connect(team1).registerTeam("Team Alpha", "cleaning");

      const scheduledTime = (await time.latest()) + 86400;
      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      await FieldOperations.connect(client1).createJob(
        "Office Cleaning",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );
      jobId = 1;
    });

    it("Should cancel job by client", async function () {
      const clientBalanceBefore = await ModulynToken.balanceOf(client1.address);

      await FieldOperations.connect(client1).cancelJob(jobId);

      const job = await FieldOperations.getJob(jobId);
      expect(job.status).to.equal(4); // Cancelled

      const clientBalanceAfter = await ModulynToken.balanceOf(client1.address);
      expect(clientBalanceAfter - clientBalanceBefore).to.equal(payment);
    });

    it("Should cancel job by owner", async function () {
      await FieldOperations.connect(owner).cancelJob(jobId);

      const job = await FieldOperations.getJob(jobId);
      expect(job.status).to.equal(4); // Cancelled
    });

    it("Should revert when unauthorized caller", async function () {
      await expect(
        FieldOperations.connect(addr1).cancelJob(jobId)
      ).to.be.revertedWithCustomError(FieldOperations, "NotAuthorized");
    });

    it("Should cancel assigned job", async function () {
      await FieldOperations.connect(owner).assignJob(jobId, team1.address);

      await FieldOperations.connect(client1).cancelJob(jobId);

      const job = await FieldOperations.getJob(jobId);
      expect(job.status).to.equal(4); // Cancelled
    });

    it("Should revert when cancelling job in progress", async function () {
      await FieldOperations.connect(owner).assignJob(jobId, team1.address);
      await FieldOperations.connect(team1).startJob(jobId);

      await expect(
        FieldOperations.connect(client1).cancelJob(jobId)
      ).to.be.revertedWithCustomError(FieldOperations, "JobNotCancellable");
    });

    it("Should revert when cancelling completed job", async function () {
      await FieldOperations.connect(owner).assignJob(jobId, team1.address);
      await FieldOperations.connect(team1).startJob(jobId);
      await FieldOperations.connect(team1).completeJob(jobId, "hash");

      await expect(
        FieldOperations.connect(client1).cancelJob(jobId)
      ).to.be.revertedWithCustomError(FieldOperations, "JobNotCancellable");
    });
  });

  describe("Admin Functions", function () {
    beforeEach(async function () {
      await FieldOperations.connect(team1).registerTeam("Team Alpha", "cleaning");
    });

    it("Should update team rating", async function () {
      // First complete a job to have completedJobs > 0
      await FieldOperations.connect(client1).registerClient("Client One", "client1@example.com");
      const payment = ethers.parseEther("100");
      const scheduledTime = (await time.latest()) + 86400;
      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      await FieldOperations.connect(client1).createJob(
        "Test Job",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );

      await FieldOperations.connect(owner).assignJob(1, team1.address);
      await FieldOperations.connect(team1).startJob(1);
      await FieldOperations.connect(team1).completeJob(1, "hash");

      // Rating calculation: (rating * completedJobs + newRating) / (completedJobs + 1)
      // Initially: rating = 0, completedJobs = 1
      // After update with 5: (0 * 1 + 5) / (1 + 1) = 5 / 2 = 2 (truncated)
      await FieldOperations.connect(owner).updateTeamRating(team1.address, 5);

      const team = await FieldOperations.getTeam(team1.address);
      expect(team.rating).to.equal(2); // 5 / 2 = 2 (integer division)
    });

    it("Should revert with invalid rating", async function () {
      await expect(
        FieldOperations.connect(owner).updateTeamRating(team1.address, 0)
      ).to.be.revertedWithCustomError(FieldOperations, "RatingOutOfRange");

      await expect(
        FieldOperations.connect(owner).updateTeamRating(team1.address, 6)
      ).to.be.revertedWithCustomError(FieldOperations, "RatingOutOfRange");
    });

    it("Should revert when team not active", async function () {
      await expect(
        FieldOperations.connect(owner).updateTeamRating(addr1.address, 5)
      ).to.be.revertedWithCustomError(FieldOperations, "TeamNotActive");
    });

    it("Should revert when non-owner tries to update rating", async function () {
      await expect(
        FieldOperations.connect(addr1).updateTeamRating(team1.address, 5)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should update platform fee", async function () {
      await FieldOperations.connect(owner).updatePlatformFee(10);

      expect(await FieldOperations.platformFeePercentage()).to.equal(10);
    });

    it("Should revert when fee exceeds 20%", async function () {
      await expect(
        FieldOperations.connect(owner).updatePlatformFee(21)
      ).to.be.revertedWithCustomError(FieldOperations, "FeeExceedsMaximum");
    });

    it("Should revert when non-owner tries to update fee", async function () {
      await expect(
        FieldOperations.connect(addr1).updatePlatformFee(10)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should update platform wallet", async function () {
      await FieldOperations.connect(owner).updatePlatformWallet(addr1.address);

      expect(await FieldOperations.platformWallet()).to.equal(addr1.address);
    });

    it("Should revert with invalid wallet address", async function () {
      await expect(
        FieldOperations.connect(owner).updatePlatformWallet(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(FieldOperations, "InvalidWalletAddress");
    });

    it("Should revert when non-owner tries to update wallet", async function () {
      await expect(
        FieldOperations.connect(addr1).updatePlatformWallet(addr2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow emergency withdraw", async function () {
      // First deposit some tokens to contract
      const amount = ethers.parseEther("100");
      await ModulynToken.transfer(await FieldOperations.getAddress(), amount);

      const ownerBalanceBefore = await ModulynToken.balanceOf(owner.address);

      await FieldOperations.connect(owner).emergencyWithdraw(amount);

      const ownerBalanceAfter = await ModulynToken.balanceOf(owner.address);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(amount);
    });

    it("Should revert when non-owner tries emergency withdraw", async function () {
      await expect(
        FieldOperations.connect(addr1).emergencyWithdraw(ethers.parseEther("100"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await FieldOperations.connect(client1).registerClient("Client One", "client1@example.com");
      await FieldOperations.connect(team1).registerTeam("Team Alpha", "cleaning");
    });

    it("Should return correct job details", async function () {
      const payment = ethers.parseEther("100");
      const scheduledTime = (await time.latest()) + 86400;
      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      await FieldOperations.connect(client1).createJob(
        "Office Cleaning",
        "Deep clean",
        "123 Main St",
        scheduledTime,
        3600,
        payment
      );

      const job = await FieldOperations.getJob(1);
      expect(job.jobId).to.equal(1);
      expect(job.client).to.equal(client1.address);
      expect(job.title).to.equal("Office Cleaning");
      expect(job.description).to.equal("Deep clean");
      expect(job.serviceAddress).to.equal("123 Main St");
      expect(job.payment).to.equal(payment);
    });

    it("Should return correct team details", async function () {
      const team = await FieldOperations.getTeam(team1.address);
      expect(team.teamAddress).to.equal(team1.address);
      expect(team.name).to.equal("Team Alpha");
      expect(team.teamType).to.equal("cleaning");
      expect(team.isActive).to.be.true;
    });

    it("Should return correct client details", async function () {
      const client = await FieldOperations.getClient(client1.address);
      expect(client.clientAddress).to.equal(client1.address);
      expect(client.name).to.equal("Client One");
      expect(client.isActive).to.be.true;
    });

    it("Should return client jobs list", async function () {
      const payment = ethers.parseEther("100");
      const scheduledTime = (await time.latest()) + 86400;
      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment * 2n);

      await FieldOperations.connect(client1).createJob(
        "Job 1",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );

      await FieldOperations.connect(client1).createJob(
        "Job 2",
        "Description",
        "Address",
        scheduledTime + 86400,
        3600,
        payment
      );

      const clientJobs = await FieldOperations.getClientJobs(client1.address);
      expect(clientJobs.length).to.equal(2);
      expect(clientJobs[0]).to.equal(1);
      expect(clientJobs[1]).to.equal(2);
    });

    it("Should return team jobs list", async function () {
      const payment = ethers.parseEther("100");
      const scheduledTime = (await time.latest()) + 86400;
      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment * 2n);

      await FieldOperations.connect(client1).createJob(
        "Job 1",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );

      await FieldOperations.connect(client1).createJob(
        "Job 2",
        "Description",
        "Address",
        scheduledTime + 86400,
        3600,
        payment
      );

      await FieldOperations.connect(owner).assignJob(1, team1.address);
      await FieldOperations.connect(owner).assignJob(2, team1.address);

      const teamJobs = await FieldOperations.getTeamJobs(team1.address);
      expect(teamJobs.length).to.equal(2);
      expect(teamJobs[0]).to.equal(1);
      expect(teamJobs[1]).to.equal(2);
    });

    it("Should revert with invalid job ID", async function () {
      await expect(
        FieldOperations.getJob(999)
      ).to.be.revertedWithCustomError(FieldOperations, "InvalidJobId");
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle multiple jobs correctly", async function () {
      await FieldOperations.connect(client1).registerClient("Client One", "client1@example.com");
      await FieldOperations.connect(team1).registerTeam("Team Alpha", "cleaning");

      const payment = ethers.parseEther("100");
      const scheduledTime = (await time.latest()) + 86400;
      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment * 3n);

      await FieldOperations.connect(client1).createJob("Job 1", "Desc", "Addr", scheduledTime, 3600, payment);
      await FieldOperations.connect(client1).createJob("Job 2", "Desc", "Addr", scheduledTime + 86400, 3600, payment);
      await FieldOperations.connect(client1).createJob("Job 3", "Desc", "Addr", scheduledTime + 172800, 3600, payment);

      expect(await FieldOperations.nextJobId()).to.equal(4);
    });

    it("Should handle zero platform fee correctly", async function () {
      await FieldOperations.connect(owner).updatePlatformFee(0);

      await FieldOperations.connect(client1).registerClient("Client One", "client1@example.com");
      await FieldOperations.connect(team1).registerTeam("Team Alpha", "cleaning");

      const payment = ethers.parseEther("100");
      const scheduledTime = (await time.latest()) + 86400;
      await ModulynToken.connect(client1).approve(await FieldOperations.getAddress(), payment);

      await FieldOperations.connect(client1).createJob(
        "Test Job",
        "Description",
        "Address",
        scheduledTime,
        3600,
        payment
      );

      await FieldOperations.connect(owner).assignJob(1, team1.address);
      await FieldOperations.connect(team1).startJob(1);
      await FieldOperations.connect(team1).completeJob(1, "hash");

      const teamBalanceBefore = await ModulynToken.balanceOf(team1.address);

      await FieldOperations.connect(client1).releasePayment(1);

      const teamBalanceAfter = await ModulynToken.balanceOf(team1.address);
      expect(teamBalanceAfter - teamBalanceBefore).to.equal(payment); // Full payment, no fee
    });
  });
});

