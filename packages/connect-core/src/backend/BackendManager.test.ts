import { BlockchainLink } from '@trezor/blockchain-link';
import type { CoinInfo, CoreEventMessage } from '@trezor/connect-common';

import { BackendManager } from './BackendManager';
import type { Blockchain } from './Blockchain';

const coinInfo = {
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
        const backend1 = await manager.getOrConnect({ coinInfo, postMessage });
        expectExactMessages('blockchain-connect');
        const networkInfo = await backend1.getNetworkInfo();
        expect(networkInfo).toMatchObject({ shortcut: 'BTC' });

        await delay(1000);

        await manager.getOrConnect({ coinInfo, postMessage });
        expectNoMessage();
    });

    it('reconnect backend after disconnection', async () => {
        const backend1 = await manager.getOrConnect({ coinInfo, postMessage });
        expectExactMessages('blockchain-connect');

        await delay(1000);
        backend1.disconnect();
        expectExactMessages('blockchain-error');

        await delay(1000);
        expectNoMessage();

        await manager.getOrConnect({ coinInfo, postMessage });
        expectExactMessages('blockchain-connect');
    });

    it('reconnect backend automatically when subscribed', async () => {
        const backend = await manager.getOrConnect({ coinInfo, postMessage });
        expectExactMessages('blockchain-connect');
        const { subscribed } = await backend.subscribeBlocks();
        expect(subscribed).toBe(true);

        await delay(1000);
        backend.link.emit('disconnected');
        expectExactMessages('blockchain-error', 'blockchain-reconnecting');

        await delay(1000);
        expectExactMessages('blockchain-connect');

        await manager.getOrConnect({ coinInfo, postMessage });
        expectNoMessage();
    });

    it('reconnect backend infinitely when cannot reconnect', async () => {
        const backend = await manager.getOrConnect({ coinInfo, postMessage });
        expectExactMessages('blockchain-connect');
        const { subscribed } = await backend.subscribeBlocks();
        expect(subscribed).toBe(true);

        await delay(1000);
        jest.spyOn(BlockchainLink.prototype, 'connect').mockImplementation(() =>
            Promise.reject(new Error('foo')),
        );
        backend.link.emit('disconnected');
        expectExactMessages('blockchain-error', 'blockchain-reconnecting');

        await delay(1000);
        expectExactMessages('blockchain-error', 'blockchain-reconnecting');

        await delay(2500);
        expectExactMessages('blockchain-error', 'blockchain-reconnecting');
    });

    it('grows the reconnect delay while a backend keeps dropping, and resets it once one holds', async () => {
        const delays: number[] = [];
        postMessage = jest.fn((message: CoreEventMessage) => {
            if (message.type === 'blockchain-reconnecting') {
                delays.push(message.payload.time - Date.now());
            }
        });

        let backend = await manager.getOrConnect({ coinInfo, postMessage });

        for (const expectedDelay of [1000, 2500, 5000]) {
            await backend.subscribeBlocks();
            backend.link.emit('disconnected');
            expect(delays.at(-1)).toBe(expectedDelay);

            await delay(expectedDelay);
            backend = await manager.getOrConnect({ coinInfo, postMessage });
        }

        await backend.subscribeBlocks();
        await delay(30000);
        backend.link.emit('disconnected');

        expect(delays.at(-1)).toBe(1000);
    });

    it('does not let a caller preempt a scheduled reconnect', async () => {
        const backend = await manager.getOrConnect({ coinInfo, postMessage });
        await backend.subscribeBlocks();
        expectExactMessages('blockchain-connect');

        backend.link.emit('disconnected');
        expectExactMessages('blockchain-error', 'blockchain-reconnecting');

        await delay(100);
        // Suite keeps syncing while the backend is down, and every ACCOUNT.UPDATE goes
        // ACCOUNT.UPDATE -> subscribeBlockchainThunk -> blockchainSubscribe -> getOrConnect.
        // The reconnect is scheduled 1000 ms out, so this caller must not open a connection.
        await manager.getOrConnect({ coinInfo, postMessage }).catch(() => {});

        expectNoMessage();
    });

    it('lets an explicit reconnect skip the scheduled delay', async () => {
        const backend = await manager.getOrConnect({ coinInfo, postMessage });
        await backend.subscribeBlocks();
        expectExactMessages('blockchain-connect');

        backend.link.emit('disconnected');
        expectExactMessages('blockchain-error', 'blockchain-reconnecting');

        await delay(100);
        await manager.getOrConnect({ coinInfo, postMessage }, { force: true });

        expectExactMessages('blockchain-connect');
    });

    it('keeps the connect rate down when a flapping backend meets a busy caller', async () => {
        // Timings from reproduce-fresh.har: the subscription channel closed about 1.3 s after
        // each subscribe, and Suite issued roughly 9 blockchainSubscribe calls per second, each
        // one reaching getOrConnect. That produced 15 connect attempts in the 21 s window; the
        // backoff schedule of 1, 2.5, 5, 7.5, 10 s allows 5.
        const CHANNEL_LIFETIME = 1300;
        const CALLER_INTERVAL = 110;
        const WINDOW = 21_000;

        let connects = 0;
        postMessage = jest.fn((message: CoreEventMessage) => {
            if (message.type === 'blockchain-connect') connects += 1;
        });

        let live: Blockchain | undefined;
        let dropAt = 0;

        for (let now = 0; now <= WINDOW; now += CALLER_INTERVAL) {
            const backend = await manager
                .getOrConnect({ coinInfo, postMessage })
                .catch(() => undefined);

            if (backend && backend !== live) {
                await backend.subscribeBlocks();
                live = backend;
                dropAt = now + CHANNEL_LIFETIME;
            }

            if (live && now >= dropAt) {
                live.link.emit('disconnected');
                live = undefined;
            }

            await delay(CALLER_INTERVAL);
        }

        expect(connects).toBeLessThanOrEqual(6);
    });
});
