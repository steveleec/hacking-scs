import { ethers } from "hardhat";
var ONE_ETHER = ethers.utils.parseEther("1.0");

async function main2() {
  const Elevator = await ethers.getContractFactory("Elevator");
  const elevator = await Elevator.attach(
    "0xFF7b5286564bbE554F5796d8b8E3029B12B6016E"
  );

  const BuildingSC = await ethers.getContractFactory("BuildingSC");
  const buildingSC = await BuildingSC.deploy(
    elevator.address
  );
  var tx = await buildingSC.deployed();
  await tx.deployTransaction.wait(5);

  var goTotx = await buildingSC.callGoTo(1);
  await goTotx.wait();
  console.log(await elevator.top());
}

async function main() {
  const Elevator = await ethers.getContractFactory("Elevator");
  const elevator = await Elevator.deploy();
  await elevator.deployed();

  const BuildingSC = await ethers.getContractFactory("BuildingSC");
  const buildingSC = await BuildingSC.deploy(elevator.address);
  await buildingSC.deployed();

  await buildingSC.callGoTo(1);
  console.log(await elevator.top());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  // main2()
  //
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
