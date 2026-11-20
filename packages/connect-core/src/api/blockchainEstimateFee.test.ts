import type { CoinInfo, CoinSymbol, FeeLevel } from '@trezor/connect-common';

import type BlockchainEstimateFeeMethod from './blockchainEstimateFee';

const mockEstimateFee = jest.fn();
// Replaces fields of the coin the method resolves, e.g. its default levels.
let mockCoinInfoPatch: Partial<CoinInfo> = {};

jest.mock('../backend/BlockchainLink', () => ({
    assertBackendSupported: jest.fn(),
    initBlockchain: () => Promise.resolve({ estimateFee: mockEstimateFee }),
}));

jest.mock('../data/coinInfo', () => {
    const actual = jest.requireActual('../data/coinInfo');

    return {
        ...actual,
        getCoinInfoOrThrow: (coin: string) => ({
            ...actual.getCoinInfoOrThrow(coin),
            ...mockCoinInfoPatch,
        }),
    };
});

const BITCOIN_DEFAULT_FEES: FeeLevel[] = [
    { label: 'high', blocks: 1, feePerUnit: '222' },
    { label: 'normal', blocks: 10, feePerUnit: '111' },
    { label: 'low', blocks: 40, feePerUnit: '77' },
    { label: 'economy', blocks: 80, feePerUnit: '22' },
];

// Fees decrease linearly with the requested number of blocks; there's none for `missingBlock`.
const estimateBitcoinFees =
    (missingBlock?: number) =>
    ({ blocks }: { blocks: number[] }) =>
        Promise.resolve(
            blocks.map(block => ({
                feePerUnit: block === missingBlock ? '-1' : `${10_000 - block * 100}`,
            })),
        );

const SOL_DEFAULT_LEVEL: FeeLevel = { label: 'normal', blocks: -1, feePerUnit: '5000' };

const ETH_REQUEST = { blocks: [1] };

const eip1559Tier = (
    maxFeePerGas: string,
    maxPriorityFeePerGas: string,
    maxWaitTimeEstimate?: number,
) => ({ maxFeePerGas, maxPriorityFeePerGas, maxWaitTimeEstimate });

