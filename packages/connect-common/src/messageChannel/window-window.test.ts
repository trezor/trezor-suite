/**
 * @jest-environment jsdom
 */
import { WindowWindowChannel } from './window-window';

type TestMessage = {
    type: 'test-message';
    channel?: { peer: string; here: string };
    payload?: any;
};

const EXPECTED_ORIGIN = 'https://connect.trezor.io';
const ATTACKER_ORIGIN = 'https://connect.trezor.io.attacker.com';

const createWindow = () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    if (!iframe.contentWindow) throw new Error('iframe has no window');

    return iframe.contentWindow;
};

const dispatchMessage = (origin: string, data: any, source: Window) => {
    const event = new MessageEvent('message', { data, origin, source });
    window.dispatchEvent(event);
};

const createChannel = (peer: Window) =>
    new WindowWindowChannel<TestMessage>({
        windowHere: window,
        windowPeer: () => peer,
        channel: { here: '@trezor/connect-web', peer: '@trezor/connect-popup' },
        origin: EXPECTED_ORIGIN,
    });

describe('WindowWindowChannel sender validation', () => {
    let peer: Window;
    let channel: ReturnType<typeof createChannel>;

    beforeEach(() => {
        document.body.innerHTML = '';
        peer = createWindow();
        channel = createChannel(peer);
    });

    afterEach(() => {
        channel.disconnect();
    });

    it('forwards messages from the expected origin to onMessage handlers', () => {
        const onMessage = jest.fn();
        channel.on('message', onMessage);

        dispatchMessage(
            EXPECTED_ORIGIN,
            {
                type: 'test-message',
                channel: { peer: '@trezor/connect-web', here: '@trezor/connect-popup' },
                payload: { ok: true },
            },
            peer,
        );

        expect(onMessage).toHaveBeenCalledTimes(1);
    });

    // E.g. the bootstrap iframe of a second connect-web copy on the same page.
    it('drops messages from another window of the expected origin', () => {
        const onMessage = jest.fn();
        channel.on('message', onMessage);

        dispatchMessage(
            EXPECTED_ORIGIN,
            {
                type: 'test-message',
                channel: { peer: '@trezor/connect-web', here: '@trezor/connect-popup' },
            },
            createWindow(),
        );

        expect(onMessage).not.toHaveBeenCalled();
    });

    it('drops messages from a different origin even with valid channel metadata', () => {
        const onMessage = jest.fn();
        channel.on('message', onMessage);

        dispatchMessage(
            ATTACKER_ORIGIN,
            {
                type: 'test-message',
                channel: { peer: '@trezor/connect-web', here: '@trezor/connect-popup' },
                payload: { hostile: true },
            },
            peer,
        );

        expect(onMessage).not.toHaveBeenCalled();
    });

    it('drops messages from the special "null" origin (sandboxed/file://)', () => {
        const onMessage = jest.fn();
        channel.on('message', onMessage);

        dispatchMessage(
            'null',
            {
                type: 'test-message',
                channel: { peer: '@trezor/connect-web', here: '@trezor/connect-popup' },
            },
            peer,
        );

        expect(onMessage).not.toHaveBeenCalled();
    });
});
