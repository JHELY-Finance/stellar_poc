import { beforeEach, describe, it } from "node:test";

const {Server} = require('stellar-sdk');
const { expect } = require('chai');
const sinon = require('sinon');
const {
  pairs,
  address,
  fetchBalance,
  fetchOrderBook
} = require('../index');

describe('fetchBalance', ()=> {

    it('should fetch the balance', async () => {
        
      const result = await fetchBalance(address, 'native');
      expect(result).to.equal('14084.5394991');

    });

    it('should handle error while fetching balance', async () => {

      const result = await fetchBalance(address, 'native');
      expect(result).to.not.equal(null);

  });
});

describe('fetchOrderBook', ()=> {

  const mockServer = sinon.createStubInstance(Server);

  it('should fetch orderbook and handle error', async () => {
    
    try {
      const result = await fetchOrderBook(pairs);
      expect(result).to.be.an('array').that.is.not.empty;

    } catch (error: any) {
      expect(error).to.equal('Failed to fetch order book');
      
    }

  });

});

