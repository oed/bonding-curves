pragma solidity ^0.4.24;

import "./BondingCurvedToken.sol";
import "./Power.sol";

/// @title  PolynomialCurvedToken - A polynomial bonding curve
///         implementation that is backed by an EIP20 token.
contract PolynomialCurvedToken is BondingCurvedToken, Power {

    uint8 public exponent;

    /// @dev constructor        Initializes the bonding curve
    /// @param _name             The name of the token
    /// @param _decimals         The number of decimals to use
    /// @param _symbol           The symbol of the token
    /// @param _reserveToken    The backing token to use
    /// @param _exponent        The exponent of the curve
    constructor(
        string _name,
        string _symbol,
        uint8 _decimals,
        address _reserveToken,
        uint8 _exponent
    ) BondingCurvedToken(_name, _symbol, _decimals, _reserveToken) public {
        exponent = _exponent;
    }

    /// @dev        Calculate the integral from 0 to t
    /// @param t    The number to integrate to
    function curveIntegral(uint256 t) internal returns (uint256) {
        uint32 nexp = exponent + 1;
        uint256 result;
        uint8 precision;

        // Calculate integral of t^exponent
        (result, precision) = power(t, 1, nexp, 1);
        return result >> precision;
    }

    function priceToMint(uint256 numTokens) public returns(uint256) {
        return curveIntegral(totalSupply_.add(numTokens)).sub(poolBalance);
    }

    function rewardForBurn(uint256 numTokens) public returns(uint256) {
        // Special case for selling entire supply,
        // since Bancor power formula is an approximation
        if (numTokens == totalSupply_) {
          return poolBalance;
        }

        return poolBalance.sub(curveIntegral(totalSupply_.sub(numTokens)));
    }
}
