
import "tokens/eip20/EIP20.sol";
import "zeppelin/contracts/math/SafeMath.sol";


contract BondingCurvedToken is EIP20 {

    using SafeMath for uint256;

    EIP20 public reserveToken;
    uint256 public poolBalance;

    constructor(
        string name,
        uint8 decimals,
        string symbol,
        address _reserveToken
    ) EIP20(0, name, decimals, symbol) public {
        reserveToken = EIP20(_reserveToken);
    }

    function priceToMint(uint256 numTokens) public returns(uint256);

    function rewardForBurn(uint256 numTokens) public returns(uint256);

    function mint(uint256 numTokens) public {
        uint256 priceForTokens = priceToMint(numTokens);
        require(reserveToken.transferFrom(msg.sender, this, priceForTokens));

        totalSupply = totalSupply.add(numTokens);
        balances[msg.sender] = balances[msg.sender].add(numTokens);
        poolBalance = poolBalance.add(priceForTokens);

        emit Minted(numTokens, priceForTokens);
    }

    function burn(uint256 numTokens) public {
        require(balances[msg.sender] >= numTokens);

        uint256 reserveTokensToReturn = rewardForBurn(numTokens);
        totalSupply = totalSupply.sub(numTokens);
        balances[msg.sender] = balances[msg.sender].sub(numTokens);
        poolBalance = poolBalance.sub(reserveTokensToReturn);
        reserveToken.transfer(msg.sender, reserveTokensToReturn);

        emit Burned(numTokens, reserveTokensToReturn);
    }

    event Minted(uint256 amount, uint256 totalCost);
    event Burned(uint256 amount, uint256 reward);
}
