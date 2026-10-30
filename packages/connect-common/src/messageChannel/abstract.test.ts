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

    // Documents the bug: abortHandshake() clears `handshakeFinished`, which the
    // retry loop awaits. The next attempt therefore posts one more
    // `channel-handshake-request` and then awaits nothing, which resolves: the
    // aborted handshake is logged as confirmed and the queued messages are
    // flushed to the peer that has just failed.
    it('reports an aborted handshake as confirmed', async () => {
        const init = channel.init();
        await jest.advanceTimersByTimeAsync(0);
        expect(countRequests(channel)).toBe(1);

        channel.abortHandshake('handshake-timeout');
        await expect(init).rejects.toThrow('handshake-timeout');

        await jest.advanceTimersByTimeAsync(10000);
        expect(countRequests(channel)).toBe(2);
        expect(countConfirmations()).toBe(1);
    });

    it('handshakes again when init() is called after an abort', async () => {
        const aborted = channel.init();
        await jest.advanceTimersByTimeAsync(0);
        channel.abortHandshake('handshake-timeout');
        await expect(aborted).rejects.toThrow('handshake-timeout');

        // The aborted loop runs on and awaits the new handshake too: it sends one
        // more request, and both loops log the confirmation.
        const retried = channel.init();
        await jest.advanceTimersByTimeAsync(0);
        expect(countRequests(channel)).toBe(3);

        channel.receiveFromPeer('channel-handshake-confirm');
        await expect(retried).resolves.toBeUndefined();

        await jest.advanceTimersByTimeAsync(0);
        expect(countConfirmations()).toBe(2);
    });
});
