import coinsJSON from '@trezor/connect-common/files/coins.json';
import ethereumCoinsJSON from '@trezor/connect-common/files/coins-eth.json';
import BlockchainLink from '@trezor/blockchain-link';
import { parseCoinsJson, getBitcoinNetwork, getEthereumNetwork } from '../../data/coinInfo';
import { initBlockchain } from '../BlockchainLink';

describe('backend/Blockchain', () => {
    // load coin definitions
    parseCoinsJson({ ...coinsJSON, eth: ethereumCoinsJSON });

    it('cache estimated fees (bitcoin-like)', async () => {
        jest.useFakeTimers();

        const coinInfo = getBitcoinNetwork('Bitcoin');
        if (!coinInfo) throw new Error('coinInfo is missing');

        const spy = jest.spyOn(BlockchainLink.prototype, 'estimateFee');

        const backend = await initBlockchain(coinInfo, () => {});

        // blocks: 1 was not requested before
        await backend.estimateFee({ blocks: [1] });
        expect(spy.mock.calls.length).toEqual(1);

        // blocks: 1 is requested again, returned from cache
        await backend.estimateFee({ blocks: [1] });
        expect(spy.mock.calls.length).toEqual(1);

        // blocks: 2 was not requested before
        await backend.estimateFee({ blocks: [1, 2] });
        expect(spy.mock.calls.length).toEqual(2);

        // move time 21 minutes forward
        jest.advanceTimersByTime(21 * 60 * 1000);

        // third load will fetch data from backend again
        await backend.estimateFee({ blocks: [1, 2] });
        expect(spy.mock.calls.length).toEqual(3);

        spy.mockClear();
    });

    it('cache estimated fees (ethereum-like)', async () => {
        const coinInfo = getEthereumNetwork('Ethereum');
        if (!coinInfo) throw new Error('coinInfo is missing');

        const spy = jest.spyOn(BlockchainLink.prototype, 'estimateFee');

        const backend = await initBlockchain(coinInfo, () => {});

        // blocks: 1 was not requested before
        await backend.estimateFee({ blocks: [1] });
        expect(spy.mock.calls.length).toEqual(1);

        // blocks: 1 is requested again, returned from cache
        await backend.estimateFee({ blocks: [1] });
        expect(spy.mock.calls.length).toEqual(1);

        // blocks: 2 was not requested before
        await backend.estimateFee({ blocks: [1, 2] });
        expect(spy.mock.calls.length).toEqual(2);

        // request with "specific" field
        await backend.estimateFee({ blocks: [1, 2], specific: { value: '0x0' } });
        expect(spy.mock.calls.length).toEqual(3);

        spy.mockClear();
    });
});
