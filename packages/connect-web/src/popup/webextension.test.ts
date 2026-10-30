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

    // Documents the bug: the chrome callbacks of the superseded first attempt
    // use the shared popupWindowPromise and the manager state, which by then
    // belong to the second attempt. The manager is locked again, so the guard
    // in handleOpenFailure() cannot tell the two attempts apart either.
    it('fails the newer session when a superseded open() reports a failure', async () => {
        const handshake = await openTwice();

        // The first attempt hears back that there is no active tab.
        chromeMock.answerQuery([]);
        await jest.advanceTimersByTimeAsync(0);

        await expect(handshake.promise).rejects.toThrow('No active tab found');
    });

    // Documents the bug: the channel awaits the current popup tab before every
    // send, and the deferred of the superseded attempt never settles, so the
    // whole send chain stalls, including the newer session's handshake.
    it('stalls the messages of the newer open() behind a superseded one', async () => {
        await openTwice();

        chromeMock.answerQuery([{ id: 1, index: 0 }]);
        chromeMock.answerQuery([{ id: 1, index: 0 }]);
        chromeMock.answerCreate({ id: 42 });

        await jest.advanceTimersByTimeAsync(10000);
        expect(getSentMessages()).toHaveLength(0);
    });

    // Documents the bug: a late success of the superseded attempt also runs
    // unguarded, so its tab is never closed and it resolves the channel's
    // popupWindowPromise, which now belongs to the newer session.
    it('leaves the tab created for a superseded open() behind', async () => {
        await popup.focusOrCreate();
        chromeMock.answerGetCurrent();
        chromeMock.answerQuery([{ id: 1, index: 0 }]);
        await popup.focusOrCreate();
        chromeMock.answerGetCurrent();
        chromeMock.answerQuery([{ id: 1, index: 0 }]);

        chromeMock.answerCreate({ id: 41 });
        chromeMock.answerCreate({ id: 42 });

        expect(chromeMock.tabs.remove).not.toHaveBeenCalled();

        await popup.focusOrCreate();
        expect(chromeMock.tabs.update).toHaveBeenCalledWith(42, { active: true });
    });

    // Documents the bug: both attempts go on once chrome reports the current
    // window, so each opens a popup window.
    it('opens a popup window for each open() when a superseded one still waits for the current window', async () => {
        await popup.focusOrCreate();
        await popup.focusOrCreate();

        chromeMock.answerGetCurrent('popup');
        chromeMock.answerGetCurrent('popup');

        expect(chromeMock.windows.create).toHaveBeenCalledTimes(2);
    });

    // Documents the bug: a message sent before the first open(), e.g. by
    // TrezorConnect.cancel(), awaits the deferred the constructor created, which
    // no open() ever settles, so the whole send chain stalls.
    it('stalls the messages of the first open() behind a message sent before it', async () => {
        popup.channel.postMessage({ type: 'test-message' }, { usePromise: false });

        await popup.focusOrCreate();
        chromeMock.answerGetCurrent();
        chromeMock.answerQuery([{ id: 1, index: 0 }]);
        chromeMock.answerCreate({ id: 42 });

        await jest.advanceTimersByTimeAsync(10000);
        expect(getSentMessages()).toHaveLength(0);
    });
});
