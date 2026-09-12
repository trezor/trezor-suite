import { BlockchainLink } from '@trezor/blockchain-link';
import type { FeeLevel } from '@trezor/connect-common';

import { BitcoinFeeLevels } from './BitcoinFeeLevels';
import { getBitcoinNetwork } from '../../data/coinInfo';
import { dispose, initBlockchain } from '../BlockchainLink';

// simple linear mock for decreasing fees per requested block number
const mockFeeValuePerBlock = (block: number) => 10_000 - block * 100;

const defaultFeesMock: FeeLevel[] = [
    { label: 'high', blocks: 1, feePerUnit: '222' },
    { label: 'normal', blocks: 10, feePerUnit: '111' },
    { label: 'low', blocks: 40, feePerUnit: '77' },
    { label: 'economy', blocks: 80, feePerUnit: '22' },
];

const estimateFeeMockOK: typeof BlockchainLink.prototype.estimateFee = params =>
    Promise.resolve(
        (params.blocks ?? []).map(block => ({
            feePerUnit: mockFeeValuePerBlock(block).toString(),
        })),
    );

const estimateFeeMockIncomplete: typeof BlockchainLink.prototype.estimateFee = params =>
    Promise.resolve(
        (params.blocks ?? []).map(block =>
            // no data for the 'economy' fee level
            block === 80
                ? { feePerUnit: '-1' }
                : { feePerUnit: mockFeeValuePerBlock(block).toString() },
        ),
    );

describe('BitcoinFeeLevels', () => {
    afterAll(() => {
        dispose();
        jest.clearAllMocks();
    });

    it('fetches Bitcoin smart FeeLevels with exact match', async () => {
        const coinInfo = getBitcoinNetwork('btc');
        if (!coinInfo) throw new Error('coinInfo is missing');
        const coinInfoMock = { ...coinInfo, defaultFees: defaultFeesMock };

        jest.spyOn(BlockchainLink.prototype, 'estimateFee').mockImplementation(estimateFeeMockOK);

        const backend = await initBlockchain(coinInfoMock, () => {});
        const feeLevelsInstance = new BitcoinFeeLevels(coinInfoMock);

        expect(feeLevelsInstance.levels.length).toEqual(4);
        // returns preloaded values from coins.json
        expect(feeLevelsInstance.levels.map(l => l.feePerUnit)).toEqual(['222', '111', '77', '22']);

        await feeLevelsInstance.load(backend);
        const result = feeLevelsInstance.levels;
        // linear mock of requested blocks
        expect(result.map(l => l.feePerUnit)).toEqual(['9.9', '9', '6', '2']);
    });

    it('fetches Bitcoin smart FeeLevels with some unknown results in response', async () => {
        const coinInfo = getBitcoinNetwork('btc');
        if (!coinInfo) throw new Error('coinInfo is missing');
        const coinInfoMock = { ...coinInfo, defaultFees: defaultFeesMock };

        jest.spyOn(BlockchainLink.prototype, 'estimateFee').mockImplementation(
            estimateFeeMockIncomplete,
        );

        const backend = await initBlockchain(coinInfoMock, () => {});
        const feeLevelsInstance = new BitcoinFeeLevels(coinInfoMock);

        await feeLevelsInstance.load(backend);
        const result = feeLevelsInstance.levels;
        // linear mock of requested blocks, or preloaded values if not fetched successfully
        expect(result.map(l => l.feePerUnit)).toEqual(['9.9', '9', '6', '22']);
    });

    it('fetches Testnet smart FeeLevels with some unknown results in response', async () => {
        const coinInfo = getBitcoinNetwork('test');
        if (!coinInfo) throw new Error('coinInfo is missing');
        // testnet has only one fee level 'normal'
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const normalFee: FeeLevel = defaultFeesMock[1];
        const coinInfoMock = { ...coinInfo, defaultFees: [normalFee] };

        jest.spyOn(BlockchainLink.prototype, 'estimateFee').mockImplementation(
            estimateFeeMockIncomplete,
        );

        const backend = await initBlockchain(coinInfoMock, () => {});
        const feeLevelsInstance = new BitcoinFeeLevels(coinInfoMock);

        expect(feeLevelsInstance.levels.length).toEqual(1);
        // returns preloaded values from coins.json
        expect(feeLevelsInstance.levels.map(l => l.feePerUnit)).toEqual(['111']);

        await feeLevelsInstance.load(backend);
        const result = feeLevelsInstance.levels;
        expect(result?.map(l => l.feePerUnit)).toEqual(['9']);
    });
});
