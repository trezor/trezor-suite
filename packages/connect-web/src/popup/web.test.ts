/**
 * @jest-environment jsdom
 */

import { initLog } from '@trezor/connect-common/src/utils/debug';

import { WebPopup } from './web';

const SUITE_ORIGIN = 'https://suite.trezor.io';
const POPUP_SRC = `${SUITE_ORIGIN}/web/connect-popup`;

const iframeWindow = { postMessage: jest.fn() };

jest.mock('./iframe', () => ({
    getIframeInstance: () => ({
        create: () => Promise.resolve(),
        get: () => ({ contentWindow: iframeWindow }),
        destroy: () => {},
    }),
}));

jest.useFakeTimers();

const createPopupWindow = () => ({
    location: { href: 'about:blank' },
    postMessage: jest.fn(),
    close: jest.fn(),
});

const createWebPopup = () =>
    new WebPopup({
        manifest: { appName: 'Test', appUrl: 'https://dapp.example.com', email: 'dev@example.com' },
        popupSrc: POPUP_SRC,
        version: '10.0.0',
        logger: initLog('@trezor/connect-web-test'),
    });

const iframeChannel = { here: '@trezor/connect-bootstrap-iframe', peer: '@trezor/connect-web' };

const sendFromIframe = (data: Record<string, unknown>) => {
    window.dispatchEvent(
        new MessageEvent('message', {
            data: { channel: iframeChannel, ...data },
            origin: SUITE_ORIGIN,
            // The channel accepts only messages from the iframe's window.
            source: iframeWindow as unknown as Window,
        }),
    );
};

describe('WebPopup', () => {
    let popupWindow: ReturnType<typeof createPopupWindow>;
    // Popups of earlier tests never settle, so their channels must not hear later messages.
    const windowMessageListeners: EventListener[] = [];

    beforeEach(() => {
        popupWindow = createPopupWindow();
        // The popup is only navigated and messaged, which this partial window covers.
        jest.spyOn(window, 'open').mockReturnValue(popupWindow as unknown as Window);

        const addEventListener = window.addEventListener.bind(window);
        jest.spyOn(window, 'addEventListener').mockImplementation(
            (
                type: string,
                listener: EventListenerOrEventListenerObject,
                options?: boolean | AddEventListenerOptions,
            ) => {
                if (type === 'message') windowMessageListeners.push(listener as EventListener);
                addEventListener(type, listener, options);
            },
        );
    });

    afterEach(() => {
        windowMessageListeners.forEach(listener => window.removeEventListener('message', listener));
        windowMessageListeners.length = 0;
        jest.restoreAllMocks();
        jest.clearAllTimers();
    });

    it('keeps the popup on about:blank until the bootstrap iframe is ready', async () => {
        const popup = createWebPopup();
        popup.focusOrCreate().catch(() => {});

        await jest.advanceTimersByTimeAsync(0);
        expect(popupWindow.location.href).toBe('about:blank');

        sendFromIframe({ type: 'channel-handshake-ready' });

        expect(popupWindow.location.href).toMatch(
            new RegExp(`^${POPUP_SRC}/bootstrap\\.html\\?connect-popup-req=`),
        );
    });

    it('shows the bootstrap error in the popup when storage access is denied', async () => {
        const popup = createWebPopup();
        const opening = popup.focusOrCreate();

        await jest.advanceTimersByTimeAsync(0);
        sendFromIframe({ type: 'channel-handshake-error', error: 'storage-access-denied' });

        await expect(opening).rejects.toMatchObject({
            code: 'Handshake_Error',
            message: 'storage-access-denied',
        });
        expect(popupWindow.location.href).toBe(
            `${POPUP_SRC}/?connect-popup-err=storage-access-denied`,
        );

        // Navigating it is enough; the fallback must not overwrite the error page.
        await jest.advanceTimersByTimeAsync(1000);
        expect(popupWindow.location.href).toBe(
            `${POPUP_SRC}/?connect-popup-err=storage-access-denied`,
        );
    });

    it('opens bootstrap.html anyway when an older bootstrap never reports it is ready', async () => {
        const popup = createWebPopup();
        popup.focusOrCreate().catch(() => {});

        await jest.advanceTimersByTimeAsync(499);
        expect(popupWindow.location.href).toBe('about:blank');

        await jest.advanceTimersByTimeAsync(1);
        expect(popupWindow.location.href).toMatch(new RegExp(`^${POPUP_SRC}/bootstrap\\.html`));
    });

    it('forwards an error to an already navigated popup instead of navigating it again', async () => {
        const popup = createWebPopup();
        const opening = popup.focusOrCreate();

        await jest.advanceTimersByTimeAsync(0);
        sendFromIframe({ type: 'channel-handshake-ready' });
        const bootstrapUrl = popupWindow.location.href;

        sendFromIframe({ type: 'channel-handshake-error', error: 'handshake-timeout' });

        await expect(opening).rejects.toMatchObject({ message: 'handshake-timeout' });
        expect(popupWindow.location.href).toBe(bootstrapUrl);
        expect(popupWindow.postMessage).toHaveBeenCalledWith(
            { type: 'channel-handshake-error', error: 'handshake-timeout' },
            SUITE_ORIGIN,
        );
    });
});
