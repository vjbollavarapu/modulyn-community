const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ModulynERP", function () {
  let ModulynERP;
  let ModulynToken;
  let owner;
  let client;
  let vendor;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, client, vendor, addr1, addr2] = await ethers.getSigners();

    // Deploy ModulynToken
    const ModulynToken = await ethers.getContractFactory("ModulynToken");
    ModulynToken = await ModulynToken.deploy();
    await ModulynToken.waitForDeployment();

    // Deploy ModulynERP
    const ModulynERP = await ethers.getContractFactory("ModulynERP");
    ModulynERP = await ModulynERP.deploy();
    await ModulynERP.waitForDeployment();

    // Set up voting power for testing
    await ModulynERP.setVotingPower(owner.address, ethers.parseEther("1000000"));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await ModulynERP.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct values", async function () {
      expect(await ModulynERP.nextInvoiceId()).to.equal(1);
      expect(await ModulynERP.nextPaymentId()).to.equal(1);
      expect(await ModulynERP.nextProposalId()).to.equal(1);
    });
  });

  describe("Invoice Management", function () {
    it("Should create an invoice", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test invoice data"));

      await expect(
        ModulynERP.createInvoice(
          client.address,
          amount,
          ethers.ZeroAddress, // ETH
          "Test Invoice",
          dueDate,
          dataHash
        )
      )
        .to.emit(ModulynERP, "InvoiceCreated")
        .withArgs(1, client.address, vendor.address, amount);

      const invoice = await ModulynERP.getInvoice(1);
      expect(invoice.client).to.equal(client.address);
      expect(invoice.vendor).to.equal(vendor.address);
      expect(invoice.amount).to.equal(amount);
      expect(invoice.status).to.equal(0); // Draft
    });

    it("Should send an invoice", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test invoice data"));

      await ModulynERP.createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test Invoice",
        dueDate,
        dataHash
      );

      await ModulynERP.sendInvoice(1);

      const invoice = await ModulynERP.getInvoice(1);
      expect(invoice.status).to.equal(1); // Sent
    });

    it("Should pay an invoice with ETH", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test invoice data"));

      await ModulynERP.createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test Invoice",
        dueDate,
        dataHash
      );

      await ModulynERP.sendInvoice(1);

      const initialBalance = await ethers.provider.getBalance(vendor.address);

      await expect(
        ModulynERP.connect(client).payInvoice(1, { value: amount })
      )
        .to.emit(ModulynERP, "InvoicePaid")
        .withArgs(1, 1, amount);

      const finalBalance = await ethers.provider.getBalance(vendor.address);
      expect(finalBalance).to.be.closeTo(initialBalance + amount, ethers.parseEther("0.1"));

      const invoice = await ModulynERP.getInvoice(1);
      expect(invoice.status).to.equal(2); // Paid
    });

    it("Should pay an invoice with ERC20 tokens", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test invoice data"));

      // Transfer tokens to client
      await ModulynToken.transfer(client.address, amount);

      await ModulynERP.createInvoice(
        client.address,
        amount,
        await ModulynToken.getAddress(),
        "Test Invoice",
        dueDate,
        dataHash
      );

      await ModulynERP.sendInvoice(1);

      await ModulynToken.connect(client).approve(await ModulynERP.getAddress(), amount);

      await expect(
        ModulynERP.connect(client).payInvoice(1)
      )
        .to.emit(ModulynERP, "InvoicePaid")
        .withArgs(1, 1, amount);

      const invoice = await ModulynERP.getInvoice(1);
      expect(invoice.status).to.equal(2); // Paid
    });
  });

  describe("Data Anchoring", function () {
    it("Should anchor data to blockchain", async function () {
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test data"));
      const dataType = "test";

      await expect(
        ModulynERP.anchorData(dataHash, dataType, owner.address)
      )
        .to.emit(ModulynERP, "DataAnchored")
        .withArgs(dataHash, dataType, owner.address);

      const anchor = await ModulynERP.dataAnchors(dataHash);
      expect(anchor.dataHash).to.equal(dataHash);
      expect(anchor.dataType).to.equal(dataType);
      expect(anchor.anchorer).to.equal(owner.address);
      expect(anchor.isVerified).to.be.true;
    });

    it("Should verify data integrity", async function () {
      const data = "test data";
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes(data));

      const isValid = await ModulynERP.verifyData(dataHash, data);
      expect(isValid).to.be.true;

      const invalidData = "different data";
      const isInvalid = await ModulynERP.verifyData(dataHash, invalidData);
      expect(isInvalid).to.be.false;
    });
  });

  describe("Governance", function () {
    it("Should create a proposal", async function () {
      const title = "Test Proposal";
      const description = "This is a test proposal";
      const votingPowerRequired = ethers.parseEther("1000");
      const votingDuration = 86400; // 1 day
      const executionHash = ethers.keccak256(ethers.toUtf8Bytes("execution data"));

      await expect(
        ModulynERP.createProposal(
          title,
          description,
          votingPowerRequired,
          votingDuration,
          executionHash
        )
      )
        .to.emit(ModulynERP, "ProposalCreated")
        .withArgs(1, owner.address, title);

      const proposal = await ModulynERP.getProposal(1);
      expect(proposal.proposer).to.equal(owner.address);
      expect(proposal.title).to.equal(title);
      expect(proposal.description).to.equal(description);
      expect(proposal.status).to.equal(1); // Active
    });

    it("Should cast a vote", async function () {
      const title = "Test Proposal";
      const description = "This is a test proposal";
      const votingPowerRequired = ethers.parseEther("1000");
      const votingDuration = 86400;
      const executionHash = ethers.keccak256(ethers.toUtf8Bytes("execution data"));

      await ModulynERP.createProposal(
        title,
        description,
        votingPowerRequired,
        votingDuration,
        executionHash
      );

      await expect(
        ModulynERP.vote(1, true)
      )
        .to.emit(ModulynERP, "VoteCast")
        .withArgs(1, owner.address, true, ethers.parseEther("1000000"));

      const proposal = await ModulynERP.getProposal(1);
      expect(proposal.votesFor).to.equal(ethers.parseEther("1000000"));
    });

    it("Should execute a proposal", async function () {
      const title = "Test Proposal";
      const description = "This is a test proposal";
      const votingPowerRequired = ethers.parseEther("1000");
      const votingDuration = 1; // 1 second for testing
      const executionHash = ethers.keccak256(ethers.toUtf8Bytes("execution data"));

      await ModulynERP.createProposal(
        title,
        description,
        votingPowerRequired,
        votingDuration,
        executionHash
      );

      await ModulynERP.vote(1, true);

      // Wait for voting to end
      await new Promise(resolve => setTimeout(resolve, 2000));

      await expect(
        ModulynERP.executeProposal(1)
      )
        .to.emit(ModulynERP, "ProposalExecuted")
        .withArgs(1, executionHash);

      const proposal = await ModulynERP.getProposal(1);
      expect(proposal.status).to.equal(3); // Executed
    });
  });

  describe("Access Control", function () {
    it("Should only allow invoice participants to interact with invoices", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test invoice data"));

      await ModulynERP.createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test Invoice",
        dueDate,
        dataHash
      );

      await expect(
        ModulynERP.connect(addr1).sendInvoice(1)
      ).to.be.revertedWith("Not authorized for this invoice");

      await expect(
        ModulynERP.connect(addr1).payInvoice(1, { value: amount })
      ).to.be.revertedWith("Not authorized for this invoice");
    });

    it("Should only allow owner to set voting power", async function () {
      await expect(
        ModulynERP.connect(addr1).setVotingPower(addr1.address, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(ModulynERP, "OwnableUnauthorizedAccount");
    });
  });

  describe("Statistics", function () {
    it("Should return correct statistics", async function () {
      const stats = await ModulynERP.getStats();
      expect(stats[0]).to.equal(0); // totalInvoices
      expect(stats[1]).to.equal(0); // totalPayments
      expect(stats[2]).to.equal(0); // totalProposals
      expect(stats[3]).to.equal(0); // totalAnchors

      // Create an invoice
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test invoice data"));

      await ModulynERP.createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test Invoice",
        dueDate,
        dataHash
      );

      const newStats = await ModulynERP.getStats();
      expect(newStats[0]).to.equal(1); // totalInvoices
    });
  });
});
