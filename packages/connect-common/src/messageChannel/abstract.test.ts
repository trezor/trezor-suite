import { Log } from '@trezor/logger';

import { AbstractMessageChannel, type Message } from './abstract';

type TestMessage = { type: 'test-message' };

const HERE = '@trezor/connect-web';
const PEER = '@trezor/connect-popup';

class TestChannel extends AbstractMessageChannel<TestMessage> {
    sent: any[] = [];

    constructor(logger: Log) {
        super({
            sendFn: message => this.sent.push(message),
            channel: { here: HERE, peer: PEER },
            logger,
        });
    }

    connect() {
        this.isConnected = true;
    }

    disconnect() {
        this.isConnected = false;
    }

    receiveFromPeer(type: string) {
        this.onMessage({ type, channel: { here: PEER, peer: HERE } } as Message<TestMessage>);
    }
}

const countRequests = (channel: TestChannel) =>
    channel.sent.filter(message => message.type === 'channel-handshake-request').length;

jest.useFakeTimers();

describe('AbstractMessageChannel.abortHandshake', () => {
    let logger: Log;
    let channel: TestChannel;

    beforeEach(() => {
        logger = new Log('test', false);
        channel = new TestChannel(logger);
    });

    const countConfirmations = () =>
        logger.messages.filter(({ message }) => message.includes('handshake confirmed')).length;

    // The retry loop awaits `handshakeFinished`, which abortHandshake() clears.
    it('does not report an aborted handshake as confirmed', async () => {
        const init = channel.init();
        await jest.advanceTimersByTimeAsync(0);
        expect(countRequests(channel)).toBe(1);

        channel.abortHandshake('handshake-timeout');
        await expect(init).rejects.toThrow('handshake-timeout');

        await jest.advanceTimersByTimeAsync(10000);
        expect(countRequests(channel)).toBe(1);
        expect(countConfirmations()).toBe(0);
    });

    it('handshakes again when init() is called after an abort', async () => {
        const aborted = channel.init();
        await jest.advanceTimersByTimeAsync(0);
        channel.abortHandshake('handshake-timeout');
        await expect(aborted).rejects.toThrow('handshake-timeout');

        // Only the new handshake's loop runs: one request from it on top of the
        // aborted one, and one confirmation.
        const retried = channel.init();
        await jest.advanceTimersByTimeAsync(0);
        expect(countRequests(channel)).toBe(2);

        channel.receiveFromPeer('channel-handshake-confirm');
        await expect(retried).resolves.toBeUndefined();

        await jest.advanceTimersByTimeAsync(0);
        expect(countConfirmations()).toBe(1);
    });
});
