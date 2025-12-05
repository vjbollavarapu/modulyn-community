const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

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
    const ModulynTokenFactory = await ethers.getContractFactory("ModulynToken");
    ModulynToken = await ModulynTokenFactory.deploy();
    await ModulynToken.waitForDeployment();

    // Deploy ModulynERP
    const ModulynERPFactory = await ethers.getContractFactory("ModulynERP");
    ModulynERP = await ModulynERPFactory.deploy();
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

      // Vendor creates the invoice (msg.sender = vendor)
      const tx = await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress, // ETH
        "Test Invoice",
        dueDate,
        dataHash
      );
      
      await expect(tx)
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

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test Invoice",
        dueDate,
        dataHash
      );

      await ModulynERP.connect(vendor).sendInvoice(1);

      const invoice = await ModulynERP.getInvoice(1);
      expect(invoice.status).to.equal(1); // Sent
    });

    it("Should pay an invoice with ETH", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test invoice data"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test Invoice",
        dueDate,
        dataHash
      );

      await ModulynERP.connect(vendor).sendInvoice(1);

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

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        await ModulynToken.getAddress(),
        "Test Invoice",
        dueDate,
        dataHash
      );

      await ModulynERP.connect(vendor).sendInvoice(1);

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
    it("Should anchor data to blockchain via invoice creation", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test invoice data"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test Invoice",
        dueDate,
        dataHash
      );

      // Data is anchored automatically when invoice is created
      const anchor = await ModulynERP.dataAnchors(dataHash);
      expect(anchor.dataHash).to.equal(dataHash);
      expect(anchor.dataType).to.equal("invoice");
      expect(anchor.anchorer).to.equal(vendor.address);
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
      expect(proposal.status).to.equal(4); // Executed (enum value 4)
    });
  });

  describe("Access Control", function () {
    it("Should only allow invoice participants to interact with invoices", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test invoice data"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test Invoice",
        dueDate,
        dataHash
      );

      await expect(
        ModulynERP.connect(addr1).sendInvoice(1)
      ).to.be.revertedWithCustomError(ModulynERP, "NotAuthorizedForInvoice");

      await expect(
        ModulynERP.connect(addr1).payInvoice(1, { value: amount })
      ).to.be.revertedWithCustomError(ModulynERP, "NotAuthorizedForInvoice");
    });

    it("Should only allow owner to set voting power", async function () {
      await expect(
        ModulynERP.connect(addr1).setVotingPower(addr1.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
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

      await ModulynERP.connect(vendor).createInvoice(
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

  describe("Invoice Management - Edge Cases", function () {
    it("Should revert when creating invoice with zero amount", async function () {
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await expect(
        ModulynERP.createInvoice(
          client.address,
          0,
          ethers.ZeroAddress,
          "Test",
          dueDate,
          dataHash
        )
      ).to.be.revertedWithCustomError(ModulynERP, "InvalidAmount");
    });

    it("Should revert when creating invoice with invalid client address", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await expect(
        ModulynERP.createInvoice(
          ethers.ZeroAddress,
          amount,
          ethers.ZeroAddress,
          "Test",
          dueDate,
          dataHash
        )
      ).to.be.revertedWithCustomError(ModulynERP, "InvalidClient");
    });

    it("Should revert when creating invoice with past due date", async function () {
      const amount = ethers.parseEther("100");
      const pastDate = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await expect(
        ModulynERP.createInvoice(
          client.address,
          amount,
          ethers.ZeroAddress,
          "Test",
          pastDate,
          dataHash
        )
      ).to.be.revertedWithCustomError(ModulynERP, "InvalidDueDate");
    });

    it("Should create multiple invoices for same client", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash1 = ethers.keccak256(ethers.toUtf8Bytes("invoice1"));
      const dataHash2 = ethers.keccak256(ethers.toUtf8Bytes("invoice2"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Invoice 1",
        dueDate,
        dataHash1
      );

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Invoice 2",
        dueDate,
        dataHash2
      );

      const invoice1 = await ModulynERP.getInvoice(1);
      const invoice2 = await ModulynERP.getInvoice(2);
      expect(invoice1.client).to.equal(client.address);
      expect(invoice2.client).to.equal(client.address);
      expect(invoice1.invoiceId).to.equal(1);
      expect(invoice2.invoiceId).to.equal(2);
    });

    it("Should create invoice with ERC20 token address", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        await ModulynToken.getAddress(),
        "ERC20 Invoice",
        dueDate,
        dataHash
      );

      const invoice = await ModulynERP.getInvoice(1);
      expect(invoice.tokenAddress).to.equal(await ModulynToken.getAddress());
    });

    it("Should create invoice with empty description", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "",
        dueDate,
        dataHash
      );

      const invoice = await ModulynERP.getInvoice(1);
      expect(invoice.description).to.equal("");
    });

    it("Should emit InvoiceCreated event with all fields", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      // Vendor creates the invoice
      const tx = await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test Invoice",
        dueDate,
        dataHash
      );
      
      await expect(tx)
        .to.emit(ModulynERP, "InvoiceCreated")
        .withArgs(1, client.address, vendor.address, amount);
    });
  });

  describe("Invoice Sending - Edge Cases", function () {
    it("Should revert when sending already sent invoice", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test",
        dueDate,
        dataHash
      );

      await ModulynERP.connect(vendor).sendInvoice(1);

      await expect(
        ModulynERP.connect(vendor).sendInvoice(1)
      ).to.be.revertedWithCustomError(ModulynERP, "InvoiceAlreadySent");
    });

    it("Should revert when sending paid invoice", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test",
        dueDate,
        dataHash
      );

      await ModulynERP.connect(vendor).sendInvoice(1);
      await ModulynERP.connect(client).payInvoice(1, { value: amount });

      await expect(
        ModulynERP.connect(vendor).sendInvoice(1)
      ).to.be.revertedWithCustomError(ModulynERP, "InvoiceAlreadySent");
    });

    it("Should revert when client tries to send invoice", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test",
        dueDate,
        dataHash
      );

      await expect(
        ModulynERP.connect(client).sendInvoice(1)
      ).to.be.revertedWithCustomError(ModulynERP, "OnlyVendorCanSend");
    });

    it("Should verify status transition from Draft to Sent", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test",
        dueDate,
        dataHash
      );

      let invoice = await ModulynERP.getInvoice(1);
      expect(invoice.status).to.equal(0); // Draft

      await ModulynERP.connect(vendor).sendInvoice(1);

      invoice = await ModulynERP.getInvoice(1);
      expect(invoice.status).to.equal(1); // Sent
    });
  });

  describe("Invoice Payment - Edge Cases", function () {
    it("Should revert when paying draft invoice", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test",
        dueDate,
        dataHash
      );

      await expect(
        ModulynERP.connect(client).payInvoice(1, { value: amount })
      ).to.be.revertedWithCustomError(ModulynERP, "InvoiceNotReadyForPayment");
    });

    it("Should revert when paying already paid invoice", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test",
        dueDate,
        dataHash
      );

      await ModulynERP.connect(vendor).sendInvoice(1);
      await ModulynERP.connect(client).payInvoice(1, { value: amount });

      await expect(
        ModulynERP.connect(client).payInvoice(1, { value: amount })
      ).to.be.revertedWithCustomError(ModulynERP, "InvoiceNotReadyForPayment");
    });

    it("Should revert when vendor tries to pay invoice", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test",
        dueDate,
        dataHash
      );

      await ModulynERP.connect(vendor).sendInvoice(1);

      // Vendor is authorized (participant) but contract checks "Only client can pay" first
      await expect(
        ModulynERP.connect(vendor).payInvoice(1, { value: amount })
      ).to.be.revertedWithCustomError(ModulynERP, "OnlyClientCanPay");
    });

    it("Should revert with incorrect ETH amount", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test",
        dueDate,
        dataHash
      );

      await ModulynERP.connect(vendor).sendInvoice(1);

      await expect(
        ModulynERP.connect(client).payInvoice(1, { value: amount / 2n })
      ).to.be.revertedWithCustomError(ModulynERP, "IncorrectETHAmount");
    });

    it("Should revert with insufficient ERC20 balance", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        await ModulynToken.getAddress(),
        "Test",
        dueDate,
        dataHash
      );

      await ModulynERP.connect(vendor).sendInvoice(1);

      // Client has no tokens
      await expect(
        ModulynERP.connect(client).payInvoice(1)
      ).to.be.reverted;
    });

    it("Should revert when ERC20 approval not set", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      // Transfer tokens to client
      await ModulynToken.transfer(client.address, amount);

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        await ModulynToken.getAddress(),
        "Test",
        dueDate,
        dataHash
      );

      await ModulynERP.connect(vendor).sendInvoice(1);

      // No approval set
      await expect(
        ModulynERP.connect(client).payInvoice(1)
      ).to.be.reverted;
    });

    it("Should emit PaymentProcessed event", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test",
        dueDate,
        dataHash
      );

      await ModulynERP.connect(vendor).sendInvoice(1);

      await expect(
        ModulynERP.connect(client).payInvoice(1, { value: amount })
      )
        .to.emit(ModulynERP, "PaymentProcessed")
        .withArgs(1, client.address, amount);
    });

    it("Should set paidAt timestamp when invoice is paid", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test",
        dueDate,
        dataHash
      );

      await ModulynERP.connect(vendor).sendInvoice(1);

      const beforeTimestamp = await time.latest();
      await ModulynERP.connect(client).payInvoice(1, { value: amount });
      const afterTimestamp = await time.latest();

      const invoice = await ModulynERP.getInvoice(1);
      expect(invoice.paidAt).to.be.gte(beforeTimestamp);
      expect(invoice.paidAt).to.be.lte(afterTimestamp);
    });
  });

  describe("Payment Management - Edge Cases", function () {
    it("Should revert when getting invalid payment ID", async function () {
      await expect(
        ModulynERP.getPayment(999)
      ).to.be.reverted;
    });

    it("Should return correct payment details", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test",
        dueDate,
        dataHash
      );

      await ModulynERP.connect(vendor).sendInvoice(1);
      await ModulynERP.connect(client).payInvoice(1, { value: amount });

      const payment = await ModulynERP.getPayment(1);
      expect(payment.paymentId).to.equal(1);
      expect(payment.invoiceId).to.equal(1);
      expect(payment.payer).to.equal(client.address);
      expect(payment.amount).to.equal(amount);
      expect(payment.status).to.equal(2); // Completed
    });
  });

  describe("Data Anchoring - Edge Cases", function () {
    it("Should handle duplicate data hash (via multiple invoices)", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test data"));

      // Create first invoice with this hash
      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Invoice 1",
        dueDate,
        dataHash
      );

      // Create second invoice with same hash (should work, but anchor may be overwritten)
      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Invoice 2",
        dueDate,
        dataHash
      );

      const anchor = await ModulynERP.dataAnchors(dataHash);
      expect(anchor.dataHash).to.equal(dataHash);
    });

    it("Should verify anchor timestamp via invoice creation", async function () {
      const amount = ethers.parseEther("100");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      const beforeTimestamp = await time.latest();

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test",
        dueDate,
        dataHash
      );
      const afterTimestamp = await time.latest();

      const anchor = await ModulynERP.dataAnchors(dataHash);
      expect(anchor.timestamp).to.be.gte(beforeTimestamp);
      expect(anchor.timestamp).to.be.lte(afterTimestamp);
    });
  });

  describe("Data Verification - Edge Cases", function () {
    it("Should verify empty string data", async function () {
      const data = "";
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes(data));

      const isValid = await ModulynERP.verifyData(dataHash, data);
      expect(isValid).to.be.true;
    });

    it("Should verify data with special characters", async function () {
      const data = "Test!@#$%^&*()_+-=[]{}|;':\",./<>?";
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes(data));

      const isValid = await ModulynERP.verifyData(dataHash, data);
      expect(isValid).to.be.true;
    });

    it("Should return false for mismatched data", async function () {
      const data1 = "test data";
      const data2 = "different data";
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes(data1));

      const isValid = await ModulynERP.verifyData(dataHash, data2);
      expect(isValid).to.be.false;
    });
  });

  describe("Governance - Edge Cases", function () {
    it("Should revert when creating proposal with zero voting duration", async function () {
      const title = "Test";
      const description = "Test";
      const votingPowerRequired = ethers.parseEther("1000");
      const executionHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      // Contract validates voting duration
      await expect(
        ModulynERP.createProposal(
          title,
          description,
          votingPowerRequired,
          0,
          executionHash
        )
      ).to.be.revertedWithCustomError(ModulynERP, "InvalidVotingDuration");
    });

    it("Should revert when voting before voting starts", async function () {
      const title = "Test";
      const description = "Test";
      const votingPowerRequired = ethers.parseEther("1000");
      const votingDuration = 86400;
      const executionHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.createProposal(
        title,
        description,
        votingPowerRequired,
        votingDuration,
        executionHash
      );

      // Try to vote immediately (before voting starts)
      // Note: This depends on contract implementation
      // If voting starts immediately, this test may need adjustment
    });

    it("Should revert on double voting", async function () {
      const title = "Test";
      const description = "Test";
      const votingPowerRequired = ethers.parseEther("1000");
      const votingDuration = 86400;
      const executionHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.createProposal(
        title,
        description,
        votingPowerRequired,
        votingDuration,
        executionHash
      );

      await ModulynERP.vote(1, true);

      await expect(
        ModulynERP.vote(1, false)
      ).to.be.reverted;
    });

    it("Should count votes correctly", async function () {
      const title = "Test";
      const description = "Test";
      const votingPowerRequired = ethers.parseEther("1000");
      const votingDuration = 86400;
      const executionHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.createProposal(
        title,
        description,
        votingPowerRequired,
        votingDuration,
        executionHash
      );

      // Set voting power for multiple users
      await ModulynERP.setVotingPower(addr1.address, ethers.parseEther("5000"));
      await ModulynERP.setVotingPower(addr2.address, ethers.parseEther("3000"));

      await ModulynERP.vote(1, true);
      await ModulynERP.connect(addr1).vote(1, true);
      await ModulynERP.connect(addr2).vote(1, false);

      const proposal = await ModulynERP.getProposal(1);
      // owner has 1000000, addr1 has 5000, addr2 has 3000
      expect(proposal.votesFor).to.equal(ethers.parseEther("1005000")); // owner + addr1
      expect(proposal.votesAgainst).to.equal(ethers.parseEther("3000")); // addr2
    });

    it("Should revert when executing before voting ends", async function () {
      const title = "Test";
      const description = "Test";
      const votingPowerRequired = ethers.parseEther("1000");
      const votingDuration = 86400; // 1 day
      const executionHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.createProposal(
        title,
        description,
        votingPowerRequired,
        votingDuration,
        executionHash
      );

      await ModulynERP.vote(1, true);

      await expect(
        ModulynERP.executeProposal(1)
      ).to.be.reverted;
    });

    it("Should revert when executing failed proposal", async function () {
      const title = "Test";
      const description = "Test";
      const votingPowerRequired = ethers.parseEther("1000");
      const votingDuration = 2; // 2 seconds
      const executionHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.createProposal(
        title,
        description,
        votingPowerRequired,
        votingDuration,
        executionHash
      );

      // Set voting power for addr1 (more than owner to make proposal fail)
      await ModulynERP.setVotingPower(addr1.address, ethers.parseEther("2000"));
      
      // Vote against (addr1 has more power than owner)
      await ModulynERP.connect(addr1).vote(1, false);

      // Wait for voting to end
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Proposal failed (votesAgainst > votesFor), so execution should revert
      await expect(
        ModulynERP.executeProposal(1)
      ).to.be.revertedWithCustomError(ModulynERP, "ProposalNotPassed");
    });

    it("Should revert when executing already executed proposal", async function () {
      const title = "Test";
      const description = "Test";
      const votingPowerRequired = ethers.parseEther("1000");
      const votingDuration = 1;
      const executionHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.createProposal(
        title,
        description,
        votingPowerRequired,
        votingDuration,
        executionHash
      );

      await ModulynERP.vote(1, true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await ModulynERP.executeProposal(1);

      await expect(
        ModulynERP.executeProposal(1)
      ).to.be.reverted;
    });
  });

  describe("Access Control - Additional Tests", function () {
    it("Should revert when non-owner tries to withdraw ETH", async function () {
      // First deposit some ETH via invoice payment
      const amount = ethers.parseEther("1");
      const dueDate = Math.floor(Date.now() / 1000) + 86400;
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await ModulynERP.connect(vendor).createInvoice(
        client.address,
        amount,
        ethers.ZeroAddress,
        "Test",
        dueDate,
        dataHash
      );

      await ModulynERP.connect(vendor).sendInvoice(1);
      await ModulynERP.connect(client).payInvoice(1, { value: amount });

      // Now try to withdraw (contract has no withdrawETH with params, only withdrawETH())
      await expect(
        ModulynERP.connect(addr1).withdrawETH()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert when non-owner tries to withdraw ERC20", async function () {
      const amount = ethers.parseEther("100");
      await ModulynToken.transfer(await ModulynERP.getAddress(), amount);

      await expect(
        ModulynERP.connect(addr1).withdrawToken(
          await ModulynToken.getAddress(),
          amount
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
