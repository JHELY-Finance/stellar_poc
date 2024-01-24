import { PrismaClient } from '@prisma/client';

const StellarSdk = require('stellar-sdk');
const BigNumber = require('bignumber.js');

const server = new StellarSdk.Server('https://horizon.stellar.org');
const prisma = new PrismaClient();

const assetA = new StellarSdk.Asset('XLM');
const assetB = new StellarSdk.Asset('USDC', 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
const assetC = new StellarSdk.Asset('BTC', 'GDPJALI4AZKUU2W426U5WKMAT6CN3AJRPIIRYR2YM54TL2GDWO5O2MZM');

function notNullAsseet(a: any) {
  if (typeof a === 'undefined') {
    return 'XLM';
  }
  return a;
}

async function findArbitrageOpportunities() {
  // const pairs = [
  //   [assetA, assetB],
  //   [assetB, assetC],
  //   [assetC, assetA]
  // ];

  // for (let i = 0; i < pairs.length; i++) {
  //   console.log('iteration', i);
    // const [asset1, asset2] = pairs[i];
    // const [_, asset3] = pairs[(i + 1) % pairs.length];

    const fee = await server.fetchBaseFee() * 0.0000001 * 3; // 1 lumen = 10000000 stroops 

    const orderbook1 = await server.orderbook(assetA, assetB).call();
    const orderbook2 = await server.orderbook(assetB, assetC).call();
    const orderbook3 = await server.orderbook(assetC, assetA).call();

    const revorderbook1 = await server.orderbook(assetA, assetC).call();
    const revorderbook2 = await server.orderbook(assetC, assetB).call();
    const revorderbook3 = await server.orderbook(assetB, assetA).call();
    
    console.log('ob1', notNullAsseet(orderbook1.base.asset_code), notNullAsseet(orderbook1.counter.asset_code), orderbook1.bids[0].price, orderbook1.asks[0].price);
    console.log('ob2', notNullAsseet(orderbook2.base.asset_code), notNullAsseet(orderbook2.counter.asset_code), orderbook2.bids[0].price, orderbook2.asks[0].price);
    console.log('ob3', notNullAsseet(orderbook3.base.asset_code), notNullAsseet(orderbook3.counter.asset_code), orderbook3.bids[0].price, orderbook3.asks[0].price);
    console.log('------------------ pair 1 ------------------')
    
    console.log('revob1', notNullAsseet(revorderbook1.base.asset_code), notNullAsseet(revorderbook1.counter.asset_code), revorderbook1.bids[0].price, revorderbook1.asks[0].price);
    console.log('revob2', notNullAsseet(revorderbook2.base.asset_code), notNullAsseet(revorderbook2.counter.asset_code), revorderbook2.bids[0].price, revorderbook2.asks[0].price);
    console.log('revob3', notNullAsseet(revorderbook3.base.asset_code), notNullAsseet(revorderbook3.counter.asset_code), revorderbook3.bids[0].price, revorderbook3.asks[0].price);
    console.log('------------------ pair 2 ------------------')

    //const impliedExchangeRate = new BigNumber(orderbook1.bids[0].price).times(new BigNumber(orderbook2.bids[0].price));
    //const actualExchangeRate = new BigNumber(orderbook3.bids[0].price);

    //PN: my prop, volume not considered anyway
    //impliedExchangeRate = new BigNumber(orderbook1.bids[0].price).times(new BigNumber(orderbook2.bids[0].price));
    //impliedExchangeRate = new BigNumber(impliedExchangeRate).times(new BigNumber(orderbook3.bids[0].price));
    //impliedExchangeRate = new BigNumber(impliedExchangeRate).times(new BigNumber(orderbook1.bids[0].price));


    //console.log('ie', impliedExchangeRate.toString(), 'ae', actualExchangeRate.toString());

    //if (impliedExchangeRate > actualExchangeRate) {
      const startAmount = new BigNumber(100);

      const tradeAmount1 = startAmount.times(new BigNumber(orderbook1.bids[0].price));
      const tradeAmount2 = tradeAmount1.times(new BigNumber(orderbook2.bids[0].price));
      const tradeAmount3 = tradeAmount2.times(new BigNumber(orderbook3.bids[0].price));

      const revtradeAmount1 = startAmount.times(new BigNumber(revorderbook1.bids[0].price));
      const revtradeAmount2 = revtradeAmount1.times(new BigNumber(revorderbook2.bids[0].price));
      const revtradeAmount3 = revtradeAmount2.times(new BigNumber(revorderbook3.bids[0].price));
      

      console.log('pair 1 Trade amounts :', tradeAmount1.toString(),  tradeAmount2.toString(), tradeAmount3.toString());
      const profit = await tradeAmount3.minus(startAmount).minus(fee).dividedBy(startAmount).times(100);

      console.log('pair 2 Trade amounts :', revtradeAmount1.toString(), revtradeAmount2.toString(),  revtradeAmount3.toString());
      const revprofit = await revtradeAmount3.minus(startAmount).minus(fee).dividedBy(startAmount).times(100);

      // TODO: add IF to check if the profit is there

      /*storeArbOpportunity({
        ba1: notNullAsseet(orderbook1.base.asset_code),
        ca1: notNullAsseet(orderbook1.counter.asset_code),
        bp1: orderbook1.bids[0].price,
        ap1: orderbook1.asks[0].price,

        ba2: notNullAsseet(orderbook2.base.asset_code),
        ca2: notNullAsseet(orderbook2.counter.asset_code),
        bp2: orderbook2.bids[0].price,
        ap2: orderbook2.asks[0].price,

        ba3: notNullAsseet(orderbook3.base.asset_code),
        ca3: notNullAsseet(orderbook3.counter.asset_code),
        bp3: orderbook3.bids[0].price,
        ap3: orderbook3.asks[0].price,

        ie: impliedExchangeRate.toString(),
        ae: actualExchangeRate.toString(),

        profit: profit.toString(),
      });*/

      if (profit > 0.0 || revprofit > 0.0) {
        console.log('WE FOuND PROFIT');
      }

      console.log(`Pair 1 Arbitrage opportunity assessed, profit of ${profit.toFixed(2)}%.`);
      console.log(`Pair 2 Arbitrage opportunity assessed, profit of ${revprofit.toFixed(2)}%.`);
    //}
  // }
}

async function storeArbOpportunity(data: any) {
  await prisma.post.create({
    data: data,
  });
}

async function main() {
  console.log('Started');

  const ledgersStream = server
    .ledgers()
    .cursor('now')
    .stream({
      onmessage: async (ledger: any) => {
        console.log(`${new Date()} New ledger created with sequence ${ledger.sequence}` );
        await findArbitrageOpportunities();
        console.log('------------------ Looking for arb finished ------------------');
      },
      onerror: (error: any) => {
        console.error('Error in ledgers stream:', error);
      }
    });
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })


