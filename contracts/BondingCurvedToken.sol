
import "tokens/eip20/EIP20.sol";


contract BondingCurvedToken is EIP20 {

    uint256 public poolBalance;

    function priceToMint(uint256 numTokens) public returns(uint256);

    function rewardForBurn(uint256 numTokens) public returns(uint256);

    function mint(uint256 numTokens) public payable;

    function burn(uint256 numTokens) public;

    event Minted(uint256 amount, uint256 totalCost);
    event Burned(uint256 amount, uint256 reward);
}
