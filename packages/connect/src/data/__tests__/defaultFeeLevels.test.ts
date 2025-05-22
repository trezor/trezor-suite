import { getEthereumFeeLevels } from '../defaultFeeLevels';

describe('getEthereumFeeLevels', () => {
    const fixtures = {
        eth: {
            defaultGas: 15,
            minFee: 0.1,
            maxFee: 10000,
            coinInfo: {
                chain: 'eth',
                blocktime_seconds: 12,
            },
            expected: {
                blockTime: 12,
                defaultFees: [
                    {
                        label: 'normal',
                        feePerUnit: '10000000000', // 10 Gwei * 1e9 = 15000000000 Wei
                        feeLimit: '21000',
                        blocks: -1,
                    },
                ],
                minFee: 0.1,
                maxFee: 10000,
                minPriorityFee: 0,
                dustLimit: -1,
            },
        },
        pol: {
            defaultGas: 200,
            minFee: 0.1,
            maxFee: 10000000,
            coinInfo: {
                chain: 'pol',
                blocktime_seconds: 2,
            },
            expected: {
                blockTime: 2,
                defaultFees: [
                    {
                        label: 'normal',
                        feePerUnit: '200000000000', // 200 Gwei * 1e9 = 200000000000 Wei
                        feeLimit: '21000',
                        blocks: -1,
                    },
                ],
                minFee: 0.1,
                maxFee: 10000000,
                minPriorityFee: 30,
                dustLimit: -1,
            },
        },
        base: {
            defaultGas: 0.01,
            minFee: 0.000000001,
            maxFee: 100,
            coinInfo: {
                chain: 'base',
                blocktime_seconds: 2,
            },
            expected: {
                blockTime: 2,
                defaultFees: [
                    {
                        label: 'normal',
                        feePerUnit: '10000000', // 0.01 Gwei * 1e9 = 10000000 Wei
                        feeLimit: '21000',
                        blocks: -1,
                    },
                ],
                minFee: 0.0000001,
                maxFee: 1000,
                minPriorityFee: 0,
                dustLimit: -1,
            },
        },
        unknown: {
            defaultGas: 5,
            minFee: 0.000000001,
            maxFee: 10000,
            coinInfo: {
                chain: 'meme',
                blocktime_seconds: 100,
            },
            expected: {
                blockTime: 100,
                defaultFees: [
                    {
                        label: 'normal',
                        feePerUnit: '1000000000', // 1 Gwei * 1e9 = 1000000000 Wei
                        feeLimit: '21000',
                        blocks: -1,
                    },
                ],
                minFee: 0.000000001,
                maxFee: 10000,
                minPriorityFee: 0,
                dustLimit: -1,
            },
        },
    };

    Object.entries(fixtures).forEach(([chain, { expected, coinInfo }]) => {
        it(`should return correct fee levels for ${chain}`, () => {
            // @ts-expect-error
            const result = getEthereumFeeLevels(coinInfo);

            expect(result).toEqual(expected);
        });
    });
});
