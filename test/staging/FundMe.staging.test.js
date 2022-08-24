const { getNamedAccounts, ethers, network } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", () => {
      let deployer, fundme;
      const sendEth = ethers.utils.parseEther("0.2");
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        fundme = await ethers.getContract("FundMe", deployer);
      });
      it("Should withraw money", async () => {
        await fundme.fund({ value: sendEth });
        const transactionResponce = await fundme.withdraw();
        const transactionReceipt = await transactionResponce.wait(1);
        const balance = await fundme.provider.getBalance(fundme.address);
        assert.equal(balance.toString(), "0");
      });
    });
