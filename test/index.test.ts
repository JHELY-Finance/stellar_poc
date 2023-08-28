import { beforeEach, describe, it } from "node:test";

const {Server} = require('stellar-sdk');
const { expect } = require('chai');
const sinon = require('sinon');
const {
  paths,
  address,
  fetchBalance,
  fetchOrderBook
} = require('../index');

describe('fetchBalance', ()=> {

    it('should fetch the balance', async () => {
      const result = await fetchBalance(address, 'native');
      expect(result).to.not.equal(null);
    });

    it('should handle invalid asset type while fetching balance', async () => {
      const result = await fetchBalance(address, 'invalid asset-type');
      expect(result).to.equal(null);
    });

    it('should handle invalid address while fetching balance', async () => {
      const result = await fetchBalance('invalid address', 'native');
      expect(result).to.equal(null);
    });

});

describe('fetchOrderBook', ()=> {

  it('should fetch orderbook and handle error', async () => {
    
    try {
      const result = await fetchOrderBook(paths);
      expect(result).to.be.an('array').that.is.not.empty;
    } catch (error: any) {
      expect(error.message).to.equal('Failed to fetch order book'); 
    }
  });

});

