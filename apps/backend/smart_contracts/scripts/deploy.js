const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Modulyn Smart Contracts Deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy ModulynToken
  console.log("\n📝 Deploying ModulynToken...");
  const ModulynToken = await ethers.getContractFactory("ModulynToken");
  const token = await ModulynToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ ModulynToken deployed to:", tokenAddress);

  // Deploy ModulynDAO
  console.log("\n🏛️ Deploying ModulynDAO...");
  const ModulynDAO = await ethers.getContractFactory("ModulynDAO");
  const dao = await ModulynDAO.deploy(tokenAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("✅ ModulynDAO deployed to:", daoAddress);

  // Deploy ModulynERP
  console.log("\n🏢 Deploying ModulynERP...");
  const ModulynERP = await ethers.getContractFactory("ModulynERP");
  const erp = await ModulynERP.deploy();
  await erp.waitForDeployment();
  const erpAddress = await erp.getAddress();
  console.log("✅ ModulynERP deployed to:", erpAddress);

  // Set up initial token distribution
  console.log("\n💰 Setting up initial token distribution...");
  
  // Set voting power for deployer
  await dao.setVotingPower(deployer.address, ethers.parseEther("1000000")); // 1M tokens voting power
  console.log("✅ Set voting power for deployer");

  // Transfer some tokens to DAO treasury
  await token.transfer(daoAddress, ethers.parseEther("10000000")); // 10M tokens to treasury
  console.log("✅ Transferred tokens to DAO treasury");

  // Verify deployments
  console.log("\n🔍 Verifying deployments...");
  
  const tokenName = await token.name();
  const tokenSymbol = await token.symbol();
  const tokenTotalSupply = await token.totalSupply();
  
  console.log(`Token: ${tokenName} (${tokenSymbol})`);
  console.log(`Total Supply: ${ethers.formatEther(tokenTotalSupply)} ${tokenSymbol}`);
  
  const daoStats = await dao.getDAOStats();
  console.log(`DAO Proposals: ${daoStats[0]}`);
  
  const erpStats = await erp.getStats();
  console.log(`ERP Invoices: ${erpStats[0]}`);
  console.log(`ERP Payments: ${erpStats[1]}`);

  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    contracts: {
      ModulynToken: {
        address: tokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        totalSupply: ethers.formatEther(tokenTotalSupply)
      },
      ModulynDAO: {
        address: daoAddress
      },
      ModulynERP: {
        address: erpAddress
      }
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n📋 Deployment Summary:");
  console.log("====================");
  console.log(`Network: ${deploymentInfo.network.name} (Chain ID: ${deploymentInfo.network.chainId})`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`ModulynToken: ${deploymentInfo.contracts.ModulynToken.address}`);
  console.log(`ModulynDAO: ${deploymentInfo.contracts.ModulynDAO.address}`);
  console.log(`ModulynERP: ${deploymentInfo.contracts.ModulynERP.address}`);
  console.log(`Deployment Time: ${deploymentInfo.timestamp}`);

  // Write deployment info to file
  const fs = require('fs');
  const path = require('path');
  
  const deploymentDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  const networkName = deploymentInfo.network.name;
  const deploymentFile = path.join(deploymentDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📖 Next Steps:");
  console.log("1. Verify contracts on block explorer (if on testnet/mainnet)");
  console.log("2. Update frontend configuration with contract addresses");
  console.log("3. Test contract functionality");
  console.log("4. Deploy to additional networks as needed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
