import { expect } from 'chai';
import { fetchOffers, processOffers } from '../arbTriangle';

describe('fetchOffers', () => {
  it('should fetch offers successfully', async () => {
    const url = 'https://example.com/offers'; // Replace with your test URL
    const params = {}; // Replace with your test parameters

    try {
      const responseData = await fetchOffers(url, params);
      expect(responseData).to.be.an('object'); // Modify this expectation based on your API response
    } catch (error) {
      // Handle any errors or assertions if needed
      expect.fail('Unexpected error occurred');
    }
  });

  // Add more test cases as needed
});

describe('processOffers', () => {
  it('should process offers data', () => {
    const jsonData = {
      _embedded: {
        records: [
          // Replace with sample offer data
        ],
      },
    };

    try {
      const processResult = processOffers(jsonData);
      expect(processResult).to.equal(undefined); // Modify as needed
    } catch (error) {
      // Handle any errors or assertions if needed
      expect.fail('Unexpected error occurred');
    }
  });

  // Add more test cases as needed
});
