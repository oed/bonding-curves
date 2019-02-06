pragma solidity ^0.4.23;

import "./EthBondingCurvedToken.sol";

/// @title  EthPolynomialCurvedToken - A polynomial bonding curve
///         implementation that is backed by ether.
contract EthPolynomialCurvedToken is EthBondingCurvedToken {

    uint256 constant private PRECISION = 10000000000;

    uint8 public exponent;
    uint8 public margin;

    /// @dev constructor        Initializes the bonding curve
    /// @param name             The name of the token
    /// @param decimals         The number of decimals to use
    /// @param symbol           The symbol of the token
    /// @param _exponent        The exponent of the curve
    /// @param _margin          The percentage difference between buy and sell curve
    constructor(
        string name,
        string symbol,
        uint8 decimals,
        uint8 _exponent,
        uint8 _margin
    ) EthBondingCurvedToken(name, symbol, decimals) public {
        require(margin < 100, "Margin needs to be a valid percentage");
        exponent = _exponent;
        margin = _margin;
    }

    /// @dev        Calculate the integral from 0 to t
    /// @param t    The number to integrate to
    function curveIntegral(uint256 t) internal returns (uint256) {
        uint256 nexp = exponent + 1;
        // Calculate integral of t^exponent
        return PRECISION.div(nexp).mul(t ** nexp).div(PRECISION);
    }

    function priceToMint(uint256 numTokens) public returns(uint256) {
        return curveIntegral(totalSupply_.add(numTokens)).sub(curveIntegral(totalSupply_));
    }

    function rewardForBurn(uint256 numTokens) public returns(uint256) {
        return poolBalance.sub((100-margin).mul(curveIntegral(totalSupply_.sub(numTokens))).div(100));
    }

    function priceToReserve(uint256 numTokens) public returns(uint256) {
        return (100-margin).mul(curveIntegral(totalSupply_.add(numTokens))).div(100).sub(poolBalance);
    }
}
