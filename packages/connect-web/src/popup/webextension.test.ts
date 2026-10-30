import { initLog } from '@trezor/connect-common/src/utils/debug';

import { WebExtensionPopup } from './webextension';

type GetCurrentCallback = (window: { type: string }) => void;
type QueryCallback = (tabs: Partial<chrome.tabs.Tab>[]) => void;
type CreateCallback = (tab: Partial<chrome.tabs.Tab> | undefined) => void;

// The chrome callbacks are queued so a test can decide when, and in which
// order, each open() attempt hears back from the browser.
const installChromeMock = () => {
    const pending = {
        getCurrent: [] as GetCurrentCallback[],
        query: [] as QueryCallback[],
        create: [] as CreateCallback[],
    };
    const chromeMock = {
        runtime: {
            id: 'test-extension-id',
            lastError: undefined as { message: string } | undefined,
            onMessageExternal: { addListener: jest.fn(), removeListener: jest.fn() },
        },
        windows: {
            getCurrent: (callback: GetCurrentCallback) => pending.getCurrent.push(callback),
            create: jest.fn(),
        },
        tabs: {
            query: (_query: unknown, callback: QueryCallback) => pending.query.push(callback),
            create: (_props: unknown, callback: CreateCallback) => pending.create.push(callback),
            get: (id: number, callback: (tab: Partial<chrome.tabs.Tab>) => void) =>
                callback({ id, url: 'https://suite.trezor.io/web/connect-popup/' }),
            remove: jest.fn(),
            update: jest.fn(),
        },
    };
    (globalThis as any).chrome = chromeMock;

    const take = <T>(queue: T[]) => {
        const callback = queue.shift();
        if (!callback) throw new Error('no pending chrome callback');

        return callback;
    };

    return {
        runtime: chromeMock.runtime,
        windows: chromeMock.windows,
        tabs: chromeMock.tabs,
        answerGetCurrent: (type = 'normal') => take(pending.getCurrent)({ type }),
        answerQuery: (tabs: Partial<chrome.tabs.Tab>[]) => take(pending.query)(tabs),
        answerCreate: (tab: Partial<chrome.tabs.Tab> | undefined) => take(pending.create)(tab),
    };
};

const createPopup = () =>
    new WebExtensionPopup({
        popupSrc: 'https://suite.trezor.io/web/connect-popup',
        manifest: { appName: 'Test app', appUrl: 'https://app.example', email: 'dev@example.com' },
        version: '1.0.0',
        logger: initLog('test'),
    });

const trackSettled = (promise: Promise<unknown>) => {
    const state = { settled: false };
    promise.then(
        () => {
            state.settled = true;
        },
        () => {
            state.settled = true;
        },
    );

    return state;
};

jest.useFakeTimers();

describe('WebExtensionPopup', () => {
    let chromeMock: ReturnType<typeof installChromeMock>;
    let popup: WebExtensionPopup;

    beforeEach(() => {
        chromeMock = installChromeMock();
        popup = createPopup();
    });

    afterEach(() => {
        popup.channel.disconnect();
        jest.clearAllTimers();
        delete (globalThis as any).chrome;
    });

    const getSentMessages = () =>
        chromeMock.tabs.update.mock.calls.filter(
            ([, properties]) => typeof properties?.url === 'string',
        );

    const getHandshakePromise = () => {
        const { handshakePromise } = popup;
        if (!handshakePromise) throw new Error('handshakePromise is not set');

        return handshakePromise;
    };

    // open() resolves before its tab exists, so a second call resets the
    // manager and opens again while the first attempt still waits for chrome.
    const openTwice = async () => {
        await popup.focusOrCreate();
        chromeMock.answerGetCurrent();
        await popup.focusOrCreate();
        chromeMock.answerGetCurrent();

        return getHandshakePromise();
    };

    it('ignores a failure reported by a superseded open()', async () => {
        const handshake = await openTwice();
        const handshakeState = trackSettled(handshake.promise);

        chromeMock.answerQuery([]);
        await jest.advanceTimersByTimeAsync(0);
        expect(handshakeState.settled).toBe(false);

        chromeMock.answerQuery([{ id: 1, index: 0 }]);
        chromeMock.answerCreate({ id: 42 });

        // The newer open() owns the popup: the next call focuses its tab.
        await popup.focusOrCreate();
        expect(chromeMock.tabs.update).toHaveBeenCalledWith(42, { active: true });
    });

    // The channel awaits the current popup tab before every send, so a
    // superseded attempt that never settles would stall the whole send chain.
    it('sends the messages of the newer open() after a superseded one', async () => {
        await openTwice();

        // The superseded attempt hears back first and gives up; the newer one
        // gets its tab.
        chromeMock.answerQuery([{ id: 1, index: 0 }]);
        chromeMock.answerQuery([{ id: 1, index: 0 }]);
        chromeMock.answerCreate({ id: 42 });

        await jest.advanceTimersByTimeAsync(10000);

        const sentMessages = getSentMessages();
        expect(sentMessages.length).toBeGreaterThan(0);
        sentMessages.forEach(([tabId]) => expect(tabId).toBe(42));
    });

    it('closes the tab created for a superseded open()', async () => {
        await popup.focusOrCreate();
        chromeMock.answerGetCurrent();
        chromeMock.answerQuery([{ id: 1, index: 0 }]);
        await popup.focusOrCreate();
        chromeMock.answerGetCurrent();
        chromeMock.answerQuery([{ id: 1, index: 0 }]);

        chromeMock.answerCreate({ id: 41 });
        chromeMock.answerCreate({ id: 42 });

        expect(chromeMock.tabs.remove).toHaveBeenCalledTimes(1);
        expect(chromeMock.tabs.remove).toHaveBeenCalledWith(41, expect.any(Function));

        await popup.focusOrCreate();
        expect(chromeMock.tabs.update).toHaveBeenCalledWith(42, { active: true });
    });

    it('opens one popup window when a superseded open() still waits for the current window', async () => {
        await popup.focusOrCreate();
        await popup.focusOrCreate();

        chromeMock.answerGetCurrent('popup');
        chromeMock.answerGetCurrent('popup');

        expect(chromeMock.windows.create).toHaveBeenCalledTimes(1);
    });

    // e.g. TrezorConnect.cancel() before the first call
    it('sends the messages of the first open() after a message sent before it', async () => {
        popup.channel.postMessage({ type: 'test-message' }, { usePromise: false });

        await popup.focusOrCreate();
        chromeMock.answerGetCurrent();
        chromeMock.answerQuery([{ id: 1, index: 0 }]);
        chromeMock.answerCreate({ id: 42 });

        await jest.advanceTimersByTimeAsync(10000);
        expect(getSentMessages().length).toBeGreaterThan(0);
    });

    // Documents the bug: chrome passes no tab when it could not create one, and
    // onPopupTabResolved() reads its id, so the callback throws and the open()
    // never settles; the call only fails once the channel handshake times out.
    it('throws in the chrome callback when chrome could not create the popup tab', async () => {
        await popup.focusOrCreate();
        const handshakeState = trackSettled(getHandshakePromise().promise);
        chromeMock.answerGetCurrent();
        chromeMock.answerQuery([{ id: 1, index: 0 }]);

        chromeMock.runtime.lastError = { message: 'Tabs cannot be edited right now' };
        expect(() => chromeMock.answerCreate(undefined)).toThrow(TypeError);
        chromeMock.runtime.lastError = undefined;

        await jest.advanceTimersByTimeAsync(0);
        expect(handshakeState.settled).toBe(false);
    });
});
