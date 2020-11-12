const DappToken = artifacts.require("./DappToken.sol")
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');


const should = require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('DappToken', function(accounts){

    let dappToken;
    let initialSupply = new BN(1000000);

    before(async () => {
        dappToken = await DappToken.new(initialSupply);

        dappToken.name().should.eventually.equal("DApp Token");
        dappToken.symbol().should.eventually.equal("DAPP");

        (await dappToken.totalSupply())
            .should.be.bignumber.equal(new BN(initialSupply));
    })

    describe('Dapp Deployment', async () => {
        it("Sets the total supply upon deployment", async () =>{
            (await dappToken.totalSupply())
                .should.be.bignumber.equal(initialSupply);
        })

        it("Allocated admin account", async () =>{
            (await dappToken.balanceOf(accounts[0]))
                .should.be.bignumber.equal(initialSupply);
        })
    })

    describe("Transferring Tokens", async () => {
        it("Transfer larger than senders balance", async () =>{
            await expectRevert(
                dappToken.transfer.call(accounts[1],999999999),
                "Value greater than balance"
            );
        });

        it("Valid Transfer", async () =>{
            (await dappToken.transfer.call(accounts[1],250000,{from: accounts[0]}))
                .should.equal(true);

            let receipt = await dappToken.transfer(accounts[1],250000,{from: accounts[0]});
            expectEvent(receipt, "Transfer",{
                _from:accounts[0],
                _to:accounts[1],
                _value: new BN(250000)
            });

            (await dappToken.balanceOf(accounts[1]))
                .should.be.bignumber.equal(new BN(250000));

            (await dappToken.balanceOf(accounts[0]))
                .should.be.bignumber.equal(new BN(750000));
        });

        it("Approves tokens for delegated transfer", async () =>{
            let value = new BN(100);
            (await dappToken.approve.call(accounts[1], value))
                .should.equal(true);

            let receipt = await dappToken.approve(accounts[1], value);
            expectEvent(receipt, "Approval",{
                _owner:accounts[0],
                _spender:accounts[1],
                _value: value
            });

            (await dappToken.allowance(accounts[0], accounts[1]))
                .should.be.bignumber.equal(value);
        })

        describe("Handles delegated token transfer", async () =>{
            let fromAccount = accounts[2];
            let toAccount = accounts[3];
            let spendingAccount = accounts[4];

            it("Transfers tokens to fromAccount", async () =>{
                let receipt = await dappToken.transfer(fromAccount, new BN(100), {from: accounts[0]});
                expectEvent(receipt, "Transfer",{
                    _from:accounts[0],
                    _to:fromAccount,
                    _value: new BN(100)
                });
            });

            it("Approves tokens to spendingAccount", async () =>{
                let receipt = await dappToken.approve(spendingAccount, new BN(10), {from: fromAccount});
                expectEvent(receipt, "Approval",{
                    _owner:fromAccount,
                    _spender:spendingAccount,
                    _value: new BN(10)
                });
            });

            it("Rejects value greater than balance", async () =>{
                await expectRevert(
                    dappToken.transferFrom(fromAccount, toAccount, 9999, {from: spendingAccount}),
                    "Value greater than balance"
                )
            });

            it("Rejects value greater than approved amount", async () =>{
                await expectRevert(
                    dappToken.transferFrom(fromAccount, toAccount, 20, {from: spendingAccount}),
                    "Value greater than approved"
                )
            });

            it("Call TransferFrom", async () =>{
                await dappToken.transferFrom.call(fromAccount, toAccount, 10, {from: spendingAccount})
                    .should.eventually.equal(true);
            });

            it("Transfers the tokens", async () =>{
                const fromReceipt = await dappToken.transferFrom(fromAccount, toAccount, 10, {from: spendingAccount})
                expectEvent(fromReceipt, "Transfer",{
                    _from:fromAccount,
                    _to:toAccount,
                    _value: new BN(10)
                });
            });

            it("Checks account balances", async () =>{
                await dappToken.balanceOf(fromAccount)
                    .should.eventually.be.bignumber.equal(new BN(90));

                await dappToken.balanceOf(toAccount)
                    .should.eventually.be.bignumber.equal(new BN(10));

                await dappToken.allowance(fromAccount, spendingAccount)
                    .should.eventually.be.bignumber.equal(new BN(0));
            });


        })
    })
})