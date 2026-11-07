import { AbstractMessageChannel, type Message } from './abstract';

type TestMessage = { type: string };

const CHANNEL = { here: '@test/here', peer: '@test/peer' };

class TestChannel extends AbstractMessageChannel<TestMessage> {
    connect() {}

    disconnect() {}

    receive(type: string) {
        this.onMessage({
            type,
            channel: { here: CHANNEL.peer, peer: CHANNEL.here },
        } as Message<TestMessage>);
    }
}

const createChannel = ({ lazyHandshake = false } = {}) => {
    let isPeerReachable = false;
    const sentMessages: { type: string }[] = [];
    const sendFn = jest.fn((message: { type: string }) => {
        if (!isPeerReachable) {
            throw new Error('peer not reachable');
        }
        sentMessages.push(message);
    });
    const channel = new TestChannel({ sendFn, channel: CHANNEL, lazyHandshake });
    const setPeerReachable = (value: boolean) => {
        isPeerReachable = value;
    };
    const getSentTypes = () => sentMessages.map(({ type }) => type);

    return { channel, setPeerReachable, getSentTypes };
};

describe('AbstractMessageChannel handshake', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('sends queued messages once the peer confirms', async () => {
        const { channel, setPeerReachable, getSentTypes } = createChannel();
        const handshake = channel.init();
        channel.postMessage({ type: 'queued' }, { usePromise: false });

        setPeerReachable(true);
        channel.receive('channel-handshake-confirm');
        await handshake;
        await jest.advanceTimersByTimeAsync(0);

        expect(getSentTypes()).toContain('queued');
    });

    it('does not confirm an aborted handshake', async () => {
        const { channel, setPeerReachable, getSentTypes } = createChannel();
        const handshake = channel.init();
        channel.postMessage({ type: 'queued' }, { usePromise: false });

        channel.abortHandshake('popup closed');
        await expect(handshake).rejects.toThrow('popup closed');
        setPeerReachable(true);
        await jest.advanceTimersByTimeAsync(10_000);

        expect(getSentTypes()).not.toContain('queued');
    });

    it('drops messages queued for the previous peer', async () => {
        const { channel, setPeerReachable, getSentTypes } = createChannel();
        channel.init().catch(() => {});
        channel.postMessage({ type: 'stale' }, { usePromise: false });
        channel.clear();

        setPeerReachable(true);
        const handshake = channel.init();
        channel.receive('channel-handshake-confirm');
        await handshake;
        await jest.advanceTimersByTimeAsync(0);

        expect(getSentTypes()).not.toContain('stale');
    });

    it('starts a lazy handshake on the first request of the peer', async () => {
        const { channel, setPeerReachable, getSentTypes } = createChannel({
            lazyHandshake: true,
        });
        channel.postMessage({ type: 'queued' }, { usePromise: false });

        setPeerReachable(true);
        channel.receive('channel-handshake-request');
        await jest.advanceTimersByTimeAsync(0);
        expect(getSentTypes()).toEqual(['channel-handshake-confirm', 'channel-handshake-request']);

        channel.receive('channel-handshake-confirm');
        await jest.advanceTimersByTimeAsync(0);

        expect(getSentTypes()).toContain('queued');
    });
});
