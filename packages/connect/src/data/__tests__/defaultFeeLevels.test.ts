import { getEthereumFeeLevels } from '../defaultFeeLevels';

describe('getEthereumFeeLevels', () => {
    const fixtures = {
        eth: {
            defaultGas: 15,
            minFee: 1,
            maxFee: 10000,
            expected: {
                blockTime: -1,
                defaultFees: [
                    {
                        label: 'normal',
                        feePerUnit: '15000000000', // 15 Gwei * 1e9 = 15000000000 Wei
                        feeLimit: '21000',
                        blocks: -1,
                    },
                ],
                minFee: 1,
                maxFee: 10000,
                dustLimit: -1,
            },
        },
        pol: {
            defaultGas: 200,
            minFee: 1,
            maxFee: 10000000,
            expected: {
                blockTime: -1,
                defaultFees: [
                    {
                        label: 'normal',
                        feePerUnit: '200000000000', // 200 Gwei * 1e9 = 200000000000 Wei
                        feeLimit: '21000',
                        blocks: -1,
                    },
                ],
                minFee: 1,
                maxFee: 10000000,
                dustLimit: -1,
            },
        },
        base: {
            defaultGas: 0.01,
            minFee: 0.000000001,
            maxFee: 100,
            expected: {
                blockTime: -1,
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
                dustLimit: -1,
            },
        },
        unknown: {
            defaultGas: 5,
            minFee: 0.000000001,
            maxFee: 10000,
            expected: {
                blockTime: -1,
                defaultFees: [
                    {
                        label: 'normal',
                        feePerUnit: '5000000000', // 5 Gwei * 1e9 = 5000000000 Wei
                        feeLimit: '21000',
                        blocks: -1,
                    },
                ],
                minFee: 0.000000001,
                maxFee: 10000,
                dustLimit: -1,
            },
        },
    };

    Object.entries(fixtures).forEach(([chain, { expected }]) => {
        it(`should return correct fee levels for ${chain}`, () => {
            const result = getEthereumFeeLevels(chain);

            expect(result).toEqual(expected);
        });
    });
});
