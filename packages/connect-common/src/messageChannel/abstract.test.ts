import { randomUUID } from 'crypto';

import { AbstractMessageChannel } from './abstract';

// the promise ids of the channel come from crypto.randomUUID, which jsdom does not implement
if (!globalThis.crypto?.randomUUID) {
    globalThis.crypto.randomUUID = randomUUID;
}

type TestMessage = { type: 'test-message' };

class TestChannel extends AbstractMessageChannel<TestMessage> {
    connect() {}

    disconnect() {}
}

const createChannel = () =>
    new TestChannel({
        sendFn: () => {},
        channel: {
            here: '@trezor/connect-foreground-proxy',
            peer: '@trezor/connect-service-worker-proxy',
        },
    });

describe('AbstractMessageChannel settling pending request promises', () => {
    it('rejectMessagePromises rejects every pending promise with the given error', async () => {
        const channel = createChannel();
        const pending = channel.postMessage({ type: 'test-message' });
        const error = new Error('Method interrupted');

        channel.rejectMessagePromises(error);

        await expect(pending).rejects.toBe(error);
    });

    it('resolveMessagePromises nests its argument under `payload`', async () => {
        const channel = createChannel();
        const pending = channel.postMessage({ type: 'test-message' });

        channel.resolveMessagePromises({ success: false });

        // documents why rejectMessagePromises exists: this shape only fits channels whose
        // responses are nested one level deeper (see connect-web's popup channel)
        await expect(pending).resolves.toEqual({
            id: expect.any(String),
            payload: { success: false },
        });
    });
});
