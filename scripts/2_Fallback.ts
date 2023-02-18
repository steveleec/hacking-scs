import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  const Fallback = await ethers.getContractFactory("Fallback");
  const fallback = await Fallback.deploy();
  await fallback.deployed();

  await fallback.contribute({ value: ethers.utils.parseEther("0.0001") });

  await deployer.sendTransaction({
    to: fallback.address,
    value: ethers.utils.parseEther("0.0001"),
  })

  await fallback.withdraw();

  console.log("Balance:", await ethers.provider.getBalance(fallback.address));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
