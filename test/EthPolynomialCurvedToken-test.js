const EthPolynomialCurvedToken = artifacts.require('EthPolynomialCurvedToken')


contract('EthPolynomialCurvedToken', accounts => {
  let polyBondToken1
  const creator = accounts[0]
  const user1 = accounts[1]
  const user2 = accounts[2]

  before(async () => {
    polyBondToken1 = await EthPolynomialCurvedToken.new( 'oed curve', 18, 'OCU', 2)
  })

  it('Is initiated correcly', async () => {
    const poolBalance = await polyBondToken1.poolBalance.call()
    assert.equal(poolBalance, 0)
    const totalSupply = await polyBondToken1.totalSupply.call()
    assert.equal(totalSupply, 0)
    const exponent = await polyBondToken1.exponent.call()
    assert.equal(exponent, 2)
  })

  describe('Curve integral calulations', async () => {
    // priceToMint is the same as the internal function curveIntegral if
    // totalSupply and poolBalance is zero
    const testWithExponent = async exponent => {
      const tmpPolyToken = await EthPolynomialCurvedToken.new( 'oed curve', 18, 'OCU', exponent)
      let res
      let jsres
      let last = 0
      for (let i = 50000; i < 5000000; i += 50000) {
        res = (await polyBondToken1.priceToMint.call(i)).toNumber()
        assert.isAbove(res, last, 'should calculate curveIntegral correcly ' + i)
        last = res
      }
    }
    it('works with exponent = 1', async () => {
      await testWithExponent(1)
    })
    it('works with exponent = 2', async () => {
      await testWithExponent(2)
    })
    it('works with exponent = 3', async () => {
      await testWithExponent(3)
    })
    it('works with exponent = 4', async () => {
      await testWithExponent(4)
    })
  })

  it('Can mint tokens with ether', async function() {
    let balance = await polyBondToken1.balanceOf(user1)
    assert.equal(balance.toNumber(), 0)

    const priceToMint1 = await polyBondToken1.priceToMint.call(50)
    let tx = await polyBondToken1.mint(50, {value: priceToMint1, from: user1})
    assert.equal(tx.logs[0].args.amount.toNumber(), 50, 'amount minted should be 50')
    balance = await polyBondToken1.balanceOf(user1)
    assert.equal(tx.logs[0].args.totalCost.toNumber(), priceToMint1)
    const poolBalance1 = await polyBondToken1.poolBalance.call()
    assert.equal(poolBalance1.toNumber(), priceToMint1.toNumber(), 'poolBalance should be correct')

    const priceToMint2 = await polyBondToken1.priceToMint.call(50)
    assert.isAbove(priceToMint2.toNumber(), priceToMint1)
    tx = await polyBondToken1.mint(50, {value: priceToMint2, from: user2})
    assert.equal(tx.logs[0].args.amount.toNumber(), 50, 'amount minted should be 50')
    assert.equal(tx.logs[0].args.totalCost.toNumber(), priceToMint2)
    const poolBalance2 = await polyBondToken1.poolBalance.call()
    assert.equal(poolBalance2.toNumber(), priceToMint1.toNumber() + priceToMint2.toNumber(), 'poolBalance should be correct')

    const totalSupply = await polyBondToken1.totalSupply.call()
    assert.equal(totalSupply.toNumber(), 100)

    let didThrow = false
    const priceToMint3 = await polyBondToken1.priceToMint.call(50)
    try {
      tx = await polyBondToken1.mint(50, {value: priceToMint3.toNumber() - 1, from: user2})
    } catch (e) {
      didThrow = true
    }
    assert.isTrue(didThrow)
  })

  it('should not be able to burn tokens user dont have', async () => {
    let didThrow = false
    try {
      tx = await polyBondToken1.burn(80, {from: user2})
    } catch (e) {
      didThrow = true
    }
    assert.isTrue(didThrow)
  })

  it('Can burn tokens and receive ether', async () => {
    const poolBalance1 = await polyBondToken1.poolBalance.call()
    const totalSupply1 = await polyBondToken1.totalSupply.call()

    let reward1 = await polyBondToken1.rewardForBurn.call(50)
    let tx = await polyBondToken1.burn(50, {from: user1})
    assert.equal(tx.logs[0].args.amount.toNumber(), 50, 'amount burned should be 50')
    assert.equal(tx.logs[0].args.reward.toNumber(), reward1)
    let balance = await polyBondToken1.balanceOf(user1)
    assert.equal(balance.toNumber(), 0)

    const poolBalance2 = await polyBondToken1.poolBalance.call()
    assert.equal(poolBalance2.toNumber(), poolBalance1.toNumber() - reward1.toNumber())
    const totalSupply2 = await polyBondToken1.totalSupply.call()
    assert.equal(totalSupply2.toNumber(), totalSupply1.toNumber() - 50)

    let reward2 = await polyBondToken1.rewardForBurn.call(50)
    tx = await polyBondToken1.burn(50, {from: user2})
    assert.equal(tx.logs[0].args.amount.toNumber(), 50, 'amount burned should be 50')
    assert.equal(tx.logs[0].args.reward.toNumber(), reward2)
    balance = await polyBondToken1.balanceOf(user2)
    assert.equal(balance.toNumber(), 0)
    assert.isBelow(reward2.toNumber(), reward1.toNumber())

    const poolBalance3 = await polyBondToken1.poolBalance.call()
    assert.equal(poolBalance3.toNumber(), 0)
    const totalSupply3 = await polyBondToken1.totalSupply.call()
    assert.equal(totalSupply3.toNumber(), 0)
  })
})
