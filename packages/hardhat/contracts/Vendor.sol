pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./YourToken.sol";
import "hardhat/console.sol";

contract Vendor is Ownable {

  using SafeMath for uint256;
  YourToken yourToken;
  uint256 public constant tokensPerEth = 100;
  event BuyTokens(address buyer, uint256 amountOfETH, uint256 amountOfTokens);
  event SellTokens(address buyer, uint256 amountOfTokens, uint256 amountOfETH);

  constructor(address tokenAddress) public {
    yourToken = YourToken(tokenAddress);
  }

  //ToDo: create a payable buyTokens() function:
  function buyTokens() public payable {
  	require(msg.value >= 0.1*10**18,"min 0.1");
  	// uint256 _tokens = ((tokensPerEth*(10**18))*msg.value)/(10**18);
  	uint256 _tokens = tokensPerEth.mul(10**18).mul(msg.value).div(10**18);
  	// console.log("_tokens,_eth",_tokens, msg.value);

  	//0.1  eth    = 100000000000000000 
  	//1    tokens = 1000000000000000000
  	//10   tokens = 10000000000000000000

  	require(yourToken.transfer(msg.sender, _tokens));
  	emit BuyTokens(msg.sender, msg.value, _tokens );
  }

  //ToDo: create a sellTokens() function:
  function sellTokens(uint256 _t) public payable {
  	uint256 _tokens = yourToken.balanceOf(address(msg.sender));
  	require(_t> 0 && _tokens > 0 && _t <= _tokens, "check token balance");
  	
  	// uint256 _eth = _t*10**18/(tokensPerEth*10**18);
  	uint256 _eth = (_t.mul(10**18)).div(tokensPerEth.mul(10**18));
  	console.log("_tokens,_eth",_tokens,_eth);
  	require(_eth <= address(this).balance, "check eth balance");

  	//0.1  eth    = 100000000000000000 
  	//1    tokens = 1000000000000000000
  	//10   tokens = 10000000000000000000 

  	uint256 _allow = yourToken.allowance(address(msg.sender), address(this));
	require(_t <= _allow, "check token allowance");

	// msg.sender.transfer(_eth);
	require(msg.sender.send(_eth));
	require(yourToken.transferFrom(address(msg.sender),address(this), _t));
	// require(yourToken.transfer(address(this), _tokens));

  	emit SellTokens(msg.sender, _t, _eth );

  }

  function calc(uint256 eth_or_tokens, bool isEth ) pure public returns (uint256) {
	uint256 _eth  = 1*10**18;
	uint256 _tokens  = 100*10**18;

	if(isEth){
		uint256 _e = _tokens.mul(eth_or_tokens);
		return _e / _eth;
	} else {
		uint256 _t= _eth.mul(eth_or_tokens);
		return _t / _tokens;
	}
  }


  //ToDo: create a withdraw() function that lets the owner, you can 
  //use the Ownable.sol import above:
  function withdraw() public payable {
  	require(owner() == msg.sender, "not a owner");
  	uint256 amount = address(this).balance;
  	require(amount>0, "Cant withdraw, no funds");
  	msg.sender.transfer(amount);
  }

  fallback() external payable {

  }

  receive() external payable  {

  }
}
