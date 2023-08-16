import axios from 'axios';
import fs from 'fs';

interface Asset {
    asset_code?: string;
}

export interface TradePair {
    base: Asset;
    counter: Asset;
}

let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://horizon.stellar.org/trades?trade_type=all&order=asc',
    headers: {
        'Accept': 'application/json'
    }
};

export async function getNonZeroLiquidityPairs(): Promise<TradePair[]> {
    console.log('Fetching trading pairs with non-zero liquidity...');
    try {
        const response = await axios(config);
        console.log('Trading pairs fetched successfully.');

        const tradingPairs: TradePair[] = response.data._embedded.records
            .filter((record: any) => parseFloat(record.base_amount) > 0 && parseFloat(record.counter_amount) > 0)
            .map((record: any) => ({
                base: {
                    asset_code: record.base_asset_code || 'XLM',
                },
                counter: {
                    asset_code: record.counter_asset_code || 'XLM',
                }
            }));

        // Display tradingPairs in the console
        console.log('Non-zero liquidity trading pairs:', tradingPairs);

        return tradingPairs;
    } catch (error) {
        throw new Error(`Error fetching trading pairs: ${error}`);
    }
}

export async function generateThirdAsset(tradePair: TradePair, tradePairs: TradePair[]): Promise<TradePair | null> {
    try {
        // Check if the tradePair's counter asset has a non-zero liquidity pair with any other asset
        const hasNonZeroLiquidityPair = tradePairs.some(pair =>
            pair.base.asset_code === tradePair.counter.asset_code &&
            pair.counter.asset_code !== tradePair.base.asset_code // Exclude the same asset pair
        );

        if (hasNonZeroLiquidityPair) {
            const thirdAsset: TradePair = {
                base: { ...tradePair.counter },
                counter: { ...tradePair.base },
            };
            return thirdAsset;
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Error generating third asset: ${error}`);
        return null;
    }
}


async function main() {
    try {
        const tradingPairs = await getNonZeroLiquidityPairs();
        const thirdAssets: TradePair[] = [];

        for (const tradePair of tradingPairs) {
            const thirdAsset = await generateThirdAsset(tradePair, tradingPairs);
            if (thirdAsset) {
                thirdAssets.push(thirdAsset);
            }
        }

        // Display generated third assets in the console
        console.log('Generated third assets:', thirdAssets);

        // Combine tradingPairs and thirdAssets
        const allAssets = [...tradingPairs, ...thirdAssets];

        // Save allAssets to a JSON file
        const outputPath = 'all_assets.json';
        fs.writeFileSync(outputPath, JSON.stringify(allAssets, null, 2));
        console.log(`All assets saved to ${outputPath}`);
    } catch (error) {
        console.error(`An error occurred: ${error}`);
    }
}

// Call the main function to start the process
main();