pragma solidity ^0.5.0;

import "./DappToken.sol";

contract DappTokenSale {

    address payable admin;
    DappToken public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;

    event Sell(address _buyer, uint256 _amount);

    constructor (DappToken _tokenContract, uint256 _price) public{
        admin = msg.sender;
        tokenContract = _tokenContract;
        tokenPrice = _price;
    }

    function multiply(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, "ds-math-mul-overflow");
    }

    function buyTokens(uint256 _numberOfTokens) public payable {
        require(msg.value == multiply(_numberOfTokens, tokenPrice), "Invalid Price");
        require(tokenContract.balanceOf(address(this)) >= _numberOfTokens, "Number of tokens > balance");
        require(tokenContract.transfer(msg.sender, _numberOfTokens));

        tokensSold += _numberOfTokens;
        emit Sell(msg.sender, _numberOfTokens);
    }

    function endSale() public {
        require(msg.sender == admin, "Unauthorised");
        require(tokenContract.transfer(admin, tokenContract.balanceOf(address(this))));
        admin.transfer(address(this).balance);
    }
}
