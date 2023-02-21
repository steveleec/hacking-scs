import { ethers, network } from "hardhat";
import { time, mineUpTo, mine } from "@nomicfoundation/hardhat-network-helpers";

async function main() {
  const CoinFlip = await ethers.getContractFactory("CoinFlip");
  const coinFlip = await CoinFlip.deploy();
  await coinFlip.deployed();

  const HackerCF = await ethers.getContractFactory("HackerCF");
  const hackerCF = await HackerCF.deploy(coinFlip.address);
  await hackerCF.deployed();

  // getting the guess
  var counter = 0;
  while (counter < 10) {
    await hackerCF.attack();
    await network.provider.send("evm_mine");
    counter++;
  }
  console.log(await coinFlip.consecutiveWins());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
