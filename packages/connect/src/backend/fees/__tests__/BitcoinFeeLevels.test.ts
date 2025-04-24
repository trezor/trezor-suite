import BlockchainLink from '@trezor/blockchain-link';
import coinsJSONEth from '@trezor/connect-common/files/coins-eth.json';
import coinsJSON from '@trezor/connect-common/files/coins.json';

import { getBitcoinNetwork, parseCoinsJson } from '../../../data/coinInfo';
import { FeeLevel } from '../../../types';
import { dispose, initBlockchain } from '../../BlockchainLink';
import { BitcoinFeeLevels } from '../BitcoinFeeLevels';

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
    // load coin definitions
    parseCoinsJson({ ...coinsJSON, ...coinsJSONEth });

    afterAll(() => {
        dispose();
        jest.resetAllMocks();
    });

    it('fetches Bitcoin smart FeeLevels with exact match', async () => {
        const coinInfo = getBitcoinNetwork('Bitcoin');
        if (!coinInfo) throw new Error('coinInfo is missing');
        const coinInfoMock = { ...coinInfo, defaultFees: defaultFeesMock };

        jest.spyOn(BlockchainLink.prototype, 'estimateFee').mockImplementation(estimateFeeMockOK);

        const backend = await initBlockchain(coinInfoMock, () => {});
        const feeLevelsInstance = new BitcoinFeeLevels(coinInfoMock);

        expect(feeLevelsInstance.levels.length).toEqual(4);
        // returns preloaded values from coins.json
        expect(feeLevelsInstance.levels.map(l => l.feePerUnit)).toEqual(['222', '111', '77', '22']);

        const result = await feeLevelsInstance.load(backend);
        // linear mock of requested blocks
        expect(result.map(l => l.feePerUnit)).toEqual(['9.9', '9', '6', '2']);
    });

    it('fetches Bitcoin smart FeeLevels with some unknown results in response', async () => {
        const coinInfo = getBitcoinNetwork('Bitcoin');
        if (!coinInfo) throw new Error('coinInfo is missing');
        const coinInfoMock = { ...coinInfo, defaultFees: defaultFeesMock };

        jest.spyOn(BlockchainLink.prototype, 'estimateFee').mockImplementation(
            estimateFeeMockIncomplete,
        );

        const backend = await initBlockchain(coinInfoMock, () => {});
        const feeLevelsInstance = new BitcoinFeeLevels(coinInfoMock);

        const result = await feeLevelsInstance.load(backend);
        // linear mock of requested blocks, or preloaded values if not fetched successfully
        expect(result.map(l => l.feePerUnit)).toEqual(['9.9', '9', '6', '22']);
    });

    it('fetches Bitcoin smart FeeLevels with custom fee level', async () => {
        const coinInfo = getBitcoinNetwork('Bitcoin');
        if (!coinInfo) throw new Error('coinInfo is missing');
        const coinInfoMock = { ...coinInfo, defaultFees: defaultFeesMock };

        const spy = jest
            .spyOn(BlockchainLink.prototype, 'estimateFee')
            .mockImplementation(estimateFeeMockOK);

        const backend = await initBlockchain(coinInfoMock, () => {});
        const feeLevelsInstance = new BitcoinFeeLevels(coinInfoMock);

        // 'custom' level is appended at the end
        feeLevelsInstance.updateBitcoinCustomFee('7.6');
        expect(feeLevelsInstance.levels.at(-1)).toMatchObject({
            label: 'custom',
            feePerUnit: '7.6',
        });

        const result = await feeLevelsInstance.load(backend);
        // 'custom' level is excluded from the query
        expect(spy).toHaveBeenCalledWith({ blocks: [1, 10, 40, 80] });

        // but the 'custom' level is still present, unchanged
        expect(result.map(l => l.feePerUnit)).toEqual(['9.9', '9', '6', '2', '7.6']);
    });

    it('fetches Testnet smart FeeLevels with some unknown results in response', async () => {
        const coinInfo = getBitcoinNetwork('Testnet');
        if (!coinInfo) throw new Error('coinInfo is missing');
        // testnet has only one fee level 'normal'
        const coinInfoMock = { ...coinInfo, defaultFees: [defaultFeesMock[1]] };

        jest.spyOn(BlockchainLink.prototype, 'estimateFee').mockImplementation(
            estimateFeeMockIncomplete,
        );

        const backend = await initBlockchain(coinInfoMock, () => {});
        const feeLevelsInstance = new BitcoinFeeLevels(coinInfoMock);

        expect(feeLevelsInstance.levels.length).toEqual(1);
        // returns preloaded values from coins.json
        expect(feeLevelsInstance.levels.map(l => l.feePerUnit)).toEqual(['111']);

        const result = await feeLevelsInstance.load(backend);
        expect(result?.map(l => l.feePerUnit)).toEqual(['9']);
    });
});
