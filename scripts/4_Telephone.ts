import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  const Telephone = await ethers.getContractFactory("Telephone");
  const telephone = await Telephone.deploy();
  await telephone.deployed();

  // Deploying the 'Hacker' contract
  const Hacker = await ethers.getContractFactory("Hacker");
  const hacker = await Hacker.deploy(telephone.address);
  await hacker.deployed();

  // performing the attack
  await hacker.attack();

  // checking if the attack was successful
  console.log(
    "Did the attack succeed?",
    (await telephone.owner()) == deployer.address
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
