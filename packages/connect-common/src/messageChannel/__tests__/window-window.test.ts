/**
 * @jest-environment jsdom
 */
import { WindowWindowChannel } from '../window-window';

type TestMessage = {
    type: 'test-message';
    channel?: { peer: string; here: string };
    payload?: any;
};

const EXPECTED_ORIGIN = 'https://connect.trezor.io';
const ATTACKER_ORIGIN = 'https://connect.trezor.io.attacker.com';

const dispatchMessage = (origin: string, data: any) => {
    const event = new MessageEvent('message', { data, origin });
    window.dispatchEvent(event);
};

const createChannel = () =>
    new WindowWindowChannel<TestMessage>({
        windowHere: window,
        windowPeer: () => undefined,
        channel: { here: '@trezor/connect-web', peer: '@trezor/connect-popup' },
        origin: EXPECTED_ORIGIN,
    });

describe('WindowWindowChannel origin validation', () => {
    let channel: ReturnType<typeof createChannel>;

    beforeEach(() => {
        channel = createChannel();
    });

    afterEach(() => {
        channel.disconnect();
    });

    it('forwards messages from the expected origin to onMessage handlers', () => {
        const onMessage = jest.fn();
        channel.on('message', onMessage);

        dispatchMessage(EXPECTED_ORIGIN, {
            type: 'test-message',
            channel: { peer: '@trezor/connect-web', here: '@trezor/connect-popup' },
            payload: { ok: true },
        });

        expect(onMessage).toHaveBeenCalledTimes(1);
    });

    it('drops messages from a different origin even with valid channel metadata', () => {
        const onMessage = jest.fn();
        channel.on('message', onMessage);

        dispatchMessage(ATTACKER_ORIGIN, {
            type: 'test-message',
            channel: { peer: '@trezor/connect-web', here: '@trezor/connect-popup' },
            payload: { hostile: true },
        });

        expect(onMessage).not.toHaveBeenCalled();
    });

    it('drops messages from the special "null" origin (sandboxed/file://)', () => {
        const onMessage = jest.fn();
        channel.on('message', onMessage);

        dispatchMessage('null', {
            type: 'test-message',
            channel: { peer: '@trezor/connect-web', here: '@trezor/connect-popup' },
        });

        expect(onMessage).not.toHaveBeenCalled();
    });
});
