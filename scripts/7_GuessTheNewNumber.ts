import { ethers } from "hardhat";

async function main() {
    const GuessTheNewNumberChallenge = await ethers.getContractFactory(
        "GuessTheNewNumberChallenge"
    );
    const guessTheNewNumberChallenge = await GuessTheNewNumberChallenge.deploy({
        value: ethers.utils.parseEther("1.0"),
    });
    await guessTheNewNumberChallenge.deployed();

    const GuessTheNewNumberAttacker = await ethers.getContractFactory(
        "GuessTheNewNumberAttacker"
    );
    const guessTheNewNumberAttacker = await GuessTheNewNumberAttacker.deploy(
        guessTheNewNumberChallenge.address
    );
    await guessTheNewNumberAttacker.deployed();

    await guessTheNewNumberAttacker.attack({
        value: ethers.utils.parseEther("1.0"),
    });

    console.log(await guessTheNewNumberChallenge.isComplete())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
