/**
 * @jest-environment jsdom
 */

import { randomUUID } from 'node:crypto';

import { POPUP } from '@trezor/connect-common/src/events';
import { initLog } from '@trezor/connect-common/src/utils/debug';

import { WebPopup } from './web';

const ORIGIN = 'https://suite.trezor.io';
const POPUP_SRC = `${ORIGIN}/connect-popup`;

type FakePopupWindow = {
    location: { href: string };
    close: jest.Mock;
    postMessage: jest.Mock;
};

jest.useFakeTimers();

const openedWindows: FakePopupWindow[] = [];
const popups: WebPopup[] = [];

beforeAll(() => {
    // jsdom has no crypto.randomUUID(), which the channel uses for message ids.
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: randomUUID,
        configurable: true,
    });
});

beforeEach(() => {
    document.body.innerHTML = '';
    openedWindows.length = 0;
    jest.clearAllTimers();
    jest.spyOn(window, 'open').mockImplementation(() => {
        const popupWindow: FakePopupWindow = {
            location: { href: 'about:blank' },
            close: jest.fn(),
            postMessage: jest.fn(),
        };
        openedWindows.push(popupWindow);

        return popupWindow as unknown as Window;
    });
});

afterEach(() => {
    // Drop the window listeners so a popup from one test cannot consume
    // the messages of the next one.
    popups.splice(0).forEach(popup => popup.channel.disconnect());
    jest.restoreAllMocks();
});

const createPopup = () => {
    const popup = new WebPopup({
        popupSrc: POPUP_SRC,
        manifest: { appName: 'Test app', appUrl: 'https://app.example', email: 'dev@example.com' },
        version: '1.0.0',
        logger: initLog('test'),
    });
    popups.push(popup);

    return popup;
};

const getOpenedWindow = (index: number) => {
    const popupWindow = openedWindows[index];
    if (!popupWindow) throw new Error(`popup window ${index} not opened`);

    return popupWindow;
};

const getIframe = () => {
    const element = document.querySelector('iframe');
    if (!element) throw new Error('bootstrap iframe not appended');

    return element;
};

const getChannelId = (url: string) => new URL(url).searchParams.get('connect-popup-req');

// What the bootstrap iframe (or the popup, forwarded through it) posts to the
// host window.
const sendFromIframe = (
    data: Record<string, unknown>,
    here:
        | '@trezor/connect-bootstrap-iframe'
        | '@trezor/connect-popup' = '@trezor/connect-bootstrap-iframe',
) => {
    window.dispatchEvent(
        new MessageEvent('message', {
            origin: ORIGIN,
            data: { ...data, channel: { here, peer: '@trezor/connect-web' } },
        }),
    );
};

// Drives open() up to the bootstrap handshake: the popup window is opened,
// the hidden iframe appended and loaded.
const openUntilBootstrapHandshake = async (popup: WebPopup) => {
    const opened = popup.focusOrCreate();
    // Suppress the unhandled rejection until the test attaches its own handler.
    opened.catch(() => {});
    await jest.advanceTimersByTimeAsync(0);
    const iframe = getIframe();
    iframe.dispatchEvent(new Event('load'));
    await jest.advanceTimersByTimeAsync(0);

    return { opened, iframe };
};

describe('WebPopup', () => {
    // The Connect Explorer scenario: the bootstrap iframe <-> popup handshake
    // fails after the iframe has loaded (`connect-popup-err=handshake-timeout`).
    it('recovers from a bootstrap handshake failure with a fresh iframe and channel id', async () => {
        const popup = createPopup();
        const { opened, iframe } = await openUntilBootstrapHandshake(popup);
        const failedWindow = getOpenedWindow(0);
        const failedChannelId = getChannelId(failedWindow.location.href);
        expect(failedChannelId).toBe(getChannelId(iframe.src));

        sendFromIframe({ type: 'channel-handshake-error', error: 'handshake-timeout' });
        await expect(opened).rejects.toMatchObject({
            code: 'Handshake_Error',
            message: 'handshake-timeout',
        });

        // The popup is told to show the error and stays open; the iframe is gone.
        expect(failedWindow.postMessage).toHaveBeenCalledWith(
            { type: 'channel-handshake-error', error: 'handshake-timeout' },
            ORIGIN,
        );
        expect(failedWindow.close).not.toHaveBeenCalled();
        expect(iframe.isConnected).toBe(false);
        expect(document.querySelector('iframe')).toBeNull();

        // The retry rebuilds the iframe and gives it and the popup a new channel id.
        const retry = await openUntilBootstrapHandshake(popup);
        expect(retry.iframe).not.toBe(iframe);
        const retryChannelId = getChannelId(retry.iframe.src);
        expect(retryChannelId).not.toBe(failedChannelId);
        expect(getChannelId(getOpenedWindow(1).location.href)).toBe(retryChannelId);

        sendFromIframe({ type: 'channel-handshake-confirm' });
        await expect(retry.opened).resolves.toBeUndefined();

        // The popup channel handshake and CORE_LOADED complete on the recovered manager.
        const channelHandshake = popup.channel.init();
        await jest.advanceTimersByTimeAsync(0);
        sendFromIframe({ type: 'channel-handshake-confirm' }, '@trezor/connect-popup');
        await expect(channelHandshake).resolves.toBeUndefined();

        sendFromIframe({ type: POPUP.CORE_LOADED }, '@trezor/connect-popup');
        await expect(popup.handshakePromise?.promise).resolves.toBeUndefined();
    });

    // The #29770 scenario: the iframe itself never loads.
    it('closes the popup on an iframe load timeout and retries with a fresh iframe', async () => {
        const popup = createPopup();
        const opened = popup.focusOrCreate();
        opened.catch(() => {});
        await jest.advanceTimersByTimeAsync(0);
        const iframe = getIframe();

        await jest.advanceTimersByTimeAsync(10000);
        await expect(opened).rejects.toMatchObject({ message: 'iframe-timeout' });
        expect(getOpenedWindow(0).close).toHaveBeenCalled();
        expect(iframe.isConnected).toBe(false);

        const retry = await openUntilBootstrapHandshake(popup);
        expect(retry.iframe).not.toBe(iframe);

        sendFromIframe({ type: 'channel-handshake-confirm' });
        await expect(retry.opened).resolves.toBeUndefined();
    });
});
