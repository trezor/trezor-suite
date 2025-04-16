import BlockchainLink from '@trezor/blockchain-link';
import coinsJSONEth from '@trezor/connect-common/files/coins-eth.json';
import coinsJSON from '@trezor/connect-common/files/coins.json';

import { getBitcoinNetwork, parseCoinsJson } from '../../../data/coinInfo';
import { FeeLevel } from '../../../types';
import { initBlockchain } from '../../BlockchainLink';
import { BitcoinFeeLevels } from '../BitcoinFeeLevels';

// simple linear mock for decreasing fees per requested block number
const mockFeeValuePerBlock = (block: number) => 10_000 - block * 100;

const defaultFeesMock: FeeLevel[] = [
    { label: 'high', blocks: 1, feePerUnit: '222' },
    { label: 'normal', blocks: 10, feePerUnit: '111' },
    { label: 'low', blocks: 40, feePerUnit: '77' },
    { label: 'economy', blocks: 80, feePerUnit: '22' },
];

describe('BitcoinFeeLevels', () => {
    // load coin definitions
    parseCoinsJson({ ...coinsJSON, ...coinsJSONEth });

    it('should fetch Bitcoin smart FeeLevels with exact match', async () => {
        const coinInfo = getBitcoinNetwork('Bitcoin');
        if (!coinInfo) throw new Error('coinInfo is missing');
        const coinInfoMock = { ...coinInfo, defaultFees: defaultFeesMock };

        const spy = jest
            .spyOn(BlockchainLink.prototype, 'estimateFee')
            .mockImplementation(params => {
                if (!params.blocks) return Promise.resolve([]);
                const response = params.blocks.map(block => ({
                    feePerUnit: mockFeeValuePerBlock(block).toString(),
                }));

                return Promise.resolve(response);
            });

        const backend = await initBlockchain(coinInfoMock, () => {});
        const feeLevels = new BitcoinFeeLevels(coinInfoMock);

        expect(feeLevels.levels.length).toEqual(4);
        // returns preloaded values from coins.json
        expect(feeLevels.levels.map(l => l.feePerUnit)).toEqual(['222', '111', '77', '22']);

        const smartFeeLevels = await feeLevels.load(backend);
        // linear mock of requested blocks
        expect(smartFeeLevels.map(l => l.feePerUnit)).toEqual(['9.9', '9', '6', '2']);

        backend.disconnect();
        spy.mockReset();
    });

    it('should fetch Bitcoin smart FeeLevels with some unknown results in response', async () => {
        const coinInfo = getBitcoinNetwork('Bitcoin');
        if (!coinInfo) throw new Error('coinInfo is missing');
        const coinInfoMock = { ...coinInfo, defaultFees: defaultFeesMock };

        const spy = jest
            .spyOn(BlockchainLink.prototype, 'estimateFee')
            .mockImplementation(params => {
                if (!params.blocks) return Promise.resolve([]);
                const response = params.blocks.map(block =>
                    block === 80
                        ? // no data for economy fee level
                          { feePerUnit: '-1' }
                        : { feePerUnit: mockFeeValuePerBlock(block).toString() },
                );

                return Promise.resolve(response);
            });

        const backend = await initBlockchain(coinInfoMock, () => {});
        const feeLevels = new BitcoinFeeLevels(coinInfoMock);

        const smartFeeLevels = await feeLevels.load(backend);
        // linear mock of requested blocks, or preloaded values if not fetched successfully
        expect(smartFeeLevels.map(l => l.feePerUnit)).toEqual(['9.9', '9', '6', '22']);

        backend.disconnect();
        spy.mockReset();
    });

    it('should fetch Bitcoin smart FeeLevels with custom fee level', async () => {
        const coinInfo = getBitcoinNetwork('Bitcoin');
        if (!coinInfo) throw new Error('coinInfo is missing');
        const coinInfoMock = { ...coinInfo, defaultFees: defaultFeesMock };

        const spy = jest
            .spyOn(BlockchainLink.prototype, 'estimateFee')
            .mockImplementation(params => {
                if (!params.blocks) return Promise.resolve([]);
                const response = params.blocks.map(block => ({
                    feePerUnit: mockFeeValuePerBlock(block).toString(),
                }));

                return Promise.resolve(response);
            });

        const backend = await initBlockchain(coinInfoMock, () => {});
        const feeLevels = new BitcoinFeeLevels(coinInfoMock);

        // 'custom' level is appended at the end
        feeLevels.updateBitcoinCustomFee('7.6');
        expect(feeLevels.levels.at(-1)).toMatchObject({ label: 'custom', feePerUnit: '7.6' });

        const smartFeeLevels = await feeLevels.load(backend);
        // 'custom' level is excluded from the query
        expect(spy).toHaveBeenCalledWith({ blocks: [1, 10, 40, 80] });

        // but the 'custom' level is still present, unchanged
        expect(smartFeeLevels.map(l => l.feePerUnit)).toEqual(['9.9', '9', '6', '2', '7.6']);

        backend.disconnect();
        spy.mockReset();
    });

    it('should fetch Testnet smart FeeLevels with some unknown results in response', async () => {
        const coinInfo = getBitcoinNetwork('Testnet');
        if (!coinInfo) throw new Error('coinInfo is missing');
        // testnet has only one fee level 'normal'
        const coinInfoMock = { ...coinInfo, defaultFees: [defaultFeesMock[1]] };

        const spy = jest
            .spyOn(BlockchainLink.prototype, 'estimateFee')
            .mockImplementation(params => {
                if (!params.blocks) return Promise.resolve([]);
                const response = params.blocks.map(block =>
                    block < 10
                        ? // no data for high fee level (but that one is not queried now)
                          { feePerUnit: '-1' }
                        : { feePerUnit: mockFeeValuePerBlock(block).toString() },
                );

                return Promise.resolve(response);
            });

        const backend = await initBlockchain(coinInfoMock, () => {});
        const feeLevels = new BitcoinFeeLevels(coinInfoMock);

        expect(feeLevels.levels.length).toEqual(1);
        // returns preloaded values from coins.json
        expect(feeLevels.levels.map(l => l.feePerUnit)).toEqual(['111']);

        const smartFeeLevels = await feeLevels.load(backend);
        expect(smartFeeLevels?.map(l => l.feePerUnit)).toEqual(['9']);

        backend.disconnect();
        spy.mockReset();
    });

    // This block is useful to manually observe fee rates from real backends (supported in suite)
    // How to: uncomment test below
    // Note: currently broken! The "test" runs, but all you can see is the defaults from json.
    // Because all API responses are -1. Maybe websocket issue in jest?

    // const e2eNetworks = ['BTC', 'TEST', 'BCH', 'DASH', 'DOGE', 'LTC'];
    // e2eNetworks.forEach(network => {
    // eslint-disable-next-line jest/no-commented-out-tests
    //     it.only(`${network} e2e smart FeeLevels`, async () => {
    //         const coinInfo = getBitcoinNetwork(network)!;
    //         if (!coinInfo) throw new Error('coinInfo is missing');
    //
    //         const backend = await initBlockchain(coinInfo, () => {});
    //         const feeLevels = new BitcoinFeeLevels(coinInfo);
    //         const smartFeeLevels = await feeLevels.load(backend);
    //         console.info(`${network} FeeLevels`, smartFeeLevels);
    //         console.info(`${network} longTermFeeRate`, feeLevels.longTermFeeRate);
    //         backend.disconnect();
    //     });
    // });
});
