import { ethers } from "hardhat";

async function main() {
  var password = "password";
  const HelloEthernaut = await ethers.getContractFactory("HelloEthernaut");
  const helloEthernaut = await HelloEthernaut.deploy(password);
  await helloEthernaut.deployed();

  console.log(await helloEthernaut.info())
  // You will find what you need in info1().

  console.log(await helloEthernaut.info1())
  // Try info2(), but with "hello" as a parameter.

  console.log(await helloEthernaut.info2("hello"))
  // The property infoNum holds the number of the next info method to call.

  console.log(await helloEthernaut.infoNum())
  // 42

  console.log(await helloEthernaut.info42())
  // theMethodName is the name of the next method.

  console.log(await helloEthernaut.theMethodName())
  // The method name is method7123949.

  console.log(await helloEthernaut.method7123949())
  // If you know the password, submit it to authenticate().

  var passSC = await helloEthernaut.password();
  await helloEthernaut.authenticate(passSC);

  console.log("Is Smart Contract cleared?", await helloEthernaut.getCleared())
  // true
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
