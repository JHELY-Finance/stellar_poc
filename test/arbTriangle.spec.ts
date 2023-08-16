import { expect } from 'chai';
import { getNonZeroLiquidityPairs, generateThirdAsset, TradePair } from '../arbTriangle';

describe('Trading Pairs Functions', function () {
    describe('getNonZeroLiquidityPairs', function () {
        it('should return an array of trading pairs with non-zero liquidity', async function () {
            const tradingPairs = await getNonZeroLiquidityPairs();
            expect(tradingPairs).to.be.an('array');
        });
    });

    describe('generateThirdAsset', function () {
        it('should generate a third asset for a valid trade pair', async function () {
            const tradePair: TradePair = {
                base: {
                    asset_code: 'ASSET1',
                },
                counter: {
                    asset_code: 'ASSET2',
                },
            };
            const tradingPairs: TradePair[] = [
            ];
            const thirdAsset = await generateThirdAsset(tradePair, tradingPairs);
            expect(thirdAsset).to.be.an('object');
        });

        it('should return null for a trade pair without a valid third asset', async function () {
            const tradePair: TradePair = {
                base: {
                    asset_code: 'ASSET1',
                },
                counter: {
                    asset_code: 'ASSET2',
                },
            };
            const tradingPairs: TradePair[] = [
            ];
            const thirdAsset = await generateThirdAsset(tradePair, tradingPairs);
            expect(thirdAsset).to.be.null;
        });
    });
});
