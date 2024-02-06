import BlockchainLink from '@trezor/blockchain-link';

import { CoinInfo } from '../../types';
import { BackendManager } from '../BackendManager';
import type { CoreEventMessage } from '../../events';

const COIN_INFO = {
    shortcut: 'BTC',
    blockchainLink: { type: 'blockbook', url: ['url_1', 'url_2', 'url_3'] },
} as CoinInfo;

describe('backend/BackendManager', () => {
    let manager: BackendManager;
    let postMessage: jest.Mock;

    jest.useFakeTimers();

    const delay = (ms: number) => jest.advanceTimersByTimeAsync(ms);

    const expectExactMessages = (...types: CoreEventMessage['type'][]) => {
        expect(postMessage).toHaveBeenCalledTimes(types.length);
        types.forEach((type, i) =>
            expect(postMessage).toHaveBeenNthCalledWith(i + 1, expect.objectContaining({ type })),
        );
        postMessage.mockClear();
    };

    const expectNoMessage = () => expect(postMessage).toHaveBeenCalledTimes(0);

    beforeEach(() => {
        manager = new BackendManager();
        postMessage = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('reuse backend', async () => {
        const backend1 = await manager.getOrConnect(COIN_INFO, postMessage);
        expectExactMessages('blockchain-connect');
        const networkInfo = await backend1.getNetworkInfo();
        expect(networkInfo).toMatchObject({ shortcut: 'BTC' });

        await delay(1000);

        await manager.getOrConnect(COIN_INFO, postMessage);
        expectNoMessage();
    });

    it('reconnect backend after disconnection', async () => {
        const backend1 = await manager.getOrConnect(COIN_INFO, postMessage);
        expectExactMessages('blockchain-connect');

        await delay(1000);
        backend1.disconnect();
        expectExactMessages('blockchain-error');

        await delay(1000);
        expectNoMessage();

        await manager.getOrConnect(COIN_INFO, postMessage);
        expectExactMessages('blockchain-connect');
    });

    it('reconnect backend automatically when subscribed', async () => {
        const backend = await manager.getOrConnect(COIN_INFO, postMessage);
        expectExactMessages('blockchain-connect');
        const { subscribed } = await backend.subscribe();
        expect(subscribed).toBe(true);

        await delay(1000);
        backend.link.emit('disconnected');
        expectExactMessages('blockchain-error', 'blockchain-reconnecting');

        await delay(1000);
        expectExactMessages('blockchain-connect');

        await manager.getOrConnect(COIN_INFO, postMessage);
        expectNoMessage();
    });

    it('reconnect backend infinitely when cannot reconnect', async () => {
        const backend = await manager.getOrConnect(COIN_INFO, postMessage);
        expectExactMessages('blockchain-connect');
        const { subscribed } = await backend.subscribe();
        expect(subscribed).toBe(true);

        await delay(1000);
        jest.spyOn(BlockchainLink.prototype, 'connect').mockImplementation(() =>
            Promise.reject(new Error('foo')),
        );
        backend.link.emit('disconnected');
        expectExactMessages('blockchain-error', 'blockchain-reconnecting');

        await delay(1000);
        expectExactMessages('blockchain-reconnecting');

        await delay(2000);
        expectExactMessages('blockchain-reconnecting');
    });
});
