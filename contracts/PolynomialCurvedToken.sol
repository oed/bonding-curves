/*pragma solidity ^0.4.23*/

import "./BondingCurvedToken.sol";


contract PolynomialCurvedToken is BondingCurvedToken {

    uint256 constant private PRECISION = 10000000000;

    uint8 public exponent;

    constructor(
        string name,
        uint8 decimals,
        string symbol,
        uint8 _exponent
    ) BondingCurvedToken(name, decimals, symbol) public {
        exponent = _exponent;
    }

    function curveIntegral(uint256 t) internal returns (uint256) {
        uint256 nexp = exponent + 1;
        // Calculate integral of t^exponent
        return PRECISION.div(nexp).mul(t ** nexp).div(PRECISION);
    }

    function priceToMint(uint256 numTokens) public returns(uint256) {
        return curveIntegral(totalSupply + numTokens) - poolBalance;
    }

    function rewardForBurn(uint256 numTokens) public returns(uint256) {
        return poolBalance - curveIntegral(totalSupply - numTokens);
    }
}
