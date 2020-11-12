const DappTokenSale = artifacts.require("./DappTokenSale.sol")
const DappToken = artifacts.require("./DappToken.sol")
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');


const should = require('chai')
    .use(require('chai-as-promised'))
    .should()


contract('DappTokenSake', function(accounts){
    var tokenInstance;
    var tokenSaleInstance;
    var tokenPrice = new BN(1000000000000000);
    var tokensAvailable = new BN(750000);
    var admin = accounts[0];
    var buyer = accounts[1];

    before(async () => {

        tokenInstance = await DappToken.deployed();
        tokenSaleInstance = await DappTokenSale.deployed();

        let receipt = await tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable,{from: admin})
        expectEvent(receipt, "Transfer",{
            _from:admin,
            _to:tokenSaleInstance.address,
            _value:tokensAvailable
        })
    })

    it("Initialised the contract", async () =>{
        tokenSaleInstance.address
            .should.not.equal(0x0);

        (await tokenSaleInstance.tokenContract())
            .should.not.equal(0x0);

        (await tokenSaleInstance.tokenPrice())
            .should.be.bignumber.equal(tokenPrice);
    });

    it("Buys tokens", async () => {
        let numberOfTokensBN = new BN(10);
        let value = numberOfTokensBN * tokenPrice;

        (await tokenInstance.balanceOf(tokenSaleInstance.address))
            .should.be.bignumber.equal(tokensAvailable);

        let receipt = await tokenSaleInstance.buyTokens(numberOfTokensBN, {from: buyer, value:value});

        expectEvent(receipt, 'Sell', {
            _buyer: buyer,
            _amount: numberOfTokensBN
        });

        (await tokenSaleInstance.tokensSold())
            .should.be.bignumber.equal(numberOfTokensBN);

        // Try buy tokens different from ether value
        await expectRevert(
            tokenSaleInstance.buyTokens(numberOfTokensBN, {from: buyer, value:1}),
            "Invalid Price"
        );

        await expectRevert(
            tokenSaleInstance.buyTokens(800000, {from: buyer, value:800000*tokenPrice}),
            "Number of tokens > balance"
        );

        (await tokenInstance.balanceOf(tokenSaleInstance.address))
            .should.be.bignumber.equal(tokensAvailable.sub(numberOfTokensBN));

        (await tokenInstance.balanceOf(buyer))
            .should.be.bignumber.equal(numberOfTokensBN);
    });

    it("Ends token sale", async () =>{
        await expectRevert(
            tokenSaleInstance.endSale({from: buyer}),
            "Unauthorised"
        );
        let receipt = await tokenSaleInstance.endSale({from: admin});
        expectEvent.inTransaction(receipt.tx, DappToken, "Transfer", {
            _from:tokenSaleInstance.address,
            _to:admin,
            _value:new BN(749990)
        });

        (await web3.eth.getBalance(tokenSaleInstance.address))
            .should.be.bignumber.equal(new BN(0));
    })
});