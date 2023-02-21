import { ethers } from "hardhat";

async function main2() {
  const Shop = await ethers.getContractFactory("Shop");
  const shop = await Shop.attach("0x9c3Faa39E75d90031D0725637f63Cc8f6557EB24");

  const BuyerSC = await ethers.getContractFactory("BuyerSC");
  const buyerSC = await BuyerSC.deploy(shop.address);
  var tx = await buyerSC.deployed();
  await tx.deployTransaction.wait(5);

  var goTotx = await buyerSC.callBuy();
  await goTotx.wait();
  console.log(await shop.isSold());
}

async function main() {
  const Shop = await ethers.getContractFactory("Shop");
  const shop = await Shop.deploy();
  await shop.deployed();

  const BuyerSC = await ethers.getContractFactory("BuyerSC");
  const buyerSC = await BuyerSC.deploy(shop.address);
  await buyerSC.deployed();

  await buyerSC.callBuy();
  console.log(await shop.isSold());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
// main()
main2()
  //
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
