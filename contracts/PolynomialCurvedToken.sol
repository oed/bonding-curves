/*pragma solidity ^0.4.23*/

import "./BondingCurvedToken.sol";


/// @title  PolynomialCurvedToken - A polynomial bonding curve
///         implementation that is backed by an EIP20 token.
contract PolynomialCurvedToken is BondingCurvedToken {

    uint256 constant private PRECISION = 10000000000;

    uint8 public exponent;

    /// @dev constructor        Initializes the bonding curve
    /// @param name             The name of the token
    /// @param decimals         The number of decimals to use
    /// @param symbol           The symbol of the token
    /// @param reserveToken    The backing token to use
    /// @param _exponent        The exponent of the curve
    constructor(
        string name,
        uint8 decimals,
        string symbol,
        address reserveToken,
        uint8 _exponent
    ) BondingCurvedToken(name, decimals, symbol, reserveToken) public {
        exponent = _exponent;
    }

    /// @dev        Calculate the integral from 0 to t
    /// @param t    The number to integrate to
    function curveIntegral(uint256 t) internal returns (uint256) {
        uint256 nexp = exponent + 1;
        // Calculate integral of t^exponent
        return PRECISION.div(nexp).mul(t ** nexp).div(PRECISION);
    }

    function priceToMint(uint256 numTokens) public returns(uint256) {
        return curveIntegral(totalSupply.add(numTokens)).sub(poolBalance);
    }

    function rewardForBurn(uint256 numTokens) public returns(uint256) {
        return poolBalance.sub(curveIntegral(totalSupply.sub(numTokens)));
    }
}
