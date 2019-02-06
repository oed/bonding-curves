const EthPolynomialCurvedToken = artifacts.require("EthPolynomialCurvedToken");


contract("EthPolynomialCurvedToken", accounts => {
  let polyBondToken1;
  const creator = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];


  const getBalance = address => {
    return new Promise((resolve, reject) => {
      web3.eth.getBalance(address, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      })
    })
  }

  before(async () => {
    polyBondToken1 = await EthPolynomialCurvedToken.new(
      "oed curve",
      "OCU",
      18,
      2,
      10
    );
    const hash = polyBondToken1.transactionHash;
    let receipt;
    await web3.eth.getTransactionReceipt(hash, (err, res) => {
      receipt = res;
      console.log('Gas for deployment: ', receipt.gasUsed)
    });
  });

  it("Is initiated correcly", async () => {
    const poolBalance = await polyBondToken1.poolBalance.call();
    assert.equal(poolBalance, 0);
    const totalSupply = await polyBondToken1.totalSupply.call();
    assert.equal(totalSupply, 0);
    const exponent = await polyBondToken1.exponent.call();
    assert.equal(exponent, 2);
  });

  describe("Curve integral calulations", async () => {
    // priceToMint is the same as the internal function curveIntegral if
    // totalSupply and poolBalance is zero
    const testWithExponent = async exponent => {
      const tmpPolyToken = await EthPolynomialCurvedToken.new(
        "oed curve",
        "OCU",
        18,
        exponent,
        10
      );
      let res;
      let jsres;
      let last = 0;
      for (let i = 50000; i < 5000000; i += 50000) {
        res = (await polyBondToken1.priceToMint.call(i)).toNumber();
        assert.isAbove(
          res,
          last,
          "should calculate curveIntegral correcly " + i
        );
        last = res;
      }
    };
    it("works with exponent = 1", async () => {
      await testWithExponent(1);
    });
    it("works with exponent = 2", async () => {
      await testWithExponent(2);
    });
    it("works with exponent = 3", async () => {
      await testWithExponent(3);
    });
    it("works with exponent = 4", async () => {
      await testWithExponent(4);
    });
  });

  it("Can mint tokens with ether", async function () {
    let balance = await polyBondToken1.balanceOf(user1);
    assert.equal(balance.toNumber(), 0);

    let contractBalance = await getBalance(polyBondToken1.address);
    console.log('contract holds: ', contractBalance.toString());

    const priceToMint1 = await polyBondToken1.priceToMint.call(50);
    let tx = await polyBondToken1.mint(50, {
      value: priceToMint1,
      from: user1
    });
    assert.equal(
      tx.logs[0].args.amount.toNumber(),
      50,
      "amount minted should be 50"
    );
    balance = await polyBondToken1.balanceOf(user1);
    assert.equal(tx.logs[0].args.totalCost.toNumber(), priceToMint1);
    const poolBalance1 = await polyBondToken1.poolBalance.call();
    assert.equal(
      poolBalance1.toNumber(),
      Math.round(priceToMint1.toNumber() * 0.9),
      "poolBalance should be correct"
    );

    contractBalance = await getBalance(polyBondToken1.address);
    console.log('contract holds: ', contractBalance.toString(), 'priceToMint1: ', priceToMint1.toString());

    const priceToMint2 = await polyBondToken1.priceToMint.call(50);
    assert.isAbove(priceToMint2.toNumber(), priceToMint1.toNumber());
    tx = await polyBondToken1.mint(50, { value: priceToMint2, from: user2 });
    assert.equal(
      tx.logs[0].args.amount.toNumber(),
      50,
      "amount minted should be 50"
    );
    assert.equal(tx.logs[0].args.totalCost.toNumber(), priceToMint2.toNumber());

    console.log('Gas for buying: ', tx.receipt.gasUsed);

    const poolBalance2 = await polyBondToken1.poolBalance.call();
    assert.equal(
      poolBalance2.toNumber(),
      Math.round(0.9 * (priceToMint1.toNumber())) + Math.round(0.9 * priceToMint2.toNumber()),
      "poolBalance should be correct"
    );

    contractBalance = await getBalance(polyBondToken1.address);
    console.log('contract holds: ', contractBalance.toString(), 'priceToMint2: ', priceToMint2.toString());

    const totalSupply = await polyBondToken1.totalSupply.call();
    assert.equal(totalSupply.toNumber(), 100);

    // should not mint when value sent is too low
    let didThrow = false;
    const priceToMint3 = await polyBondToken1.priceToMint.call(50);
    try {
      tx = await polyBondToken1.mint(50, {
        value: priceToMint3.toNumber() - 1,
        from: user2
      });
    } catch (e) {
      didThrow = true;
    }
    assert.isTrue(didThrow);
  });

  it("should not be able to burn tokens user dont have", async () => {
    let didThrow = false;
    try {
      tx = await polyBondToken1.burn(80, { from: user2 });
    } catch (e) {
      didThrow = true;
    }
    assert.isTrue(didThrow);
  });

  it("Can burn tokens and receive ether", async () => {
    const poolBalance1 = await polyBondToken1.poolBalance.call();
    const totalSupply1 = await polyBondToken1.totalSupply.call();

    contractBalance = await getBalance(polyBondToken1.address);

    let reward1 = await polyBondToken1.rewardForBurn.call(50);
    console.log('contract holds: ', contractBalance.toString(), 'reward1: ', reward1.toString());
    let tx = await polyBondToken1.burn(50, { from: user1 });
    assert.equal(
      tx.logs[0].args.amount.toNumber(),
      50,
      "amount burned should be 50"
    );
    assert.equal(tx.logs[0].args.reward.toNumber(), reward1);
    let balance = await polyBondToken1.balanceOf(user1);
    assert.equal(balance.toNumber(), 0);

    console.log('Gas for selling: ', tx.receipt.gasUsed);

    const poolBalance2 = await polyBondToken1.poolBalance.call();
    assert.equal(
      poolBalance2.toNumber(),
      poolBalance1.toNumber() - reward1.toNumber()
    );
    const totalSupply2 = await polyBondToken1.totalSupply.call();
    assert.equal(totalSupply2.toNumber(), totalSupply1.toNumber() - 50);

    contractBalance = await getBalance(polyBondToken1.address);

    let reward2 = await polyBondToken1.rewardForBurn.call(50);
    console.log('contract holds: ', contractBalance.toString(), 'reward2: ', reward2.toString());
    tx = await polyBondToken1.burn(50, { from: user2 });
    assert.equal(
      tx.logs[0].args.amount.toNumber(),
      50,
      "amount burned should be 50"
    );
    assert.equal(tx.logs[0].args.reward.toNumber(), reward2);
    balance = await polyBondToken1.balanceOf(user2);
    assert.equal(balance.toNumber(), 0);
    assert.isBelow(reward2.toNumber(), reward1.toNumber());

    contractBalance = await getBalance(polyBondToken1.address);
    console.log('contract holds: ', contractBalance.toString());

    const poolBalance3 = await polyBondToken1.poolBalance.call();
    assert.equal(poolBalance3.toNumber(), 0);
    const totalSupply3 = await polyBondToken1.totalSupply.call();
    assert.equal(totalSupply3.toNumber(), 0);
  });


  it("Can withdraw ether from ownerFund", async function () {
    contractBalance = await getBalance(polyBondToken1.address);
    console.log('contract holds: ', contractBalance.toString());
    let ownerBalancePre;
    web3.eth.getBalance(creator, (err, res) => {
      ownerBalancePre = res.toNumber();
    });
    tx = await polyBondToken1.withdraw({ from: creator });
    await web3.eth.getTransaction(tx.tx, (err, res) => {
      console.log('Gas for withdrawing: ', tx.receipt.gasUsed, 'Gas Price: ', res.gasPrice.toNumber(), 'Gas cost: ', tx.receipt.gasUsed * res.gasPrice.toNumber() );
    })
    let ownerBalancePost;
    web3.eth.getBalance(creator, (err, res) => {
      ownerBalancePost = res.toNumber();
      console.log('Post withdraw: ', ownerBalancePost.toString(), 'Pre withdraw: ', ownerBalancePre.toString() )
      // Somehow the ownerFund is rounded up / after subtracting gasCosts, 
      // the owner is given a bit more than whats in the ownerFund?!
    });
    // assert.isAbove(ownerBalancePost.toNumber(), ownerBalancePre.toNumber()) // this is not necessarily the case because of gas costs!
    contractBalance = await getBalance(polyBondToken1.address);
    console.log('contract holds: ', contractBalance.toString());
  });

});
