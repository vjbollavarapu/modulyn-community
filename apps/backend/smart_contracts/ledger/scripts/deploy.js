const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting ModulynLedger deployment...");
  
  // Get the contract factory
  const ModulynLedger = await ethers.getContractFactory("ModulynLedger");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    console.warn("⚠️  Warning: Low balance for deployment");
  }
  
  // Deployment parameters
  const deploymentParams = {
    gasLimit: 5000000,
    gasPrice: ethers.utils.parseUnits("20", "gwei"),
  };
  
  console.log("🔧 Deployment parameters:", {
    gasLimit: deploymentParams.gasLimit,
    gasPrice: ethers.utils.formatUnits(deploymentParams.gasPrice, "gwei") + " gwei"
  });
  
  // Deploy the contract
  console.log("⏳ Deploying ModulynLedger contract...");
  const ModulynLedger = await ModulynLedger.deploy(deploymentParams);
  
  console.log("⏳ Waiting for deployment to be mined...");
  await ModulynLedger.deployed();
  
  console.log("✅ ModulynLedger deployed to:", ModulynLedger.address);
  
  // Get deployment transaction details
  const deploymentTx = ModulynLedger.deployTransaction;
  console.log("📊 Deployment transaction hash:", deploymentTx.hash);
  console.log("⛽ Gas used for deployment:", deploymentTx.gasLimit.toString());
  
  // Wait for a few confirmations
  console.log("⏳ Waiting for confirmations...");
  await deploymentTx.wait(3);
  
  // Get contract information
  const contractInfo = {
    address: ModulynLedger.address,
    transactionHash: deploymentTx.hash,
    gasUsed: deploymentTx.gasLimit.toString(),
    deployer: deployer.address,
    network: await ethers.provider.getNetwork(),
    timestamp: new Date().toISOString(),
  };
  
  // Save deployment information
  const deploymentDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(deploymentDir, `${networkName}.json`);
  
  let deployments = {};
  if (fs.existsSync(deploymentFile)) {
    deployments = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  }
  
  deployments.ModulynLedger = contractInfo;
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deployments, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile);
  
  // Verify contract on Etherscan (if not local network)
  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await ModulynLedger.deployTransaction.wait(5); // Wait for more confirmations
      await hre.run("verify:verify", {
        address: ModulynLedger.address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("❌ Contract verification failed:", error.message);
    }
  }
  
  // Test basic contract functionality
  console.log("🧪 Testing basic contract functionality...");
  
  try {
    // Test owner
    const owner = await ModulynLedger.owner();
    console.log("👤 Contract owner:", owner);
    
    // Test gas limit
    const gasLimit = await ModulynLedger.gasLimit();
    console.log("⛽ Gas limit:", gasLimit.toString());
    
    // Test max batch size
    const maxBatchSize = await ModulynLedger.maxBatchSize();
    console.log("📦 Max batch size:", maxBatchSize.toString());
    
    // Test logging fee
    const loggingFee = await ModulynLedger.loggingFee();
    console.log("💰 Logging fee:", ethers.utils.formatEther(loggingFee), "ETH");
    
    console.log("✅ Basic functionality test passed");
  } catch (error) {
    console.log("❌ Basic functionality test failed:", error.message);
  }
  
  // Display deployment summary
  console.log("\n🎉 Deployment Summary:");
  console.log("====================");
  console.log("Contract Address:", ModulynLedger.address);
  console.log("Transaction Hash:", deploymentTx.hash);
  console.log("Network:", networkName);
  console.log("Deployer:", deployer.address);
  console.log("Gas Used:", deploymentTx.gasLimit.toString());
  console.log("Timestamp:", new Date().toISOString());
  
  // Save contract ABI for frontend integration
  const contractArtifact = await ethers.getContractFactory("ModulynLedger");
  const abi = contractArtifact.interface.format(ethers.utils.FormatTypes.json);
  
  const abiFile = path.join(deploymentDir, "ModulynLedger.abi.json");
  fs.writeFileSync(abiFile, abi);
  console.log("📄 Contract ABI saved to:", abiFile);
  
  // Create environment file template
  const envTemplate = `# ModulynLedger Contract Configuration
Modulyn_LEDGER_CONTRACT_ADDRESS=${ModulynLedger.address}
Modulyn_LEDGER_DEPLOYMENT_HASH=${deploymentTx.hash}
Modulyn_LEDGER_NETWORK=${networkName}
Modulyn_LEDGER_DEPLOYER=${deployer.address}
`;
  
  const envFile = path.join(deploymentDir, ".env.template");
  fs.writeFileSync(envFile, envTemplate);
  console.log("📝 Environment template saved to:", envFile);
  
  console.log("\n🚀 Deployment completed successfully!");
  console.log("📋 Next steps:");
  console.log("1. Update your Django settings with the contract address");
  console.log("2. Configure the RPC endpoint for the deployed network");
  console.log("3. Test the contract integration with your ERP system");
  console.log("4. Set up monitoring and alerting for contract events");
}

// Handle deployment errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
