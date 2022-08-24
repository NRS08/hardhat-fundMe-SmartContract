const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe("FundMe", () => {
      let fundMe;
      let mockV3Aggregator;
      let deployer;
      const sendEth = ethers.utils.parseEther("1");

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture("all");
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", () => {
        it("Sets aggregator address correctly", async () => {
          const responce = await fundMe.priceFeed();
          assert.equal(responce, mockV3Aggregator.address);
        });
      });
      describe("fund", () => {
        it("Should reject transaction with less amount", async () => {
          await expect(fundMe.fund()).to.be.reverted;
        });
        it("Should update the funders data structure", async () => {
          await fundMe.fund({ value: sendEth });
          const responce = await fundMe.addressToAmtFunded(deployer);
          assert.equal(responce.toString(), sendEth.toString());
        });
        it("Should add funder to array", async () => {
          await fundMe.fund({ value: sendEth });
          const responce = await fundMe.funders(0);
          assert.equal(responce, deployer);
        });
      });
      describe("withdraw", () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendEth });
        });
        it("Should withdraw from one funder", async () => {
          const startingContractAmount = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerAmount = await fundMe.provider.getBalance(
            deployer
          );

          const transactionResponce = await fundMe.withdraw();
          const transactionReceipt = await transactionResponce.wait(1);
          const { effectiveGasPrice, gasUsed } = transactionReceipt;
          const gasCost = effectiveGasPrice.mul(gasUsed);
          const endingContractAmount = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerAmount = await fundMe.provider.getBalance(
            deployer
          );

          assert.equal(endingContractAmount.toString(), "0");
          assert.equal(
            startingDeployerAmount.add(startingContractAmount).toString(),
            endingDeployerAmount.add(gasCost).toString()
          );
        });

        it("Should withdraw from multiple funders", async () => {
          const accounts = await ethers.getSigners();
          let fundMeConnected;
          for (let i = 0; i < 6; i++) {
            fundMeConnected = await fundMe.connect(accounts[i]);
          }
          await fundMeConnected.fund({ value: sendEth });
          const startingContractAmount = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerAmount = await fundMe.provider.getBalance(
            deployer
          );
          const transactionResponce = await fundMe.withdraw();
          const transactionReceipt = await transactionResponce.wait(1);
          const { effectiveGasPrice, gasUsed } = transactionReceipt;
          const gasCost = effectiveGasPrice.mul(gasUsed);
          const endingContractAmount = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerAmount = await fundMe.provider.getBalance(
            deployer
          );

          assert.equal(endingContractAmount.toString(), "0");
          assert.equal(
            startingDeployerAmount.add(startingContractAmount).toString(),
            endingDeployerAmount.add(gasCost).toString()
          );
          expect(fundMe.funders(0)).to.be.reverted;
          for (let i = 0; i < 6; i++) {
            assert.equal(
              await fundMe.addressToAmtFunded(accounts[i].address),
              "0"
            );
          }
        });
        it("Should not allow anyone to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);
          await expect(attackerConnectedContract.withdraw()).to.be.reverted;
        });
      });
    })
  : describe.skip;
