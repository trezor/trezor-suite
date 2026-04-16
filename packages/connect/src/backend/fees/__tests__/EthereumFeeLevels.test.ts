import { BlockchainLink } from '@trezor/blockchain-link';
import type { FeeLevel } from '@trezor/connect-common';
import coinsJSONEth from '@trezor/connect-data/files/coins-eth.json';
import coinsJSON from '@trezor/connect-data/files/coins.json';

import { getEthereumNetwork, parseCoinsJson } from '../../../data/coinInfo';
import { initBlockchain } from '../../BlockchainLink';
import { EthereumFeeLevels } from '../EthereumFeeLevels';

describe('api/ethereum/Fees', () => {
    parseCoinsJson({ ...coinsJSON, ...coinsJSONEth });

    const ETH_REQUEST = { blocks: [1] };

    const ETH_EIP1559_RESPONSE = [
        {
            feePerUnit: '2852176196', // 2.852... Gwei
            feeLimit: '53000',
            eip1559: {
                baseFeePerGas: '2852106196',
                low: {
                    maxFeePerGas: '2888191117',
                    maxPriorityFeePerGas: '36084921',
                    maxWaitTimeEstimate: 50000, // for ETH, more than 4 blocks, less than 5, should be rounded up
                },
                medium: {
                    maxFeePerGas: '5019411861',
                    maxPriorityFeePerGas: '940900000',
                    maxWaitTimeEstimate: 36000,
                },
                high: {
                    maxFeePerGas: '8559844250',
                    maxPriorityFeePerGas: '2000000000',
                    maxWaitTimeEstimate: 24000,
                },
            },
        },
    ];

    const BSC_LEGACY_RESPONSE = [
        {
            feePerUnit: '5000000000', // 5 Gwei
            feeLimit: '21000',
        },
    ];

    /* ---------------------------------------------------------------------- */
    /*  1) Ethereum mainnet – EIP-1559 happy-path                             */
    /* ---------------------------------------------------------------------- */
    it('Ethereum smart FeeLevels (EIP-1559) – exact match', async () => {
        const coinInfo = getEthereumNetwork('eth')!;

        const spy = jest
            .spyOn(BlockchainLink.prototype, 'estimateFee')
            .mockResolvedValue(ETH_EIP1559_RESPONSE);

        const backend = await initBlockchain(coinInfo, () => {});
        const feeLevels = new EthereumFeeLevels(coinInfo);

        expect(feeLevels.levels).toHaveLength(1);

        const smartLevels = await feeLevels.load(backend, ETH_REQUEST);

        expect(smartLevels).toHaveLength(3);
        expect(smartLevels?.map(l => l.label)).toEqual(['low', 'normal', 'high']);
        expect(smartLevels?.every(l => l.feePerUnit === '2852176196')).toBe(true);
        expect(smartLevels?.map(l => l.blocks)).toEqual([5, 3, 2]); // 48 s, 36 s, 24 s ⇒ / 12 s

        backend.disconnect();
        spy.mockRestore();
    });

    /* ---------------------------------------------------------------------- */
    /*  2) Ethereum mainnet – EIP-1559 incorrect data from BE                 */
    /* ---------------------------------------------------------------------- */
    describe('Ethereum smart FeeLevels – clamp edge-cases', () => {
        it('clamps to minFee when backend returns feePerUnit = 0', async () => {
            const coinInfo = getEthereumNetwork('eth')!;
            const spy = jest
                .spyOn(BlockchainLink.prototype, 'estimateFee')
                .mockResolvedValue([{ feePerUnit: '0' }]);

            const backend = await initBlockchain(coinInfo, () => {});
            const feeLevels = new EthereumFeeLevels(coinInfo);

            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const [level]: [FeeLevel] = await feeLevels.load(backend, ETH_REQUEST);

            // 0.1 Gwei → 0.1 × 1e9 = 100 000 000 wei
            expect(level.feePerUnit).toBe('100000000');

            backend.disconnect();
            spy.mockRestore();
        });

        it('rounds feePerUnit to integer when backend returns decimal wei value', async () => {
            const coinInfo = getEthereumNetwork('eth')!;
            const spy = jest
                .spyOn(BlockchainLink.prototype, 'estimateFee')
                .mockResolvedValue([{ feePerUnit: '1500000000.7' }]); // fractional wei

            const backend = await initBlockchain(coinInfo, () => {});
            const feeLevels = new EthereumFeeLevels(coinInfo);

            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const [level]: [FeeLevel] = await feeLevels.load(backend, ETH_REQUEST);

            // must be an integer wei string — fromWei("1500000000.7", 'gwei') would crash
            expect(level.feePerUnit).toMatch(/^\d+$/);

            backend.disconnect();
            spy.mockRestore();
        });

        it('EIP-1559: clamps maxFeePerGas to minFee (in wei) when backend returns zero', async () => {
            const coinInfo = getEthereumNetwork('eth')!;
            const spy = jest.spyOn(BlockchainLink.prototype, 'estimateFee').mockResolvedValue([
                {
                    feePerUnit: '2000000000',
                    feeLimit: '21000',
                    eip1559: {
                        baseFeePerGas: '1000000000',
                        low: { maxFeePerGas: '0', maxPriorityFeePerGas: '0' },
                        medium: { maxFeePerGas: '0', maxPriorityFeePerGas: '0' },
                        high: { maxFeePerGas: '0', maxPriorityFeePerGas: '0' },
                    },
                },
            ]);

            const backend = await initBlockchain(coinInfo, () => {});
            const feeLevels = new EthereumFeeLevels(coinInfo);

            const levels = await feeLevels.load(backend, ETH_REQUEST);

            // minFee for eth = 0.1 Gwei → 0.1 × 1e9 = 100 000 000 wei
            // maxFeePerGas must be an integer wei string, never a decimal gwei string like "0.1"
            levels.forEach(level => {
                expect(Number(level.maxFeePerGas)).toBeGreaterThanOrEqual(100000000);
                expect(level.maxFeePerGas).toMatch(/^\d+$/);
            });

            backend.disconnect();
            spy.mockRestore();
        });

        it('clamps to maxFee when backend returns over-limit value', async () => {
            const coinInfo = getEthereumNetwork('eth')!;
            const overLimit = (coinInfo.maxFee * 1e9 * 10).toFixed(0); // 10× max
            const spy = jest
                .spyOn(BlockchainLink.prototype, 'estimateFee')
                .mockResolvedValue([{ feePerUnit: overLimit }]);

            const backend = await initBlockchain(coinInfo, () => {});
            const feeLevels = new EthereumFeeLevels(coinInfo);

            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const [level]: [FeeLevel] = await feeLevels.load(backend, ETH_REQUEST);

            // maxFee = 10 000 Gwei → 10 000 × 1e9 = 10 000 000 000 000 wei
            expect(level.feePerUnit).toBe('10000000000000');

            backend.disconnect();
            spy.mockRestore();
        });
    });

    /* ---------------------------------------------------------------------- */
    /*  3) BNB Smart Chain – legacy gasPrice                                  */
    /* ---------------------------------------------------------------------- */
    it('BSC smart FeeLevels (legacy gasPrice)', async () => {
        const coinInfo = getEthereumNetwork('bsc')!;

        const spy = jest
            .spyOn(BlockchainLink.prototype, 'estimateFee')
            .mockResolvedValue(BSC_LEGACY_RESPONSE);

        const backend = await initBlockchain(coinInfo, () => {});
        const feeLevels = new EthereumFeeLevels(coinInfo);

        const smartLevels = await feeLevels.load(backend, ETH_REQUEST);

        expect(smartLevels).toHaveLength(1);
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const bscLevel: FeeLevel = smartLevels?.[0];
        expect(bscLevel.label).toBe('normal');
        expect(bscLevel.feePerUnit).toBe('5000000000');
        expect(bscLevel.feeLimit).toBe('21000');

        backend.disconnect();
        spy.mockRestore();
    });

    /* ------------------------------------------------------------------ */
    /*  4) minPriorityFeePerGas clamp (Polygon – 30 Gwei floor)           */
    /* ------------------------------------------------------------------ */
    it('Polygon – adjusts maxFeePerGas & priority tip up to minPriorityFee (30 Gwei)', async () => {
        const coinInfo = getEthereumNetwork('pol')!;

        const LOW_LIMIT_RESPONSE = [
            {
                feePerUnit: '30000000000', // 30 Gwei
                feeLimit: '21000',
                eip1559: {
                    baseFeePerGas: '28000000000',
                    low: {
                        maxFeePerGas: '18000000000',
                        maxPriorityFeePerGas: '1000000000',
                        maxWaitTimeEstimate: 6000,
                    },
                    medium: {
                        maxFeePerGas: '20000000000',
                        maxPriorityFeePerGas: '2000000000',
                        maxWaitTimeEstimate: 4000,
                    },
                    high: {
                        maxFeePerGas: '22000000000',
                        maxPriorityFeePerGas: '3000000000',
                        maxWaitTimeEstimate: 2000,
                    },
                },
            },
        ];

        const spy = jest
            .spyOn(BlockchainLink.prototype, 'estimateFee')
            .mockResolvedValue(LOW_LIMIT_RESPONSE);

        const backend = await initBlockchain(coinInfo, () => {});
        const feeLevels = new EthereumFeeLevels(coinInfo);

        const smart = await feeLevels.load(backend, ETH_REQUEST);

        smart.forEach(lvl => {
            expect(Number(lvl.maxPriorityFeePerGas)).toBe(30e9);
            expect(Number(lvl.maxFeePerGas)).toBe(30e9);
            expect(lvl.maxPriorityFeePerGas).toBe(lvl.maxFeePerGas);
        });

        backend.disconnect();
        spy.mockRestore();
    });

    it('keeps previous state when backend throws', async () => {
        const coinInfo = getEthereumNetwork('eth')!;
        const spy = jest
            .spyOn(BlockchainLink.prototype, 'estimateFee')
            .mockRejectedValue(new Error('backend down'));

        const backend = await initBlockchain(coinInfo, () => {});
        const feeLevels = new EthereumFeeLevels(coinInfo);

        expect(feeLevels.wasFetchedSuccessfully).toBeFalsy();

        const levelsAfterError = await feeLevels.load(backend, ETH_REQUEST);

        expect(levelsAfterError).toEqual(feeLevels.levels);
        expect(feeLevels.wasFetchedSuccessfully).toBeFalsy();

        backend.disconnect();
        spy.mockRestore();
    });
});
