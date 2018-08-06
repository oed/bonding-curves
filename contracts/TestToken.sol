pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

contract TestToken is MintableToken, DetailedERC20 {
  constructor(
    string name,
    string symbol,
    uint8 decimals
  ) DetailedERC20(name, symbol, decimals) {}
}
