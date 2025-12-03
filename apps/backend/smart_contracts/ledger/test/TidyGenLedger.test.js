const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ModulynLedger", function () {
  let ModulynLedger;
  let owner;
  let organization1;
  let organization2;
  let unauthorizedUser;
  
  const TRANSACTION_TYPE = "invoice";
  const SOURCE_MODULE = "finance";
  const SOURCE_ID = "INV-001";
  const TRANSACTION_HASH = "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456";
  
  beforeEach(async function () {
    // Get signers
    [owner, organization1, organization2, unauthorizedUser] = await ethers.getSigners();
    
    // Deploy contract
    const ModulynLedger = await ethers.getContractFactory("ModulynLedger");
    ModulynLedger = await ModulynLedger.deploy();
    await ModulynLedger.deployed();
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await ModulynLedger.owner()).to.equal(owner.address);
    });
    
    it("Should have correct initial values", async function () {
      expect(await ModulynLedger.gasLimit()).to.equal(1000000);
      expect(await ModulynLedger.maxBatchSize()).to.equal(100);
      expect(await ModulynLedger.loggingFee()).to.equal(0);
    });
    
    it("Should have zero initial transaction count", async function () {
      expect(await ModulynLedger.getTotalTransactionCount()).to.equal(0);
    });
  });
  
  describe("Transaction Logging", function () {
    it("Should log a single transaction", async function () {
      const tx = await ModulynLedger.logTransaction(
        TRANSACTION_TYPE,
        SOURCE_MODULE,
        SOURCE_ID,
        TRANSACTION_HASH,
        organization1.address,
        { value: await ModulynLedger.loggingFee() }
      );
      
      await expect(tx)
        .to.emit(ModulynLedger, "TransactionLogged")
        .withArgs(
          await ModulynLedger.transactions(0), // First transaction ID
          TRANSACTION_TYPE,
          organization1.address,
          SOURCE_MODULE,
          SOURCE_ID,
          TRANSACTION_HASH,
          await time.latest()
        );
      
      expect(await ModulynLedger.getTotalTransactionCount()).to.equal(1);
    });
    
    it("Should not allow duplicate transactions", async function () {
      // Log first transaction
      await ModulynLedger.logTransaction(
        TRANSACTION_TYPE,
        SOURCE_MODULE,
        SOURCE_ID,
        TRANSACTION_HASH,
        organization1.address,
        { value: await ModulynLedger.loggingFee() }
      );
      
      // Try to log duplicate transaction
      await expect(
        ModulynLedger.logTransaction(
          TRANSACTION_TYPE,
          SOURCE_MODULE,
          SOURCE_ID,
          TRANSACTION_HASH,
          organization1.address,
          { value: await ModulynLedger.loggingFee() }
        )
      ).to.be.revertedWith("Transaction already exists");
    });
    
    it("Should require sufficient fee payment", async function () {
      await ModulynLedger.updateLoggingFee(ethers.utils.parseEther("0.001"));
      
      await expect(
        ModulynLedger.logTransaction(
          TRANSACTION_TYPE,
          SOURCE_MODULE,
          SOURCE_ID,
          TRANSACTION_HASH,
          organization1.address,
          { value: ethers.utils.parseEther("0.0005") } // Insufficient fee
        )
      ).to.be.revertedWith("Insufficient fee payment");
    });
    
    it("Should only allow authorized callers", async function () {
      await expect(
        ModulynLedger.connect(unauthorizedUser).logTransaction(
          TRANSACTION_TYPE,
          SOURCE_MODULE,
          SOURCE_ID,
          TRANSACTION_HASH,
          organization1.address,
          { value: await ModulynLedger.loggingFee() }
        )
      ).to.be.revertedWith("Not authorized for this organization");
    });
  });
  
  describe("Batch Logging", function () {
    it("Should log multiple transactions in a batch", async function () {
      const transactionTypes = ["invoice", "payment", "expense"];
      const sourceModules = ["finance", "finance", "finance"];
      const sourceIds = ["INV-001", "PAY-001", "EXP-001"];
      const hashes = [
        "hash1",
        "hash2", 
        "hash3"
      ];
      
      const tx = await ModulynLedger.logBatch(
        transactionTypes,
        sourceModules,
        sourceIds,
        hashes,
        organization1.address,
        { value: (await ModulynLedger.loggingFee()).mul(3) }
      );
      
      await expect(tx)
        .to.emit(ModulynLedger, "BatchLogged")
        .withArgs(
          await ModulynLedger.batches(0), // First batch ID
          organization1.address,
          await ModulynLedger.getOrganizationTransactions(organization1.address),
          await time.latest()
        );
      
      expect(await ModulynLedger.getTotalTransactionCount()).to.equal(3);
      expect(await ModulynLedger.getTotalBatchCount()).to.equal(1);
    });
    
    it("Should not allow empty batch", async function () {
      await expect(
        ModulynLedger.logBatch(
          [],
          [],
          [],
          [],
          organization1.address,
          { value: 0 }
        )
      ).to.be.revertedWith("Empty transaction array");
    });
    
    it("Should not allow batch exceeding max size", async function () {
      const largeArray = new Array(101).fill("test");
      
      await expect(
        ModulynLedger.logBatch(
          largeArray,
          largeArray,
          largeArray,
          largeArray,
          organization1.address,
          { value: (await ModulynLedger.loggingFee()).mul(101) }
        )
      ).to.be.revertedWith("Batch size exceeds limit");
    });
    
    it("Should require array length consistency", async function () {
      await expect(
        ModulynLedger.logBatch(
          ["invoice", "payment"],
          ["finance"],
          ["INV-001", "PAY-001"],
          ["hash1", "hash2"],
          organization1.address,
          { value: (await ModulynLedger.loggingFee()).mul(2) }
        )
      ).to.be.revertedWith("Array length mismatch");
    });
  });
  
  describe("Transaction Verification", function () {
    let transactionId;
    
    beforeEach(async function () {
      const tx = await ModulynLedger.logTransaction(
        TRANSACTION_TYPE,
        SOURCE_MODULE,
        SOURCE_ID,
        TRANSACTION_HASH,
        organization1.address,
        { value: await ModulynLedger.loggingFee() }
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "TransactionLogged");
      transactionId = event.args.transactionId;
    });
    
    it("Should verify correct transaction hash", async function () {
      const isValid = await ModulynLedger.verifyTransaction(transactionId, TRANSACTION_HASH);
      expect(isValid).to.be.true;
    });
    
    it("Should reject incorrect transaction hash", async function () {
      const isValid = await ModulynLedger.verifyTransaction(transactionId, "wrong_hash");
      expect(isValid).to.be.false;
    });
    
    it("Should mark transaction as verified", async function () {
      const tx = await ModulynLedger.markTransactionVerified(transactionId);
      
      await expect(tx)
        .to.emit(ModulynLedger, "TransactionVerified")
        .withArgs(transactionId, true, await time.latest());
      
      const transaction = await ModulynLedger.getTransaction(transactionId);
      expect(transaction.verified).to.be.true;
    });
    
    it("Should only allow owner to mark as verified", async function () {
      await expect(
        ModulynLedger.connect(organization1).markTransactionVerified(transactionId)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
  
  describe("Batch Verification", function () {
    let batchId;
    
    beforeEach(async function () {
      const transactionTypes = ["invoice", "payment"];
      const sourceModules = ["finance", "finance"];
      const sourceIds = ["INV-001", "PAY-001"];
      const hashes = ["hash1", "hash2"];
      
      const tx = await ModulynLedger.logBatch(
        transactionTypes,
        sourceModules,
        sourceIds,
        hashes,
        organization1.address,
        { value: (await ModulynLedger.loggingFee()).mul(2) }
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "BatchLogged");
      batchId = event.args.batchId;
    });
    
    it("Should mark batch as verified", async function () {
      const tx = await ModulynLedger.markBatchVerified(batchId);
      
      await expect(tx)
        .to.emit(ModulynLedger, "BatchVerified")
        .withArgs(batchId, true, await time.latest());
      
      const batch = await ModulynLedger.getBatch(batchId);
      expect(batch.verified).to.be.true;
    });
    
    it("Should mark all transactions in batch as verified", async function () {
      await ModulynLedger.markBatchVerified(batchId);
      
      const batch = await ModulynLedger.getBatch(batchId);
      for (let i = 0; i < batch.transactionIds.length; i++) {
        const transaction = await ModulynLedger.getTransaction(batch.transactionIds[i]);
        expect(transaction.verified).to.be.true;
      }
    });
  });
  
  describe("View Functions", function () {
    beforeEach(async function () {
      // Log some test transactions
      await ModulynLedger.logTransaction(
        "invoice",
        "finance",
        "INV-001",
        "hash1",
        organization1.address,
        { value: await ModulynLedger.loggingFee() }
      );
      
      await ModulynLedger.logTransaction(
        "payment",
        "finance", 
        "PAY-001",
        "hash2",
        organization2.address,
        { value: await ModulynLedger.loggingFee() }
      );
    });
    
    it("Should return correct transaction details", async function () {
      const transactionId = await ModulynLedger.allTransactionIds(0);
      const transaction = await ModulynLedger.getTransaction(transactionId);
      
      expect(transaction.transactionType).to.equal("invoice");
      expect(transaction.sourceModule).to.equal("finance");
      expect(transaction.sourceId).to.equal("INV-001");
      expect(transaction.hash).to.equal("hash1");
      expect(transaction.organization).to.equal(organization1.address);
    });
    
    it("Should return organization transactions", async function () {
      const org1Transactions = await ModulynLedger.getOrganizationTransactions(organization1.address);
      const org2Transactions = await ModulynLedger.getOrganizationTransactions(organization2.address);
      
      expect(org1Transactions.length).to.equal(1);
      expect(org2Transactions.length).to.equal(1);
    });
    
    it("Should check transaction existence", async function () {
      const transactionId = await ModulynLedger.allTransactionIds(0);
      const exists = await ModulynLedger.transactionExists(transactionId);
      
      expect(exists).to.be.true;
    });
    
    it("Should return false for non-existent transaction", async function () {
      const fakeId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("fake"));
      const exists = await ModulynLedger.transactionExists(fakeId);
      
      expect(exists).to.be.false;
    });
  });
  
  describe("Admin Functions", function () {
    it("Should update gas limit", async function () {
      const newGasLimit = 2000000;
      
      await expect(ModulynLedger.updateGasLimit(newGasLimit))
        .to.emit(ModulynLedger, "GasLimitUpdated")
        .withArgs(1000000, newGasLimit);
      
      expect(await ModulynLedger.gasLimit()).to.equal(newGasLimit);
    });
    
    it("Should update max batch size", async function () {
      const newMaxBatchSize = 200;
      
      await expect(ModulynLedger.updateMaxBatchSize(newMaxBatchSize))
        .to.emit(ModulynLedger, "MaxBatchSizeUpdated")
        .withArgs(100, newMaxBatchSize);
      
      expect(await ModulynLedger.maxBatchSize()).to.equal(newMaxBatchSize);
    });
    
    it("Should update logging fee", async function () {
      const newFee = ethers.utils.parseEther("0.001");
      
      await expect(ModulynLedger.updateLoggingFee(newFee))
        .to.emit(ModulynLedger, "LoggingFeeUpdated")
        .withArgs(0, newFee);
      
      expect(await ModulynLedger.loggingFee()).to.equal(newFee);
    });
    
    it("Should pause and unpause contract", async function () {
      await ModulynLedger.pause();
      expect(await ModulynLedger.paused()).to.be.true;
      
      await expect(
        ModulynLedger.logTransaction(
          TRANSACTION_TYPE,
          SOURCE_MODULE,
          SOURCE_ID,
          TRANSACTION_HASH,
          organization1.address,
          { value: await ModulynLedger.loggingFee() }
        )
      ).to.be.revertedWith("Pausable: paused");
      
      await ModulynLedger.unpause();
      expect(await ModulynLedger.paused()).to.be.false;
    });
    
    it("Should only allow owner to call admin functions", async function () {
      await expect(
        ModulynLedger.connect(organization1).updateGasLimit(2000000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      
      await expect(
        ModulynLedger.connect(organization1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
  
  describe("Audit Events", function () {
    it("Should create audit events for transactions", async function () {
      const tx = await ModulynLedger.logTransaction(
        TRANSACTION_TYPE,
        SOURCE_MODULE,
        SOURCE_ID,
        TRANSACTION_HASH,
        organization1.address,
        { value: await ModulynLedger.loggingFee() }
      );
      
      await expect(tx)
        .to.emit(ModulynLedger, "AuditEventCreated");
      
      expect(await ModulynLedger.getTotalEventCount()).to.equal(1);
    });
    
    it("Should return transaction events", async function () {
      const tx = await ModulynLedger.logTransaction(
        TRANSACTION_TYPE,
        SOURCE_MODULE,
        SOURCE_ID,
        TRANSACTION_HASH,
        organization1.address,
        { value: await ModulynLedger.loggingFee() }
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "TransactionLogged");
      const transactionId = event.args.transactionId;
      
      const events = await ModulynLedger.getTransactionEvents(transactionId);
      expect(events.length).to.be.greaterThan(0);
    });
  });
  
  describe("Withdrawal", function () {
    it("Should allow owner to withdraw contract balance", async function () {
      // Send some ETH to contract
      await organization1.sendTransaction({
        to: ModulynLedger.address,
        value: ethers.utils.parseEther("1.0")
      });
      
      const initialBalance = await owner.getBalance();
      await ModulynLedger.withdraw();
      const finalBalance = await owner.getBalance();
      
      expect(finalBalance).to.be.gt(initialBalance);
    });
    
    it("Should not allow non-owner to withdraw", async function () {
      await expect(
        ModulynLedger.connect(organization1).withdraw()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
  
  describe("Edge Cases", function () {
    it("Should handle zero fee correctly", async function () {
      await ModulynLedger.updateLoggingFee(0);
      
      await expect(
        ModulynLedger.logTransaction(
          TRANSACTION_TYPE,
          SOURCE_MODULE,
          SOURCE_ID,
          TRANSACTION_HASH,
          organization1.address,
          { value: 0 }
        )
      ).to.not.be.reverted;
    });
    
    it("Should handle maximum batch size", async function () {
      const maxSize = await ModulynLedger.maxBatchSize();
      const largeArray = new Array(maxSize.toNumber()).fill("test");
      
      await expect(
        ModulynLedger.logBatch(
          largeArray,
          largeArray,
          largeArray,
          largeArray,
          organization1.address,
          { value: (await ModulynLedger.loggingFee()).mul(maxSize) }
        )
      ).to.not.be.reverted;
    });
  });
});