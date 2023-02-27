import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const TokenBankChallenge = await ethers.getContractFactory(
    "TokenBankChallenge"
  );
  const tokenBankChallenge = await TokenBankChallenge.deploy(owner.address);
  await tokenBankChallenge.deployed();

  console.log(await tokenBankChallenge.isComplete());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  //
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
