const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AssetTokenization", function () {
  let AssetTokenization;
  let owner;
  let recipient1;
  let recipient2;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, recipient1, recipient2, addr1, addr2] = await ethers.getSigners();

    const AssetTokenizationFactory = await ethers.getContractFactory("AssetTokenization");
    AssetTokenization = await AssetTokenizationFactory.deploy();
    await AssetTokenization.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await AssetTokenization.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await AssetTokenization.name()).to.equal("Modulyn Assets");
      expect(await AssetTokenization.symbol()).to.equal("TGA");
    });

    it("Should initialize with valid asset types", async function () {
      expect(await AssetTokenization.validAssetTypes("vehicle")).to.be.true;
      expect(await AssetTokenization.validAssetTypes("equipment")).to.be.true;
      expect(await AssetTokenization.validAssetTypes("facility")).to.be.true;
      expect(await AssetTokenization.validAssetTypes("tool")).to.be.true;
      expect(await AssetTokenization.validAssetTypes("furniture")).to.be.true;
    });

    it("Should initialize with zero total assets", async function () {
      expect(await AssetTokenization.getTotalAssets()).to.equal(0);
    });
  });

  describe("Asset Minting", function () {
    it("Should mint a new asset", async function () {
      const assetType = "vehicle";
      const serialNumber = "VH001";
      const model = "Model X";
      const manufacturer = "Manufacturer Inc";
      const value = ethers.parseEther("50000");
      const purchaseDate = await time.latest();
      const metadataURI = "ipfs://QmHash123";

      await expect(
        AssetTokenization.mintAsset(
          recipient1.address,
          assetType,
          serialNumber,
          model,
          manufacturer,
          value,
          purchaseDate,
          metadataURI
        )
      )
        .to.emit(AssetTokenization, "AssetMinted")
        .withArgs(1, recipient1.address, assetType, value);

      const asset = await AssetTokenization.getAsset(1);
      expect(asset.tokenId).to.equal(1);
      expect(asset.assetType).to.equal(assetType);
      expect(asset.serialNumber).to.equal(serialNumber);
      expect(asset.model).to.equal(model);
      expect(asset.manufacturer).to.equal(manufacturer);
      expect(asset.value).to.equal(value);
      expect(asset.purchaseDate).to.equal(purchaseDate);
      expect(asset.isActive).to.be.true;
      expect(asset.metadataURI).to.equal(metadataURI);

      expect(await AssetTokenization.ownerOf(1)).to.equal(recipient1.address);
      expect(await AssetTokenization.tokenURI(1)).to.equal(metadataURI);
    });

    it("Should revert with invalid recipient address", async function () {
      await expect(
        AssetTokenization.mintAsset(
          ethers.ZeroAddress,
          "vehicle",
          "VH001",
          "Model",
          "Manufacturer",
          ethers.parseEther("1000"),
          await time.latest(),
          "ipfs://hash"
        )
      ).to.be.revertedWithCustomError(AssetTokenization, "InvalidRecipientAddress");
    });

    it("Should revert with zero value", async function () {
      await expect(
        AssetTokenization.mintAsset(
          recipient1.address,
          "vehicle",
          "VH001",
          "Model",
          "Manufacturer",
          0,
          await time.latest(),
          "ipfs://hash"
        )
      ).to.be.revertedWithCustomError(AssetTokenization, "AssetValueMustBeGreaterThanZero");
    });

    it("Should revert with empty serial number", async function () {
      await expect(
        AssetTokenization.mintAsset(
          recipient1.address,
          "vehicle",
          "",
          "Model",
          "Manufacturer",
          ethers.parseEther("1000"),
          await time.latest(),
          "ipfs://hash"
        )
      ).to.be.revertedWithCustomError(AssetTokenization, "SerialNumberRequired");
    });

    it("Should revert with duplicate serial number", async function () {
      const serialNumber = "VH001";
      const purchaseDate = await time.latest();

      await AssetTokenization.mintAsset(
        recipient1.address,
        "vehicle",
        serialNumber,
        "Model",
        "Manufacturer",
        ethers.parseEther("1000"),
        purchaseDate,
        "ipfs://hash"
      );

      await expect(
        AssetTokenization.mintAsset(
          recipient2.address,
          "vehicle",
          serialNumber,
          "Model 2",
          "Manufacturer",
          ethers.parseEther("2000"),
          purchaseDate,
          "ipfs://hash2"
        )
      ).to.be.revertedWithCustomError(AssetTokenization, "SerialNumberAlreadyExists");
    });

    it("Should revert with invalid asset type", async function () {
      await expect(
        AssetTokenization.mintAsset(
          recipient1.address,
          "invalid_type",
          "VH001",
          "Model",
          "Manufacturer",
          ethers.parseEther("1000"),
          await time.latest(),
          "ipfs://hash"
        )
      ).to.be.revertedWithCustomError(AssetTokenization, "InvalidAssetType");
    });

    it("Should revert when non-owner tries to mint", async function () {
      await expect(
        AssetTokenization.connect(addr1).mintAsset(
          recipient1.address,
          "vehicle",
          "VH001",
          "Model",
          "Manufacturer",
          ethers.parseEther("1000"),
          await time.latest(),
          "ipfs://hash"
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should mint different asset types", async function () {
      const purchaseDate = await time.latest();

      await AssetTokenization.mintAsset(
        recipient1.address,
        "vehicle",
        "VH001",
        "Model",
        "Manufacturer",
        ethers.parseEther("1000"),
        purchaseDate,
        "ipfs://hash1"
      );

      await AssetTokenization.mintAsset(
        recipient1.address,
        "equipment",
        "EQ001",
        "Model",
        "Manufacturer",
        ethers.parseEther("2000"),
        purchaseDate,
        "ipfs://hash2"
      );

      await AssetTokenization.mintAsset(
        recipient1.address,
        "facility",
        "FC001",
        "Model",
        "Manufacturer",
        ethers.parseEther("3000"),
        purchaseDate,
        "ipfs://hash3"
      );

      expect(await AssetTokenization.getTotalAssets()).to.equal(3);
    });

    it("Should update serial number to token ID mapping", async function () {
      const serialNumber = "VH001";
      const purchaseDate = await time.latest();

      await AssetTokenization.mintAsset(
        recipient1.address,
        "vehicle",
        serialNumber,
        "Model",
        "Manufacturer",
        ethers.parseEther("1000"),
        purchaseDate,
        "ipfs://hash"
      );

      const tokenId = await AssetTokenization.getAssetBySerialNumber(serialNumber);
      expect(tokenId).to.equal(1);
    });

    it("Should add asset to owner assets list", async function () {
      const purchaseDate = await time.latest();

      await AssetTokenization.mintAsset(
        recipient1.address,
        "vehicle",
        "VH001",
        "Model",
        "Manufacturer",
        ethers.parseEther("1000"),
        purchaseDate,
        "ipfs://hash"
      );

      const ownerAssets = await AssetTokenization.getOwnerAssets(recipient1.address);
      expect(ownerAssets.length).to.equal(1);
      expect(ownerAssets[0]).to.equal(1);
    });
  });

  describe("Asset Transfer", function () {
    let tokenId;
    const value = ethers.parseEther("50000");

    beforeEach(async function () {
      const purchaseDate = await time.latest();
      await AssetTokenization.mintAsset(
        recipient1.address,
        "vehicle",
        "VH001",
        "Model X",
        "Manufacturer",
        value,
        purchaseDate,
        "ipfs://hash"
      );
      tokenId = 1;
    });

    it("Should transfer asset to new owner", async function () {
      await expect(
        AssetTokenization.connect(recipient1).transferAsset(tokenId, recipient2.address)
      )
        .to.emit(AssetTokenization, "AssetTransferred")
        .withArgs(tokenId, recipient1.address, recipient2.address);

      expect(await AssetTokenization.ownerOf(tokenId)).to.equal(recipient2.address);
    });

    it("Should revert with invalid recipient address", async function () {
      await expect(
        AssetTokenization.connect(recipient1).transferAsset(tokenId, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(AssetTokenization, "InvalidRecipientAddress");
    });

    it("Should revert when asset is not active", async function () {
      await AssetTokenization.connect(recipient1).retireAsset(tokenId, "End of life");

      await expect(
        AssetTokenization.connect(recipient1).transferAsset(tokenId, recipient2.address)
      ).to.be.revertedWithCustomError(AssetTokenization, "AssetIsNotActive");
    });

    it("Should revert when not owner", async function () {
      await expect(
        AssetTokenization.connect(addr1).transferAsset(tokenId, recipient2.address)
      ).to.be.revertedWithCustomError(AssetTokenization, "NotAssetOwner");
    });

    it("Should allow owner to transfer", async function () {
      await AssetTokenization.transferAsset(tokenId, recipient2.address);

      expect(await AssetTokenization.ownerOf(tokenId)).to.equal(recipient2.address);
    });

    it("Should update owner assets mapping on transfer", async function () {
      const ownerAssetsBefore = await AssetTokenization.getOwnerAssets(recipient1.address);
      expect(ownerAssetsBefore.length).to.equal(1);

      await AssetTokenization.connect(recipient1).transferAsset(tokenId, recipient2.address);

      const ownerAssetsAfter = await AssetTokenization.getOwnerAssets(recipient1.address);
      expect(ownerAssetsAfter.length).to.equal(0);

      const newOwnerAssets = await AssetTokenization.getOwnerAssets(recipient2.address);
      expect(newOwnerAssets.length).to.equal(1);
      expect(newOwnerAssets[0]).to.equal(tokenId);
    });
  });

  describe("Maintenance Recording", function () {
    let tokenId;

    beforeEach(async function () {
      const purchaseDate = await time.latest();
      await AssetTokenization.mintAsset(
        recipient1.address,
        "vehicle",
        "VH001",
        "Model X",
        "Manufacturer",
        ethers.parseEther("50000"),
        purchaseDate,
        "ipfs://hash"
      );
      tokenId = 1;
    });

    it("Should record maintenance", async function () {
      const description = "Oil change";
      const cost = ethers.parseEther("100");
      const performedBy = "Service Center";
      const location = "123 Main St";

      await expect(
        AssetTokenization.connect(recipient1).recordMaintenance(
          tokenId,
          description,
          cost,
          performedBy,
          location
        )
      )
        .to.emit(AssetTokenization, "MaintenanceRecorded")
        .withArgs(tokenId, (timestamp) => timestamp > 0, description);

      const history = await AssetTokenization.getMaintenanceHistory(tokenId);
      expect(history.length).to.equal(1);
      expect(history[0].description).to.equal(description);
      expect(history[0].cost).to.equal(cost);
      expect(history[0].performedBy).to.equal(performedBy);
      expect(history[0].location).to.equal(location);

      const asset = await AssetTokenization.getAsset(tokenId);
      expect(asset.lastMaintenance).to.be.gt(0);
    });

    it("Should revert when asset doesn't exist", async function () {
      // Contract checks ownerOf() first in onlyAssetOwner modifier, which reverts with ERC721 error
      await expect(
        AssetTokenization.connect(recipient1).recordMaintenance(
          999,
          "Description",
          ethers.parseEther("100"),
          "Service",
          "Location"
        )
      ).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("Should revert when asset is not active", async function () {
      await AssetTokenization.connect(recipient1).retireAsset(tokenId, "End of life");

      await expect(
        AssetTokenization.connect(recipient1).recordMaintenance(
          tokenId,
          "Description",
          ethers.parseEther("100"),
          "Service",
          "Location"
        )
      ).to.be.revertedWithCustomError(AssetTokenization, "AssetIsNotActive");
    });

    it("Should revert when not owner", async function () {
      await expect(
        AssetTokenization.connect(addr1).recordMaintenance(
          tokenId,
          "Description",
          ethers.parseEther("100"),
          "Service",
          "Location"
        )
      ).to.be.revertedWithCustomError(AssetTokenization, "NotAssetOwner");
    });

    it("Should allow owner to record maintenance", async function () {
      await AssetTokenization.recordMaintenance(
        tokenId,
        "Description",
        ethers.parseEther("100"),
        "Service",
        "Location"
      );

      const history = await AssetTokenization.getMaintenanceHistory(tokenId);
      expect(history.length).to.equal(1);
    });

    it("Should record multiple maintenance entries", async function () {
      await AssetTokenization.connect(recipient1).recordMaintenance(
        tokenId,
        "Maintenance 1",
        ethers.parseEther("100"),
        "Service 1",
        "Location 1"
      );

      await AssetTokenization.connect(recipient1).recordMaintenance(
        tokenId,
        "Maintenance 2",
        ethers.parseEther("200"),
        "Service 2",
        "Location 2"
      );

      const history = await AssetTokenization.getMaintenanceHistory(tokenId);
      expect(history.length).to.equal(2);
    });
  });

  describe("Asset Value Update", function () {
    let tokenId;
    const initialValue = ethers.parseEther("50000");

    beforeEach(async function () {
      const purchaseDate = await time.latest();
      await AssetTokenization.mintAsset(
        recipient1.address,
        "vehicle",
        "VH001",
        "Model X",
        "Manufacturer",
        initialValue,
        purchaseDate,
        "ipfs://hash"
      );
      tokenId = 1;
    });

    it("Should update asset value", async function () {
      const newValue = ethers.parseEther("45000");

      await expect(
        AssetTokenization.connect(recipient1).updateAssetValue(tokenId, newValue)
      )
        .to.emit(AssetTokenization, "AssetValueUpdated")
        .withArgs(tokenId, initialValue, newValue);

      const asset = await AssetTokenization.getAsset(tokenId);
      expect(asset.value).to.equal(newValue);
    });

    it("Should revert with zero value", async function () {
      await expect(
        AssetTokenization.connect(recipient1).updateAssetValue(tokenId, 0)
      ).to.be.revertedWithCustomError(AssetTokenization, "AssetValueMustBeGreaterThanZero");
    });

    it("Should revert when asset doesn't exist", async function () {
      // Contract checks ownerOf() first in onlyAssetOwner modifier
      await expect(
        AssetTokenization.connect(recipient1).updateAssetValue(999, ethers.parseEther("1000"))
      ).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("Should revert when not owner", async function () {
      await expect(
        AssetTokenization.connect(addr1).updateAssetValue(tokenId, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(AssetTokenization, "NotAssetOwner");
    });

    it("Should allow owner to update value", async function () {
      const newValue = ethers.parseEther("60000");

      await AssetTokenization.updateAssetValue(tokenId, newValue);

      const asset = await AssetTokenization.getAsset(tokenId);
      expect(asset.value).to.equal(newValue);
    });
  });

  describe("Asset Retirement", function () {
    let tokenId;

    beforeEach(async function () {
      const purchaseDate = await time.latest();
      await AssetTokenization.mintAsset(
        recipient1.address,
        "vehicle",
        "VH001",
        "Model X",
        "Manufacturer",
        ethers.parseEther("50000"),
        purchaseDate,
        "ipfs://hash"
      );
      tokenId = 1;
    });

    it("Should retire asset", async function () {
      const reason = "End of useful life";

      await expect(
        AssetTokenization.connect(recipient1).retireAsset(tokenId, reason)
      )
        .to.emit(AssetTokenization, "AssetRetired")
        .withArgs(tokenId, reason);

      const asset = await AssetTokenization.getAsset(tokenId);
      expect(asset.isActive).to.be.false;
    });

    it("Should revert when asset doesn't exist", async function () {
      // Contract checks ownerOf() first in onlyAssetOwner modifier
      await expect(
        AssetTokenization.connect(recipient1).retireAsset(999, "Reason")
      ).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("Should revert when asset already retired", async function () {
      await AssetTokenization.connect(recipient1).retireAsset(tokenId, "Reason 1");

      await expect(
        AssetTokenization.connect(recipient1).retireAsset(tokenId, "Reason 2")
      ).to.be.revertedWithCustomError(AssetTokenization, "AssetAlreadyRetired");
    });

    it("Should revert when not owner", async function () {
      await expect(
        AssetTokenization.connect(addr1).retireAsset(tokenId, "Reason")
      ).to.be.revertedWithCustomError(AssetTokenization, "NotAssetOwner");
    });

    it("Should allow owner to retire asset", async function () {
      await AssetTokenization.retireAsset(tokenId, "Reason");

      const asset = await AssetTokenization.getAsset(tokenId);
      expect(asset.isActive).to.be.false;
    });
  });

  describe("Admin Functions", function () {
    it("Should add new asset type", async function () {
      await AssetTokenization.addAssetType("computer");

      expect(await AssetTokenization.validAssetTypes("computer")).to.be.true;
    });

    it("Should revert when non-owner tries to add asset type", async function () {
      await expect(
        AssetTokenization.connect(addr1).addAssetType("computer")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should remove asset type", async function () {
      expect(await AssetTokenization.validAssetTypes("vehicle")).to.be.true;

      await AssetTokenization.removeAssetType("vehicle");

      expect(await AssetTokenization.validAssetTypes("vehicle")).to.be.false;
    });

    it("Should revert when non-owner tries to remove asset type", async function () {
      await expect(
        AssetTokenization.connect(addr1).removeAssetType("vehicle")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const purchaseDate = await time.latest();

      await AssetTokenization.mintAsset(
        recipient1.address,
        "vehicle",
        "VH001",
        "Model X",
        "Manufacturer",
        ethers.parseEther("50000"),
        purchaseDate,
        "ipfs://hash1"
      );

      await AssetTokenization.mintAsset(
        recipient1.address,
        "equipment",
        "EQ001",
        "Model Y",
        "Manufacturer",
        ethers.parseEther("30000"),
        purchaseDate,
        "ipfs://hash2"
      );
    });

    it("Should return correct asset details", async function () {
      const asset = await AssetTokenization.getAsset(1);
      expect(asset.tokenId).to.equal(1);
      expect(asset.assetType).to.equal("vehicle");
      expect(asset.serialNumber).to.equal("VH001");
      expect(asset.model).to.equal("Model X");
      expect(asset.manufacturer).to.equal("Manufacturer");
      expect(asset.value).to.equal(ethers.parseEther("50000"));
      expect(asset.isActive).to.be.true;
    });

    it("Should revert when getting non-existent asset", async function () {
      await expect(
        AssetTokenization.getAsset(999)
      ).to.be.revertedWithCustomError(AssetTokenization, "AssetDoesNotExist");
    });

    it("Should return maintenance history", async function () {
      await AssetTokenization.connect(recipient1).recordMaintenance(
        1,
        "Maintenance",
        ethers.parseEther("100"),
        "Service",
        "Location"
      );

      const history = await AssetTokenization.getMaintenanceHistory(1);
      expect(history.length).to.equal(1);
    });

    it("Should return empty maintenance history for new asset", async function () {
      const history = await AssetTokenization.getMaintenanceHistory(1);
      expect(history.length).to.equal(0);
    });

    it("Should return owner assets", async function () {
      const ownerAssets = await AssetTokenization.getOwnerAssets(recipient1.address);
      expect(ownerAssets.length).to.equal(2);
      expect(ownerAssets[0]).to.equal(1);
      expect(ownerAssets[1]).to.equal(2);
    });

    it("Should return empty array for address with no assets", async function () {
      const ownerAssets = await AssetTokenization.getOwnerAssets(addr1.address);
      expect(ownerAssets.length).to.equal(0);
    });

    it("Should return asset by serial number", async function () {
      const tokenId = await AssetTokenization.getAssetBySerialNumber("VH001");
      expect(tokenId).to.equal(1);
    });

    it("Should return zero for non-existent serial number", async function () {
      const tokenId = await AssetTokenization.getAssetBySerialNumber("NONEXISTENT");
      expect(tokenId).to.equal(0);
    });

    it("Should return total assets count", async function () {
      expect(await AssetTokenization.getTotalAssets()).to.equal(2);
    });

    it("Should return active assets count", async function () {
      expect(await AssetTokenization.getActiveAssetsCount()).to.equal(2);

      await AssetTokenization.connect(recipient1).retireAsset(1, "Reason");

      expect(await AssetTokenization.getActiveAssetsCount()).to.equal(1);
    });

    it("Should return total assets value", async function () {
      const totalValue = await AssetTokenization.getTotalAssetsValue();
      expect(totalValue).to.equal(ethers.parseEther("80000")); // 50000 + 30000

      await AssetTokenization.connect(recipient1).retireAsset(1, "Reason");

      const newTotalValue = await AssetTokenization.getTotalAssetsValue();
      expect(newTotalValue).to.equal(ethers.parseEther("30000")); // Only active asset
    });
  });

  describe("ERC721 Functions", function () {
    beforeEach(async function () {
      const purchaseDate = await time.latest();
      await AssetTokenization.mintAsset(
        recipient1.address,
        "vehicle",
        "VH001",
        "Model X",
        "Manufacturer",
        ethers.parseEther("50000"),
        purchaseDate,
        "ipfs://hash"
      );
    });

    it("Should return correct token URI", async function () {
      const uri = await AssetTokenization.tokenURI(1);
      expect(uri).to.equal("ipfs://hash");
    });

    it("Should support ERC721 interface", async function () {
      const interfaceId = "0x80ac58cd"; // ERC721 interface ID
      expect(await AssetTokenization.supportsInterface(interfaceId)).to.be.true;
    });

    it("Should support ERC721Metadata interface", async function () {
      const interfaceId = "0x5b5e139f"; // ERC721Metadata interface ID
      expect(await AssetTokenization.supportsInterface(interfaceId)).to.be.true;
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle multiple assets correctly", async function () {
      const purchaseDate = await time.latest();

      for (let i = 1; i <= 5; i++) {
        await AssetTokenization.mintAsset(
          recipient1.address,
          "vehicle",
          `VH00${i}`,
          `Model ${i}`,
          "Manufacturer",
          ethers.parseEther("10000"),
          purchaseDate,
          `ipfs://hash${i}`
        );
      }

      expect(await AssetTokenization.getTotalAssets()).to.equal(5);
      expect(await AssetTokenization.getActiveAssetsCount()).to.equal(5);

      const ownerAssets = await AssetTokenization.getOwnerAssets(recipient1.address);
      expect(ownerAssets.length).to.equal(5);
    });

    it("Should handle asset transfer and retirement correctly", async function () {
      const purchaseDate = await time.latest();

      await AssetTokenization.mintAsset(
        recipient1.address,
        "vehicle",
        "VH001",
        "Model X",
        "Manufacturer",
        ethers.parseEther("50000"),
        purchaseDate,
        "ipfs://hash"
      );

      // Transfer
      await AssetTokenization.connect(recipient1).transferAsset(1, recipient2.address);

      // New owner can record maintenance
      await AssetTokenization.connect(recipient2).recordMaintenance(
        1,
        "Maintenance",
        ethers.parseEther("100"),
        "Service",
        "Location"
      );

      // New owner can retire
      await AssetTokenization.connect(recipient2).retireAsset(1, "Reason");

      const asset = await AssetTokenization.getAsset(1);
      expect(asset.isActive).to.be.false;
      expect(await AssetTokenization.ownerOf(1)).to.equal(recipient2.address);
    });

    it("Should maintain correct counts after retirement", async function () {
      const purchaseDate = await time.latest();

      await AssetTokenization.mintAsset(
        recipient1.address,
        "vehicle",
        "VH001",
        "Model X",
        "Manufacturer",
        ethers.parseEther("50000"),
        purchaseDate,
        "ipfs://hash1"
      );

      await AssetTokenization.mintAsset(
        recipient1.address,
        "equipment",
        "EQ001",
        "Model Y",
        "Manufacturer",
        ethers.parseEther("30000"),
        purchaseDate,
        "ipfs://hash2"
      );

      expect(await AssetTokenization.getTotalAssets()).to.equal(2);
      expect(await AssetTokenization.getActiveAssetsCount()).to.equal(2);
      expect(await AssetTokenization.getTotalAssetsValue()).to.equal(ethers.parseEther("80000"));

      await AssetTokenization.connect(recipient1).retireAsset(1, "Reason");

      expect(await AssetTokenization.getTotalAssets()).to.equal(2); // Total unchanged
      expect(await AssetTokenization.getActiveAssetsCount()).to.equal(1); // Active decreased
      expect(await AssetTokenization.getTotalAssetsValue()).to.equal(ethers.parseEther("30000")); // Value decreased
    });
  });
});