describe('BlockchainEstimateFee', () => {
    let BlockchainEstimateFee: typeof BlockchainEstimateFeeMethod;

    // Each test starts without the levels remembered by the earlier ones.
    beforeEach(() => {
        mockEstimateFee.mockReset();
        mockCoinInfoPatch = {};
        jest.isolateModules(() => {
            ({ default: BlockchainEstimateFee } = require('./blockchainEstimateFee'));
        });
    });

    const estimateFeeLevels = async (
        coin: CoinSymbol,
        request: { blocks?: number[] } = {},
        feeLevels: 'preloaded' | 'smart' = 'smart',
    ) => {
        const { levels } = await new BlockchainEstimateFee({
            payload: { method: 'blockchainEstimateFee', coin, request: { ...request, feeLevels } },
        }).run({ sendCoreMessage: jest.fn() } as any);

        return levels;
    };

    const estimateFeesPerUnit = async (...params: Parameters<typeof estimateFeeLevels>) =>
        (await estimateFeeLevels(...params)).map(level => level.feePerUnit);

    describe('Bitcoin', () => {
        it('turns estimates in sat/kB into levels', async () => {
            mockCoinInfoPatch = { defaultFees: BITCOIN_DEFAULT_FEES };
            mockEstimateFee.mockImplementation(estimateBitcoinFees());

            expect(await estimateFeeLevels('btc', {}, 'preloaded')).toEqual(BITCOIN_DEFAULT_FEES);
            expect(await estimateFeesPerUnit('btc')).toEqual(['9.9', '9', '6', '2']);
            expect(mockEstimateFee).toHaveBeenCalledWith({ blocks: [1, 10, 40, 80] });
        });

        // Testnet has only the 'normal' level.
        it.each([
            ['btc', BITCOIN_DEFAULT_FEES, ['9.9', '9', '6', '22']],
            ['test', BITCOIN_DEFAULT_FEES.filter(level => level.label === 'normal'), ['9']],
        ] as const)(
            'keeps the default of a level without a valid estimate (%s)',
            async (coin, defaultFees, expected) => {
                mockCoinInfoPatch = { defaultFees: [...defaultFees] };
                // No estimate for the 'economy' level.
                mockEstimateFee.mockImplementation(estimateBitcoinFees(80));

                expect(await estimateFeeLevels(coin, {}, 'preloaded')).toEqual(defaultFees);
                expect(await estimateFeesPerUnit(coin)).toEqual(expected);
            },
        );
    });

    describe('Solana', () => {
        beforeEach(() => {
            mockCoinInfoPatch = {
                minFee: 5_000,
                maxFee: 1_000_000,
                defaultFees: [SOL_DEFAULT_LEVEL],
            };
        });

        it('merges each estimate into the default level, not into an earlier one', async () => {
            mockEstimateFee
                .mockResolvedValueOnce([{ feePerUnit: '8000', feeLimit: '1234' }])
                .mockResolvedValueOnce([{ feePerUnit: '9000' }]);

            expect(await estimateFeeLevels('sol')).toEqual([
                { ...SOL_DEFAULT_LEVEL, feePerUnit: '8000', feeLimit: '1234' },
            ]);
            expect(await estimateFeeLevels('sol')).toEqual([
                { ...SOL_DEFAULT_LEVEL, feePerUnit: '9000' },
            ]);
            expect(mockEstimateFee).toHaveBeenCalledWith({ feeLevels: 'smart' });
        });

        it.each([
            ['minimum', '100', '5000'],
            ['maximum', '9999999999', '1000000'],
        ])('clamps a fee to the %s', async (_, feePerUnit, expected) => {
            mockEstimateFee.mockResolvedValue([{ feePerUnit }]);

            expect(await estimateFeesPerUnit('sol')).toEqual([expected]);
        });

        it('keeps the default or last levels when the backend fails, and returns them as preloaded', async () => {
            const backendError = new Error('backend down');
            mockEstimateFee
                .mockRejectedValueOnce(backendError)
                .mockResolvedValueOnce([{ feePerUnit: '8000' }])
                .mockRejectedValueOnce(backendError);
            const estimated = [{ ...SOL_DEFAULT_LEVEL, feePerUnit: '8000' }];

            expect(await estimateFeeLevels('sol')).toEqual([SOL_DEFAULT_LEVEL]);
            expect(await estimateFeeLevels('sol')).toEqual(estimated);
            expect(await estimateFeeLevels('sol')).toEqual(estimated);
            expect(await estimateFeeLevels('sol', {}, 'preloaded')).toEqual(estimated);
        });
    });

    describe('Ethereum', () => {
        it('turns an EIP-1559 estimate into three levels', async () => {
            mockEstimateFee.mockResolvedValue([
                {
                    feePerUnit: '2852176196', // 2.852... Gwei
                    feeLimit: '53000',
                    eip1559: {
                        baseFeePerGas: '2852106196',
                        // For ETH, 50 s is more than 4 blocks and less than 5, so it rounds up.
                        low: eip1559Tier('2888191117', '36084921', 50000),
                        medium: eip1559Tier('5019411861', '940900000', 36000),
                        high: eip1559Tier('8559844250', '2000000000', 24000),
                    },
                },
            ]);
            const level = (
                label: FeeLevel['label'],
                blocks: number,
                maxFeePerGas: string,
                maxPriorityFeePerGas: string,
            ) => ({
                label,
                blocks,
                feePerUnit: '2852176196',
                feeLimit: '53000',
                baseFeePerGas: '2852106196',
                maxFeePerGas,
                maxPriorityFeePerGas,
            });

            expect(await estimateFeeLevels('eth', ETH_REQUEST, 'preloaded')).toHaveLength(1);
            expect(await estimateFeeLevels('eth', ETH_REQUEST)).toEqual([
                level('low', 5, '2888191117', '36084921'),
                level('normal', 3, '5019411861', '940900000'),
                level('high', 2, '8559844250', '2000000000'),
            ]);
        });

        it.each([
            ['clamps a zero gas price to the minimum', '0', '1000000'],
            ['rounds a decimal gas price to integer wei', '1500000000.7', '1500000001'],
            ['clamps an over-limit gas price to the maximum', '100000000000000', '10000000000000'],
        ])('%s', async (_, feePerUnit, expected) => {
            mockEstimateFee.mockResolvedValue([{ feePerUnit }]);

            expect(await estimateFeesPerUnit('eth', ETH_REQUEST)).toEqual([expected]);
        });

        it.each([
            [
                'minimum fee of Ethereum (0.001 Gwei)',
                'eth',
                {
                    feePerUnit: '2000000000',
                    feeLimit: '21000',
                    eip1559: {
                        baseFeePerGas: '1000000000',
                        low: eip1559Tier('0', '0'),
                        medium: eip1559Tier('0', '0'),
                        high: eip1559Tier('0', '0'),
                    },
                },
                { maxFeePerGas: '1000000' },
            ],
            [
                'minimum priority fee of Polygon (30 Gwei)',
                'pol',
                {
                    feePerUnit: '30000000000', // 30 Gwei
                    feeLimit: '21000',
                    eip1559: {
                        baseFeePerGas: '28000000000',
                        low: eip1559Tier('18000000000', '1000000000', 6000),
                        medium: eip1559Tier('20000000000', '2000000000', 4000),
                        high: eip1559Tier('22000000000', '3000000000', 2000),
                    },
                },
                { maxFeePerGas: '30000000000', maxPriorityFeePerGas: '30000000000' },
            ],
        ] as const)('raises EIP-1559 fees to the %s', async (_, coin, estimate, expected) => {
            mockEstimateFee.mockResolvedValue([estimate]);

            expect(await estimateFeeLevels(coin, ETH_REQUEST)).toEqual(
                Array(3).fill(expect.objectContaining(expected)),
            );
        });

        it('turns a legacy estimate into a single level', async () => {
            // A gas price of 5 Gwei.
            mockEstimateFee.mockResolvedValue([{ feePerUnit: '5000000000', feeLimit: '21000' }]);

            expect(await estimateFeeLevels('bsc', ETH_REQUEST)).toEqual([
                expect.objectContaining({
                    label: 'normal',
                    feePerUnit: '5000000000',
                    feeLimit: '21000',
                }),
            ]);
        });
    });
});
