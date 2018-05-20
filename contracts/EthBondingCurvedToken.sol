
import "tokens/eip20/EIP20.sol";
import "zeppelin/contracts/math/SafeMath.sol";


contract EthBondingCurvedToken is EIP20 {

    using SafeMath for uint256;

    uint256 public poolBalance;

    constructor(
        string name,
        uint8 decimals,
        string symbol
    ) EIP20(0, name, decimals, symbol) public {}

    function priceToMint(uint256 numTokens) public returns(uint256);

    function rewardForBurn(uint256 numTokens) public returns(uint256);

    function mint(uint256 numTokens) public payable {
        uint256 priceForTokens = priceToMint(numTokens);
        require(msg.value >= priceForTokens);

        totalSupply = totalSupply.add(numTokens);
        balances[msg.sender] = balances[msg.sender].add(numTokens);
        poolBalance = poolBalance.add(priceForTokens);
        if (msg.value > priceForTokens) {
            msg.sender.transfer(msg.value - priceForTokens);
        }

        emit Minted(numTokens, priceForTokens);
    }

    function burn(uint256 numTokens) public {
        require(balances[msg.sender] >= numTokens);

        uint256 ethToReturn = rewardForBurn(numTokens);
        totalSupply = totalSupply.sub(numTokens);
        balances[msg.sender] = balances[msg.sender].sub(numTokens);
        poolBalance = poolBalance.sub(ethToReturn);
        msg.sender.transfer(ethToReturn);

        emit Burned(numTokens, ethToReturn);
    }

    event Minted(uint256 amount, uint256 totalCost);
    event Burned(uint256 amount, uint256 reward);
}
