import coinsJSON from '@trezor/connect-common/files/coins.json';
import ethereumCoinsJSON from '@trezor/connect-common/files/coins-eth.json';
import BlockchainLink from '@trezor/blockchain-link';
import { parseCoinsJson, getBitcoinNetwork } from '../../../data/coinInfo';
import { initBlockchain } from '../../../backend/BlockchainLink';
import { FeeLevels } from '../Fees';

describe('api/bitcoin/Fees', () => {
    // load coin definitions
    parseCoinsJson({ ...coinsJSON, eth: ethereumCoinsJSON });

    it('Bitcoin smart FeeLevels exact match', async () => {
        const coinInfo = getBitcoinNetwork('Bitcoin');
        if (!coinInfo) throw new Error('coinInfo is missing');

        const spy = jest
            .spyOn(BlockchainLink.prototype, 'estimateFee')
            .mockImplementation(params => {
                if (!params.blocks) return Promise.resolve([]);
                const response = params.blocks.map(block => {
                    const reduce = Math.floor(block / 10) * 379; // every 10th result is lower
                    const fee = 10000 - reduce;

                    return { feePerUnit: fee.toString() };
                });

                return Promise.resolve(response);
            });

        const backend = await initBlockchain(coinInfo, () => {});
        const feeLevels = new FeeLevels(coinInfo);

        expect(feeLevels.levels.length).toEqual(4); // Bitcoin has 4 defined levels in coins.json
        expect(feeLevels.levels.map(l => l.feePerUnit)).toEqual(
            coinInfo.defaultFees.map(l => l.feePerUnit),
        ); // preloaded values from coins.json

        const smartFeeLevels = await feeLevels.load(backend);
        expect(smartFeeLevels.map(l => l.feePerUnit)).toEqual(['10', '10', '8.86', '4.69']);

        backend.disconnect();
        spy.mockClear();
    });

    it('Bitcoin smart FeeLevels with unknown results in the response', async () => {
        const coinInfo = getBitcoinNetwork('Bitcoin');
        if (!coinInfo) throw new Error('coinInfo is missing');

        const spy = jest
            .spyOn(BlockchainLink.prototype, 'estimateFee')
            .mockImplementation(params => {
                if (!params.blocks) return Promise.resolve([]);
                const response = params.blocks.map(block => {
                    if (block < 20 && block % 3 === 0) return { feePerUnit: '-1' }; // each third requested block returns unknown value
                    const reduce = Math.floor(block / 2) * 379; // every second known result is lower
                    const fee = 10000 - reduce;

                    return { feePerUnit: fee.toString() };
                });

                return Promise.resolve(response);
            });

        const backend = await initBlockchain(coinInfo, () => {});
        const feeLevels = new FeeLevels(coinInfo);

        const smartFeeLevels = await feeLevels.load(backend);
        expect(smartFeeLevels.map(l => l.feePerUnit)).toEqual(['10', '8.86', '3.18', '1']);

        backend.disconnect();
        spy.mockClear();
    });

    it('Testnet smart FeeLevels with unknown results in the response', async () => {
        const coinInfo = getBitcoinNetwork('Testnet');
        if (!coinInfo) throw new Error('coinInfo is missing');

        const spy = jest
            .spyOn(BlockchainLink.prototype, 'estimateFee')
            .mockImplementation(params => {
                if (!params.blocks) return Promise.resolve([]);
                const response = params.blocks.map(block => {
                    if (block < 5) return { feePerUnit: '-1' }; // first 5 requested blocks are unknown
                    const reduce = Math.floor(block / 2) * 379; // every second known result is lower
                    const fee = 10000 - reduce;

                    return { feePerUnit: fee.toString() };
                });

                return Promise.resolve(response);
            });

        const backend = await initBlockchain(coinInfo, () => {});
        const feeLevels = new FeeLevels(coinInfo);

        expect(feeLevels.levels.length).toEqual(1); // Testnet has 1 defined levels in coins.json
        expect(feeLevels.levels.map(l => l.feePerUnit)).toEqual(
            coinInfo.defaultFees.map(l => l.feePerUnit),
        ); // preloaded values from coins.json

        const smartFeeLevels = await feeLevels.load(backend);
        expect(smartFeeLevels.map(l => l.feePerUnit)).toEqual(['9.24']);

        backend.disconnect();
        spy.mockClear();
    });

    // This block is useful to perform e2e test locally using listed networks with real backends (supported in suite)
    // How to: comment out jest.mock on top of the file and uncomment test below

    // const e2eNetworks = ['BTC', 'TEST', 'BCH', 'BTG', 'DASH', 'DGB', 'DOGE', 'LTC', 'NMC', 'VTC'];
    // e2eNetworks.forEach(network => {
    //     it.only(`${network} e2e smart FeeLevels`, async () => {
    //         const coinInfo = getBitcoinNetwork(network)!;
    //         if (!coinInfo) throw new Error('coinInfo is missing');

    //         const backend = await initBlockchain(coinInfo, () => {});
    //         const feeLevels = new FeeLevels(coinInfo);
    //         const smartFeeLevels = await feeLevels.load(backend);
    //         console.warn(`${network} FeeLevels`, smartFeeLevels);
    //         console.warn(`${network} longTermFeeRate`, feeLevels.longTermFeeRate);
    //         backend.disconnect();
    //     });
    // });
});
