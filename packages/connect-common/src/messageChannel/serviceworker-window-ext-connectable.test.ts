/**
 * @jest-environment jsdom
 */
import { ServiceWorkerWindowExtConnectableChannel } from './serviceworker-window-ext-connectable';

type TestMessage = { type: 'test-message'; channel?: { peer: string; here: string } };

const ALLOWED_ORIGIN = 'https://connect.trezor.io';

type MessageListener = (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
) => void | boolean;

const installChromeMock = (tabUrl?: string) => {
    const listeners = new Set<MessageListener>();
    const updateTab = jest.fn();
    (globalThis as any).chrome = {
        runtime: {
            id: 'test-extension-id',
            onMessageExternal: {
                addListener: (cb: MessageListener) => listeners.add(cb),
                removeListener: (cb: MessageListener) => listeners.delete(cb),
            },
        },
        tabs: {
            update: updateTab,
            get: jest.fn((_tabId: number, callback: (tab: Partial<chrome.tabs.Tab>) => void) =>
                callback({ url: tabUrl }),
            ),
        },
    };

    return {
        updateTab,
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

const senderWithUrl = (url: string): chrome.runtime.MessageSender =>
    ({ tab: { url } }) as chrome.runtime.MessageSender;

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

    it('forwards messages whose sender.tab.url has the exact allowed origin', () => {
        chromeMock.invoke(senderWithUrl(`${ALLOWED_ORIGIN}/popup.html?x=1`), validMessage);

        expect(onMessageSpy).toHaveBeenCalledTimes(1);
    });

    it('drops the look-alike "https://connect.trezor.io.attacker.com/..." prefix bypass', () => {
        chromeMock.invoke(
            senderWithUrl('https://connect.trezor.io.attacker.com/popup.html'),
            validMessage,
        );

        expect(onMessageSpy).not.toHaveBeenCalled();
    });

    it('drops senders on a different scheme (http vs https)', () => {
        chromeMock.invoke(senderWithUrl('http://connect.trezor.io/popup.html'), validMessage);

        expect(onMessageSpy).not.toHaveBeenCalled();
    });

    it('drops senders with a malformed sender.tab.url', () => {
        chromeMock.invoke(senderWithUrl('not a url'), validMessage);

        expect(onMessageSpy).not.toHaveBeenCalled();
    });

    it('drops senders whose tab has no URL (e.g. missing host_permissions)', () => {
        chromeMock.invoke({ tab: {} } as chrome.runtime.MessageSender, validMessage);

        expect(onMessageSpy).not.toHaveBeenCalled();
    });

    it('drops messages when allowedOrigin itself is malformed', () => {
        channel.disconnect();
        const badChannel = new ServiceWorkerWindowExtConnectableChannel<TestMessage>({
            channel: {
                here: '@trezor/connect-webextension',
                peer: '@trezor/connect-popup',
            },
            allowedOrigin: 'not a url',
        });
        const badOnMessage = jest
            .spyOn(badChannel as any, 'onMessage')
            .mockImplementation(() => undefined);
        badChannel.connect();

        chromeMock.invoke(senderWithUrl(`${ALLOWED_ORIGIN}/popup.html`), validMessage);

        expect(badOnMessage).not.toHaveBeenCalled();
        badChannel.disconnect();
    });

    it('drops messages whose sender has no tab', () => {
        chromeMock.invoke({} as chrome.runtime.MessageSender, validMessage);

        expect(onMessageSpy).not.toHaveBeenCalled();
    });
});

describe('ServiceWorkerWindowExtConnectableChannel tab update', () => {
    beforeEach(() => jest.useFakeTimers());

    afterEach(() => {
        jest.useRealTimers();
        delete (globalThis as any).chrome;
    });

    const sendWhileTabIsAt = async (tabUrl: string) => {
        const { updateTab } = installChromeMock(tabUrl);
        const channel = new ServiceWorkerWindowExtConnectableChannel<TestMessage>({
            channel: {
                here: '@trezor/connect-webextension',
                peer: '@trezor/connect-popup',
            },
            currentId: () => Promise.resolve(1),
            allowedOrigin: ALLOWED_ORIGIN,
        });
        channel.postMessage({ type: 'test-message' }, { usePromise: false });
        await jest.runAllTimersAsync();

        return updateTab;
    };

    it('writes the message into the hash of the Suite tab', async () => {
        const updateTab = await sendWhileTabIsAt(`${ALLOWED_ORIGIN}/popup.html`);

        expect(updateTab).toHaveBeenCalledWith(1, {
            url: expect.stringMatching(
                /^https:\/\/connect\.trezor\.io\/popup\.html#extension-id=test-extension-id&message=/,
            ),
        });
    });

    it.each(['about:blank', 'https://example.com/'])(
        'does not navigate a tab that is at %s',
        async tabUrl => {
            const updateTab = await sendWhileTabIsAt(tabUrl);

            expect(updateTab).not.toHaveBeenCalled();
        },
    );
});
