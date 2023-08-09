import axios from 'axios';
import StellarSdk from 'stellar-sdk';
import * as fs from 'fs';

interface Record {
    _embedded: {
        records: {
            base_asset_code?: string;
            counter_asset_code?: string;
            base_amount: string;
            counter_amount: string;
        }[];
    };
}

// Configure StellarSdk with the Horizon server URL
//StellarSdk.Network.use(new StellarSdk.Network("https://horizon.stellar.org"));

// Retrieve Trading Pairs
let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://horizon.stellar.org/trades?trade_type=all&order=asc',
    headers: {
        'Accept': 'application/json'
    }
};

axios(config)
    .then((response) => {
        const apiResponse: Record = response.data;

        // Extract the trading pairs from the API response with non-zero liquidity
        const tradingPairs = apiResponse._embedded.records
            .filter(record => parseFloat(record.base_amount) > 0 && parseFloat(record.counter_amount) > 0)
            .map(record => ({
                base: record.base_asset_code || 'XLM',
                quote: record.counter_asset_code || 'XLM'
            }));

        // Function to generate arbitrage triangles
        function generateTriangles(tradingPairs: { base: string; quote: string }[]): string[][] {
            const pairMap: { [key: string]: Set<string> } = {};

            // Build a map of base -> quote pairs
            for (const pair of tradingPairs) {
                if (!pairMap[pair.base]) {
                    pairMap[pair.base] = new Set();
                }
                pairMap[pair.base].add(pair.quote);
            }

            const triangles: string[][] = [];

            for (const pair1 of tradingPairs) {
                const pair1Quotes = pairMap[pair1.quote];
                if (pair1Quotes) {
                    const pair1QuoteArray = Array.from(pair1Quotes);
                    for (const pair2Quote of pair1QuoteArray) {
                        const pair2Quotes = pairMap[pair2Quote];
                        if (pair2Quotes && pair2Quotes.has(pair1.base)) {
                            triangles.push([pair1.base, pair1.quote, pair2Quote, pair1.base]);
                        }
                    }
                }
            }

            return triangles;
        }

        const arbitrageTriangles = generateTriangles(tradingPairs);

        // Store the arbitrage triangles in a JSON file
        const jsonContent = JSON.stringify(arbitrageTriangles, null, 2);
        fs.writeFileSync('arbitrage_triangles.json', jsonContent);

        console.log('Arbitrage triangles stored in arbitrage_triangles.json');
    })
    .catch((error) => {
        console.log(error);
    });