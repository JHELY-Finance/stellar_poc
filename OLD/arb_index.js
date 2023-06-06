var StellarSdk = require('stellar-sdk');
const BigNumber = require('bignumber.js');

const server = new StellarSdk.Server('https://horizon.stellar.org');

const ledgersStream = server
  .ledgers()
  .cursor('now')
  .stream({
    onmessage: (ledger) => {
      // This code will execute every time a new ledger is created

      console.log(`New ledger created with sequence ${ledger.sequence}`);

      // Insert your custom code here to execute on every new ledger
    },
    onerror: (error) => {
      console.error('Error in ledgers stream:', error);
    }
  });


const assetA = new StellarSdk.Asset('XLM');
const assetB = new StellarSdk.Asset('USDC', 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
const assetC = new StellarSdk.Asset('BTC', 'GDPJALI4AZKUU2W426U5WKMAT6CN3AJRPIIRYR2YM54TL2GDWO5O2MZM');

async function findArbitrageOpportunities() {
  const pairs = [
    [assetA, assetB],
    [assetB, assetC],
    [assetC, assetA]
  ];

  for (let i = 0; i < pairs.length; i++) {
    console.log('iteration', i);
    const [asset1, asset2] = pairs[i];
    const [_, asset3] = pairs[(i + 1) % pairs.length];

    const orderbook1 = await server.orderbook(asset1, asset2).call();
    const orderbook2 = await server.orderbook(asset2, asset3).call();
    const orderbook3 = await server.orderbook(asset1, asset3).call();

    console.log('ob1', orderbook1.base.asset_code, orderbook1.counter.asset_code, orderbook1.bids[0].price, orderbook1.asks[0].price);
    console.log('ob2', orderbook2.base.asset_code, orderbook2.counter.asset_code, orderbook2.bids[0].price, orderbook2.asks[0].price);
    console.log('ob3', orderbook3.base.asset_code, orderbook3.counter.asset_code, orderbook3.bids[0].price, orderbook3.asks[0].price);

    const impliedExchangeRate = new BigNumber(orderbook1.bids[0].price).times(new BigNumber(orderbook2.bids[0].price));
    const actualExchangeRate = new BigNumber(orderbook3.bids[0].price);
    console.log('ie', impliedExchangeRate.toString(), 'ae', actualExchangeRate.toString());

    if (impliedExchangeRate > actualExchangeRate) {
      const startAmount = new BigNumber(100);
      const tradeAmount1 = startAmount.times(new BigNumber(orderbook1.bids[0].price));
      const tradeAmount2 = tradeAmount1.times(new BigNumber(orderbook2.bids[0].price));
      const tradeAmount3 = tradeAmount2.dividedBy(new BigNumber(orderbook3.asks[0].price));

      console.log(tradeAmount1.toString(), tradeAmount2.toString(), tradeAmount3.toString());
      const profit = tradeAmount3.minus(startAmount).dividedBy(startAmount).times(100);

      console.log(`Arbitrage opportunity found, profit of ${profit.toFixed(2)}%.`);
    }
  }
}

findArbitrageOpportunities();
