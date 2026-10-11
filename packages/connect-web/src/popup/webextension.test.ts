import { initLog } from '@trezor/connect-common/src/utils/debug';

import { WebExtensionPopup } from './webextension';

type QueryCallback = (tabs: Partial<chrome.tabs.Tab>[]) => void;
type CreateCallback = (tab: Partial<chrome.tabs.Tab>) => void;

// The chrome callbacks are queued so a test can decide when, and in which
// order, each open() attempt hears back from the browser.
const installChromeMock = () => {
    const pending = { query: [] as QueryCallback[], create: [] as CreateCallback[] };
    const chromeMock = {
        runtime: {
            id: 'test-extension-id',
            lastError: undefined,
            onMessageExternal: { addListener: jest.fn(), removeListener: jest.fn() },
        },
        windows: {
            getCurrent: (callback: (window: { type: string }) => void) =>
                callback({ type: 'normal' }),
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
        tabs: chromeMock.tabs,
        answerQuery: (tabs: Partial<chrome.tabs.Tab>[]) => take(pending.query)(tabs),
        answerCreate: (tab: Partial<chrome.tabs.Tab>) => take(pending.create)(tab),
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

    // open() resolves before its tab exists, so a second call resets the
    // manager and opens again while the first attempt still waits for chrome.
    const openTwice = async () => {
        await popup.focusOrCreate();
        await popup.focusOrCreate();
        const { handshakePromise } = popup;
        if (!handshakePromise) throw new Error('handshakePromise is not set');

        return handshakePromise;
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

    it('closes the tab created for a superseded open()', async () => {
        await popup.focusOrCreate();
        chromeMock.answerQuery([{ id: 1, index: 0 }]);
        await popup.focusOrCreate();
        chromeMock.answerQuery([{ id: 1, index: 0 }]);

        chromeMock.answerCreate({ id: 41 });
        chromeMock.answerCreate({ id: 42 });

        expect(chromeMock.tabs.remove).toHaveBeenCalledTimes(1);
        expect(chromeMock.tabs.remove).toHaveBeenCalledWith(41, expect.any(Function));

        await popup.focusOrCreate();
        expect(chromeMock.tabs.update).toHaveBeenCalledWith(42, { active: true });
    });
});
