/**
 * @jest-environment jsdom
 */

import { randomUUID } from 'node:crypto';

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
            source: getIframe().contentWindow,
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
    // Documents the Connect Explorer bug: offline, the loaded iframe holds the
    // browser's error page, which handleIframeLoad() accepts because reading its
    // cross-origin location throws. It never answers, so the handshake times
    // out. The iframe keeps a resolved initPromise, so the retry reuses it
    // together with the channel id in its `src`, and no retry can ever bootstrap
    // until a page reload.
    it('reuses an iframe that never answered, and its channel id, on a retry', async () => {
        const popup = createPopup();
        const { opened, iframe } = await openUntilBootstrapHandshake(popup);
        const failedChannelId = getChannelId(iframe.src);

        // Past the channel's 5 x 2 s handshake attempts.
        await jest.advanceTimersByTimeAsync(11000);
        await expect(opened).rejects.toThrow('handshake failed');
        expect(getOpenedWindow(0).close).not.toHaveBeenCalled();
        expect(iframe.isConnected).toBe(true);

        const retry = await openUntilBootstrapHandshake(popup);
        expect(retry.iframe).toBe(iframe);
        expect(getChannelId(getOpenedWindow(1).location.href)).toBe(failedChannelId);
    });

    // Documents the same reuse after the iframe reports that its handshake with
    // the popup failed (`connect-popup-err=handshake-timeout`).
    it('reuses the iframe and the channel id after a reported bootstrap handshake error', async () => {
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

        // The popup is told to show the error and stays open.
        expect(failedWindow.postMessage).toHaveBeenCalledWith(
            { type: 'channel-handshake-error', error: 'handshake-timeout' },
            ORIGIN,
        );
        expect(failedWindow.close).not.toHaveBeenCalled();

        // The iframe that could not bootstrap is still in the document.
        expect(iframe.isConnected).toBe(true);

        // The retry hands the same iframe, and the same channel id, to a new popup.
        const retry = await openUntilBootstrapHandshake(popup);
        expect(retry.iframe).toBe(iframe);
        expect(getChannelId(retry.iframe.src)).toBe(failedChannelId);
        expect(getChannelId(getOpenedWindow(1).location.href)).toBe(failedChannelId);
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
