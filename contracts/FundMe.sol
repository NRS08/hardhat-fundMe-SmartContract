// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FundMe__NotOwner();

contract FundMe {
    address public immutable owner;
    AggregatorV3Interface public priceFeed;

    using PriceConverter for uint256;
    uint256 constant minUSD = 50 * 1e18;
    address[] public funders;
    mapping(address => uint256) public addressToAmtFunded;

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeedAddress) {
        owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // receive() external payable {
    //     fund();
    // }

    // fallback() external payable {
    //     fund();
    // }

    function fund() public payable {
        require(
            msg.value.getConversionRate(priceFeed) >= minUSD,
            "Not enough amount"
        );
        funders.push(msg.sender);
        addressToAmtFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        // for (uint256 i = 0; i < funders.length; i++) {
        //     addressToAmtFunded[funders[i]] = 0;
        // }
        address[] memory m_funders = funders;
        for (uint256 i = 0; i < m_funders.length; i++) {
            address funder = m_funders[i];
            addressToAmtFunded[funder] = 0;
        }
        funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }
}
