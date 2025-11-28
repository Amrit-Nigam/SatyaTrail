const hre = require("hardhat");

async function main() {
  console.log("Deploying SatyaTrail contract...");
  
  const SatyaTrail = await hre.ethers.getContractFactory("SatyaTrail");
  const satyaTrail = await SatyaTrail.deploy();

  await satyaTrail.waitForDeployment();

  console.log("SatyaTrail deployed to:", await satyaTrail.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
