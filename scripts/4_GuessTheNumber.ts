import { ethers } from "hardhat";

async function main() {
  const GuessTheNumberChallenge = await ethers.getContractFactory(
    "GuessTheNumberChallenge"
  );
  const guessTheNumberChallenge = await GuessTheNumberChallenge.deploy({
    value: ethers.utils.parseEther("1.0"),
  });
  await guessTheNumberChallenge.deployed();

  var answer = 42;
  await guessTheNumberChallenge.guess(answer, {
    value: ethers.utils.parseEther("1.0"),
  });

  console.log(await guessTheNumberChallenge.isComplete())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
