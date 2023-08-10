import { PrismaClient } from '@prisma/client';

const StellarSdk = require('stellar-sdk');
const BigNumber = require('bignumber.js');

const server = new StellarSdk.Server('https://horizon.stellar.org');
const prisma = new PrismaClient();

const assets = [
                new StellarSdk.Asset('XLM'), 
                new StellarSdk.Asset('USDC', 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'),
                new StellarSdk.Asset('BTC', 'GDPJALI4AZKUU2W426U5WKMAT6CN3AJRPIIRYR2YM54TL2GDWO5O2MZM')
              ]

const address = 'GD3VDQXZMEDFWJCNIZXYJWT5VXKQ352MFGQ5F4RHJ5NZRPRGZCMHFRQL' ;

function notNullAsseet(a: any) {
  if (typeof a === 'undefined') {
    return 'XLM';
  }
  return a;
}

async function fetchbalance(publickey: string, assetcode: string) {

  return server.loadAccount(publickey)
    .then((account: any) => {
      const balances = account.balances
      const assetbalance = balances.find((balance: any) =>
        balance.asset_type === assetcode
    );

    if (assetbalance) {
      return assetbalance.balance;
    } else {
      return null;
    }
  })
  .catch((error: any) => {
    console.error('Error', error);
    return null;
  });
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
    const availableasset = await fetchbalance(address, "native");

    if( availableasset === null) {
      console.log('null balance');
      return ;
    }

    let orderBook = [];
    let revorderBook = [];

    for(let i=0; i<3; i++) {
      orderBook.push(await server.orderbook(assets[i], assets[(i+1)%3]).call()) ;
    }
    for(let i=3; i>0; i--) {
      revorderBook.push(await server.orderbook(assets[i%3], assets[(i-1)%3]).call()) ;
    }
    
    // const orderbook1 = await server.orderbook(assetA, assetB).call();
    // const orderbook2 = await server.orderbook(assetB, assetC).call();
    // const orderbook3 = await server.orderbook(assetC, assetA).call();
    // const revorderbook1 = await server.orderbook(assetA, assetC).call();
    // const revorderbook2 = await server.orderbook(assetC, assetB).call();
    // const revorderbook3 = await server.orderbook(assetB, assetA).call();

    for(let i=0; i<3; ++i) {
      console.log('pair', i+1, notNullAsseet(orderBook[i].base.asset_code), notNullAsseet(orderBook[i].counter.asset_code), orderBook[i].bids[0].price, orderBook[i].asks[0].price);
    } console.log('------------------ path 1 ------------------')

    for(let i=0; i<3; ++i) {
      console.log('path', i+1, notNullAsseet(revorderBook[i].base.asset_code), notNullAsseet(revorderBook[i].counter.asset_code), revorderBook[i].bids[0].price, revorderBook[i].asks[0].price);
    }  console.log('------------------ path 2 ------------------')
    
    // console.log('ob1', notNullAsseet(orderbook1.base.asset_code), notNullAsseet(orderbook1.counter.asset_code), orderbook1.bids[0].price, orderbook1.asks[0].price);
    // console.log('ob2', notNullAsseet(orderbook2.base.asset_code), notNullAsseet(orderbook2.counter.asset_code), orderbook2.bids[0].price, orderbook2.asks[0].price);
    // console.log('ob3', notNullAsseet(orderbook3.base.asset_code), notNullAsseet(orderbook3.counter.asset_code), orderbook3.bids[0].price, orderbook3.asks[0].price);
    
    // console.log('revob1', notNullAsseet(revorderbook1.base.asset_code), notNullAsseet(revorderbook1.counter.asset_code), revorderbook1.bids[0].price, revorderbook1.asks[0].price);
    // console.log('revob2', notNullAsseet(revorderbook2.base.asset_code), notNullAsseet(revorderbook2.counter.asset_code), revorderbook2.bids[0].price, revorderbook2.asks[0].price);
    // console.log('revob3', notNullAsseet(revorderbook3.base.asset_code), notNullAsseet(revorderbook3.counter.asset_code), revorderbook3.bids[0].price, revorderbook3.asks[0].price);
    // console.log('------------------ pair 2 ------------------')

    //const impliedExchangeRate = new BigNumber(orderbook1.bids[0].price).times(new BigNumber(orderbook2.bids[0].price));
    //const actualExchangeRate = new BigNumber(orderbook3.bids[0].price);

    //PN: my prop, volume not considered anyway
    //impliedExchangeRate = new BigNumber(orderbook1.bids[0].price).times(new BigNumber(orderbook2.bids[0].price));
    //impliedExchangeRate = new BigNumber(impliedExchangeRate).times(new BigNumber(orderbook3.bids[0].price));
    //impliedExchangeRate = new BigNumber(impliedExchangeRate).times(new BigNumber(orderbook1.bids[0].price));


    //console.log('ie', impliedExchangeRate.toString(), 'ae', actualExchangeRate.toString());

    //if (impliedExchangeRate > actualExchangeRate) {
       
      const startAmount = new BigNumber(availableasset);
      let curramount = startAmount;
      let balAmount: any[] = []; // this stores the unused amount of asset while a swap i got 10 from last swap but next swap only need 4 this will store 6
      let tradeAmount: any[] = []; // this stores the amount of asset used
      
      const revstartAmount = new BigNumber(availableasset);
      let revcurramount = startAmount;
      let revbalAmount: any[] = []; // this stores the unused amount of asset while a swap i got 10 from last swap but next swap only need 4 this will store 6
      let revtradeAmount: any[] = []; // this stores the amount of asset used

      for(let i=0; i<3; i++) {
        const bidamount = new BigNumber(orderBook[i].bids[0].amount);
        const check = await curramount.comparedTo(bidamount); 
        if(check === 1) {
          balAmount.push(curramount.minus(bidamount));
          tradeAmount.push(bidamount) ;
        } else {
          tradeAmount.push(curramount) ;
          balAmount.push(new BigNumber (0)) ;
        }
        curramount = await tradeAmount[i].times(new BigNumber(orderBook[i].bids[0].price));

        // 2nd pair
        const revbidamount = new BigNumber(revorderBook[i].bids[0].amount);
        const revcheck = await revcurramount.comparedTo(revbidamount); 
        if(revcheck === 1) {
          revbalAmount.push(revcurramount.minus(revbidamount));
          revtradeAmount.push(revbidamount) ;
        } else {
          revtradeAmount.push(revcurramount) ;
          revbalAmount.push(new BigNumber (0)) ;
        }
        revcurramount = await revtradeAmount[i].times(new BigNumber(revorderBook[i].bids[0].price));
        
      }
      tradeAmount.push(curramount) // pushes the last available asset in base currency
      revtradeAmount.push(revcurramount)


      // Corrects the extra traded asset 
      for(let i=2; i>0; i--) { // traverses back collects the extra asset and reduces it from previoous balances
        if(balAmount[i].comparedTo('0') == 1) {
          
          const exasset = await balAmount[i].dividedBy(new BigNumber(orderBook[i-1].bids[0].price));
          // console.log(i+1, balAmount[i].toString(), exasset.toString()); // debug
          balAmount[i-1] = balAmount[i-1].plus(exasset);
          tradeAmount[i-1] = tradeAmount[i-1].minus(exasset);
          balAmount[i] = 0;
        }

        if(revbalAmount[i].comparedTo('0') == 1) {
          
          const revexasset = await revbalAmount[i].dividedBy(new BigNumber(revorderBook[i-1].bids[0].price));
          // console.log(i+1, balAmount[i].toString(), exasset.toString()); // debug
          revbalAmount[i-1] = revbalAmount[i-1].plus(revexasset);
          revtradeAmount[i-1] = revtradeAmount[i-1].minus(revexasset);
          revbalAmount[i] = 0;
        }
      }
      console.log('Pair 1 Trade Amounts', tradeAmount[0].toString(), tradeAmount[1].toString(), tradeAmount[2].toString());
      console.log('Pair 2 Trade Amounts', revtradeAmount[0].toString(), revtradeAmount[1].toString(), revtradeAmount[2].toString())
      
      const profit = await tradeAmount[3].minus(tradeAmount[0]).minus(fee).dividedBy(tradeAmount[0]).times(100);
      const revprofit = await revtradeAmount[3].minus(revtradeAmount[0]).minus(fee).dividedBy(revtradeAmount[0]).times(100);

      // const tradeAmount1 = startAmount.times(new BigNumber(orderbook1.bids[0].price));
      // const tradeAmount2 = tradeAmount1.times(new BigNumber(orderbook2.bids[0].price));
      // const tradeAmount3 = tradeAmount2.times(new BigNumber(orderbook3.bids[0].price));

      // const revtradeAmount1 = startAmount.times(new BigNumber(revorderbook1.bids[0].price));
      // const revtradeAmount2 = revtradeAmount1.times(new BigNumber(revorderbook2.bids[0].price));
      // const revtradeAmount3 = revtradeAmount2.times(new BigNumber(revorderbook3.bids[0].price));
      

      // console.log('pair 1 Trade amounts :', tradeAmount1.toString(),  tradeAmount2.toString(), tradeAmount3.toString());
      // const profit = await tradeAmount3.minus(startAmount).minus(fee).dividedBy(startAmount).times(100);

      // console.log('pair 2 Trade amounts :', revtradeAmount1.toString(), revtradeAmount2.toString(),  revtradeAmount3.toString());
      // const revprofit = await revtradeAmount3.minus(startAmount).minus(fee).dividedBy(startAmount).times(100);

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
        console.log(`New ledger created with sequence ${ledger.sequence}`);
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




