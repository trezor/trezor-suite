/**
 * @jest-environment jsdom
 */
import { createDeferred } from '@trezor/utils';

import { ServiceWorkerWindowExtConnectableChannel } from './serviceworker-window-ext-connectable';

type TestMessage = { type: 'test-message'; channel?: { peer: string; here: string } };

const ALLOWED_ORIGIN = 'https://connect.trezor.io';
const POPUP_TAB_ID = 7;
const OTHER_TAB_ID = 8;

type MessageListener = (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
) => void | boolean;

const installChromeMock = () => {
    const listeners = new Set<MessageListener>();
    (globalThis as any).chrome = {
        runtime: {
            id: 'test-extension-id',
            onMessageExternal: {
                addListener: (cb: MessageListener) => listeners.add(cb),
                removeListener: (cb: MessageListener) => listeners.delete(cb),
            },
        },
        tabs: { update: jest.fn(), get: jest.fn() },
    };

    return {
        invoke: (sender: chrome.runtime.MessageSender, message: any) => {
            const sendResponse = jest.fn();
            listeners.forEach(l => l(message, sender, sendResponse));

            return sendResponse;
        },
    };
};

// Mirrors the channel direction expected by AbstractMessageChannel.onMessage:
// incoming.channel.peer === channel.here && incoming.channel.here === channel.peer.
const validMessage = {
    type: 'test-message',
    channel: { peer: '@trezor/connect-webextension', here: '@trezor/connect-popup' },
};

const senderWithUrl = (url: string, tabId = POPUP_TAB_ID): chrome.runtime.MessageSender =>
    ({ tab: { id: tabId, url } }) as chrome.runtime.MessageSender;

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('ServiceWorkerWindowExtConnectableChannel allowedOrigin guard', () => {
    let chromeMock: ReturnType<typeof installChromeMock>;
    let channel: ServiceWorkerWindowExtConnectableChannel<TestMessage>;
    let onMessageSpy: jest.SpyInstance;

    beforeEach(() => {
        chromeMock = installChromeMock();
        channel = new ServiceWorkerWindowExtConnectableChannel<TestMessage>({
            channel: {
                here: '@trezor/connect-webextension',
                peer: '@trezor/connect-popup',
            },
            allowedOrigin: ALLOWED_ORIGIN,
            currentId: () => Promise.resolve(POPUP_TAB_ID),
        });
        // `onMessage` is protected; spy on the instance to observe acceptance.
        onMessageSpy = jest.spyOn(channel as any, 'onMessage').mockImplementation(() => undefined);
        channel.connect();
    });

    afterEach(() => {
        channel.disconnect();
        onMessageSpy.mockRestore();
        delete (globalThis as any).chrome;
    });

    it('forwards messages whose sender.tab.url has the exact allowed origin', async () => {
        chromeMock.invoke(senderWithUrl(`${ALLOWED_ORIGIN}/popup.html?x=1`), validMessage);
        await flush();

        expect(onMessageSpy).toHaveBeenCalledTimes(1);
    });

    it('drops a look-alike host that starts with the allowed origin', async () => {
        chromeMock.invoke(
            senderWithUrl('https://connect.trezor.io.attacker.com/popup.html'),
            validMessage,
        );
        await flush();

        expect(onMessageSpy).not.toHaveBeenCalled();
    });

    it('drops senders on a different scheme (http vs https)', async () => {
        chromeMock.invoke(senderWithUrl('http://connect.trezor.io/popup.html'), validMessage);
        await flush();

        expect(onMessageSpy).not.toHaveBeenCalled();
    });

    it('drops senders with a malformed sender.tab.url', async () => {
        chromeMock.invoke(senderWithUrl('not a url'), validMessage);
        await flush();

        expect(onMessageSpy).not.toHaveBeenCalled();
    });

    it('drops senders whose tab has no URL (e.g. missing host_permissions)', async () => {
        chromeMock.invoke({ tab: {} } as chrome.runtime.MessageSender, validMessage);
        await flush();

        expect(onMessageSpy).not.toHaveBeenCalled();
    });

    it('drops messages when allowedOrigin itself is malformed', async () => {
        channel.disconnect();
        const badChannel = new ServiceWorkerWindowExtConnectableChannel<TestMessage>({
            channel: {
                here: '@trezor/connect-webextension',
                peer: '@trezor/connect-popup',
            },
            allowedOrigin: 'not a url',
            currentId: () => Promise.resolve(POPUP_TAB_ID),
        });
        const badOnMessage = jest
            .spyOn(badChannel as any, 'onMessage')
            .mockImplementation(() => undefined);
        badChannel.connect();

        chromeMock.invoke(senderWithUrl(`${ALLOWED_ORIGIN}/popup.html`), validMessage);
        await flush();

        expect(badOnMessage).not.toHaveBeenCalled();
        badChannel.disconnect();
    });

    it('drops messages whose sender has no tab', async () => {
        chromeMock.invoke({} as chrome.runtime.MessageSender, validMessage);
        await flush();

        expect(onMessageSpy).not.toHaveBeenCalled();
    });

    it('drops messages from a tab other than the popup tab', async () => {
        chromeMock.invoke(
            senderWithUrl(`${ALLOWED_ORIGIN}/popup.html`, OTHER_TAB_ID),
            validMessage,
        );
        await flush();

        expect(onMessageSpy).not.toHaveBeenCalled();
    });

    it('delivers a message from the popup tab once the popup tab is known', async () => {
        channel.disconnect();
        const popupTab = createDeferred<number>();
        const openingChannel = new ServiceWorkerWindowExtConnectableChannel<TestMessage>({
            channel: {
                here: '@trezor/connect-webextension',
                peer: '@trezor/connect-popup',
            },
            allowedOrigin: ALLOWED_ORIGIN,
            currentId: () => popupTab.promise,
        });
        const openingOnMessage = jest
            .spyOn(openingChannel as any, 'onMessage')
            .mockImplementation(() => undefined);
        openingChannel.connect();

        chromeMock.invoke(senderWithUrl(`${ALLOWED_ORIGIN}/popup.html`), validMessage);
        await flush();
        expect(openingOnMessage).not.toHaveBeenCalled();

        popupTab.resolve(POPUP_TAB_ID);
        await flush();
        expect(openingOnMessage).toHaveBeenCalledTimes(1);
        openingChannel.disconnect();
    });

    it('drops messages while the popup tab is unknown', async () => {
        channel.disconnect();
        const unopenedChannel = new ServiceWorkerWindowExtConnectableChannel<TestMessage>({
            channel: {
                here: '@trezor/connect-webextension',
                peer: '@trezor/connect-popup',
            },
            allowedOrigin: ALLOWED_ORIGIN,
            currentId: () => Promise.reject(new Error('No popup tab')),
        });
        const unopenedOnMessage = jest
            .spyOn(unopenedChannel as any, 'onMessage')
            .mockImplementation(() => undefined);
        unopenedChannel.connect();

        chromeMock.invoke(senderWithUrl(`${ALLOWED_ORIGIN}/popup.html`), validMessage);
        await flush();

        expect(unopenedOnMessage).not.toHaveBeenCalled();
        unopenedChannel.disconnect();
    });
});
