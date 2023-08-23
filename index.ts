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

const paths = [
                [assets[0], assets[1], assets[2], assets[0]],
                [assets[0], assets[2], assets[1], assets[0]]
              ]

const address = 'GAS2EAREA5VSJ6Y4RJLV7Y2FSTXNHOC455NKNP3DM5CULXDFMB5OSGOD' ;

function notNullAsseet(a: any) {
  if (typeof a === 'undefined') {
    return 'XLM';
  }
  return a;
}

async function fetchBalance(publickey: string, assetcode: string) {

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
    return null;
  });
}

async function fetchOrderBook(paths: any) {

    const orderBook: any[][] = [];

    for(let i=0; i<paths.length; i++) {
      const pathOrderBook: any[] = [];

      for(let j=0; j<paths[i].length-1; j++) {
        try {
          pathOrderBook[i].push(await server.orderbook(paths[i][j], paths[i][j+1]).call()) ;
        } catch (error) {
          throw new Error('Failed to fetch order book');
        }
      }
      orderBook.push(pathOrderBook);
    }
  return orderBook;
  
}

async function fetchTradedAsset(availableasset: any, orderBook:any) {
    
    let balAmount: any[][] = []; // this stores the unused amount of asset while a swap i got 10 from last swap but next swap only need 4 this will store 6
    let tradeAmount: any[][] = []; // this stores the amount of asset used for the swap
    const startAmount = new BigNumber(availableasset);

    for(let i=0; i<paths.length; i++) {
      
      let curramount = startAmount;
      let pairBalance = [];
      let pairTraded = [];

      for(let j=0; j<orderBook[i].length; j++) {

        const bidamount = new BigNumber(orderBook[i][j].bids[0].amount);
        const check = curramount.comparedTo(bidamount); 

        if(check === 1) {
          pairBalance.push(curramount.minus(bidamount));
          pairTraded.push(bidamount) ;
        } else {
          pairBalance.push(new BigNumber (0)) ;
          pairTraded.push(curramount) ;
        } 
        curramount = await pairTraded[j].times(new BigNumber(orderBook[i][j].bids[0].price));
      }

      pairTraded.push(curramount); // pushes last traded asset pair
          
      balAmount.push(pairBalance); 
      tradeAmount.push(pairTraded);

      // corrects the extra traded asset 
      for(let j=2; j>0; j--) { // traverses back collects the extra asset and reduces it from previoous balances
          
        if(balAmount[i][j].comparedTo('0') == 1) {
          const exasset = await balAmount[i][j].dividedBy(new BigNumber(orderBook[i][j-1].bids[0].price));
          balAmount[i][j-1] = balAmount[i][j-1].plus(exasset);
          tradeAmount[i][j-1] = tradeAmount[i][j-1].minus(exasset);
          balAmount[i][j] = 0; // clears remaining balance.
        }
      }
    }
    
  return tradeAmount;
}

async function findArbitrageOpportunities() {

    const fee = await server.fetchBaseFee() * 0.0000001 * 3;
    const availableasset = await fetchBalance(address, "native");

    if( availableasset === null) {
      console.log('null balance');
      return ;
    }

    const orderBook = await fetchOrderBook(paths);
    const tradeAmount = await fetchTradedAsset(availableasset, orderBook);

    for(let i=0; i<paths.length; i++) {
      for(let j=0; j<orderBook[i].length; ++j) {
        console.log('pair', j+1, notNullAsseet(orderBook[i][j].base.asset_code), notNullAsseet(orderBook[i][j].counter.asset_code), orderBook[i][j].bids[0].price, orderBook[i][j].asks[0].price);
      } console.log('------------------ path', i+1, '------------------')
    }
    
    for(let i=0; i<paths.length; i++) {
      const profit = await tradeAmount[i][3].minus(tradeAmount[i][0]).minus(fee).dividedBy(tradeAmount[i][0]).times(100);
      console.log('Path', i+1, 'Trade Amounts', tradeAmount[i][0].toString(), tradeAmount[i][1].toString(), tradeAmount[i][2].toString());
      console.log(`Path`, i+1, `Arbitrage opportunity assessed, profit of ${profit.toFixed(2)}%.`);
    }

    //const impliedExchangeRate = new BigNumber(orderbook1.bids[0].price).times(new BigNumber(orderbook2.bids[0].price));
    //const actualExchangeRate = new BigNumber(orderbook3.bids[0].price);

    //PN: my prop, volume not considered anyway
    //impliedExchangeRate = new BigNumber(orderbook1.bids[0].price).times(new BigNumber(orderbook2.bids[0].price));
    //impliedExchangeRate = new BigNumber(impliedExchangeRate).times(new BigNumber(orderbook3.bids[0].price));
    //impliedExchangeRate = new BigNumber(impliedExchangeRate).times(new BigNumber(orderbook1.bids[0].price));

    //console.log('ie', impliedExchangeRate.toString(), 'ae', actualExchangeRate.toString());

    //if (impliedExchangeRate > actualExchangeRate) {
      
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

if(require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect()
    })
    .catch(async (e) => {
      console.error(e)
      await prisma.$disconnect()
      process.exit(1)
    })
  }


export {
  paths,
  address,
  fetchBalance,
  fetchOrderBook
}



