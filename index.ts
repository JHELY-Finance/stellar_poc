import { PrismaClient } from '@prisma/client';

const StellarSdk = require('stellar-sdk');
const BigNumber = require('bignumber.js');

const server = new StellarSdk.Server('https://horizon.stellar.org');
const prisma = new PrismaClient();

const assetA = new StellarSdk.Asset('XLM');
const assetB = new StellarSdk.Asset('USDC', 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
const assetC = new StellarSdk.Asset('BTC', 'GDPJALI4AZKUU2W426U5WKMAT6CN3AJRPIIRYR2YM54TL2GDWO5O2MZM');

function notNullAsseet(a) {
  if (typeof a === 'undefined') {
    return 'XLM';
  }
  return a;
}

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

    console.log('ob1', notNullAsseet(orderbook1.base.asset_code), notNullAsseet(orderbook1.counter.asset_code), orderbook1.bids[0].price, orderbook1.asks[0].price);
    console.log('ob2', notNullAsseet(orderbook2.base.asset_code), notNullAsseet(orderbook2.counter.asset_code), orderbook2.bids[0].price, orderbook2.asks[0].price);
    console.log('ob3', notNullAsseet(orderbook3.base.asset_code), notNullAsseet(orderbook3.counter.asset_code), orderbook3.bids[0].price, orderbook3.asks[0].price);

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

      storeArbOpportunity({
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
      });

      console.log(`Arbitrage opportunity found, profit of ${profit.toFixed(2)}%.`);
    }
  }
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
      onmessage: async (ledger: Ledger) => {
        // This code will execute every time a new ledger is created

        console.log(`New ledger created with sequence ${ledger.sequence}`);

        await findArbitrageOpportunities();
        console.log('------------------ Looking for arb finished ------------------');
      },
      onerror: (error) => {
        console.error('Error in ledgers stream:', error);
      }
    });

  /*
  console.log('aaa');
  await prisma.post.create({
    data: {
      ba1: 'xyz',
      ca1: 'xyz',
      bp1: 'xyz',
      ap1: 'xyz',

      ba2: 'xyz',
      ca2: 'xyz',
      bp2: 'xyz',
      ap2: 'xyz',
      ba3: 'xyz',
      ca3: 'xyz',
      bp3: 'xyz',
      ap3: 'xyz',

      ie: 'xyz',
      ae: 'xyz',

      profit: 'xyz',
    },
  });


  const allPosts = await prisma.post.findMany();
  console.log(allPosts);*/
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