import { getEthereumFeeLevels } from './defaultFeeLevels';

describe('getEthereumFeeLevels', () => {
    const fixtures = {
        eth: {
            defaultGas: 3,
            minFee: 0.001,
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
                        feePerUnit: '3000000000', // 3 Gwei * 1e9 = 3000000000 Wei
                        feeLimit: '21000',
                        blocks: -1,
                    },
                ],
                minFee: 0.001,
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
        rhc: {
            defaultGas: 0.1,
            minFee: 0.001,
            maxFee: 1000,
            coinInfo: {
                chain: 'rhc',
                blocktime_seconds: 0.1,
            },
            expected: {
                blockTime: 0.1,
                defaultFees: [
                    {
                        label: 'normal',
                        feePerUnit: '100000000', // 0.1 Gwei * 1e9 = 100000000 Wei
                        feeLimit: '21000',
                        blocks: -1,
                    },
                ],
                minFee: 0.001,
                maxFee: 1000,
                minPriorityFee: 0,
                dustLimit: -1,
            },
        },
        hype: {
            defaultGas: 0.1,
            minFee: 0.001,
            maxFee: 1000,
            coinInfo: {
                chain: 'hype',
                blocktime_seconds: 1,
            },
            expected: {
                blockTime: 1,
                defaultFees: [
                    {
                        label: 'normal',
                        feePerUnit: '100000000', // 0.1 Gwei * 1e9 = 100000000 Wei
                        feeLimit: '21000',
                        blocks: -1,
                    },
                ],
                minFee: 0.001,
                maxFee: 1000,
                minPriorityFee: 0,
                dustLimit: -1,
            },
        },
        arc: {
            defaultGas: 21,
            minFee: 20,
            maxFee: 10000,
            coinInfo: {
                chain: 'arc',
                blocktime_seconds: 1,
            },
            expected: {
                blockTime: 1,
                defaultFees: [
                    {
                        label: 'normal',
                        feePerUnit: '21000000000', // 21 Gwei * 1e9 = 21000000000 Wei
                        feeLimit: '21000',
                        blocks: -1,
                    },
                ],
                minFee: 20,
                maxFee: 10000,
                minPriorityFee: 0,
                dustLimit: -1,
            },
        },
        tarc: {
            defaultGas: 25,
            minFee: 20,
            maxFee: 10000,
            coinInfo: {
                chain: 'tarc',
                blocktime_seconds: 1,
            },
            expected: {
                blockTime: 1,
                defaultFees: [
                    {
                        label: 'normal',
                        feePerUnit: '25000000000', // 25 Gwei * 1e9 = 25000000000 Wei
                        feeLimit: '21000',
                        blocks: -1,
                    },
                ],
                minFee: 20,
                maxFee: 10000,
                minPriorityFee: 1,
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
