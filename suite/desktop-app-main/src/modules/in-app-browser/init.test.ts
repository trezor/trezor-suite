import { type ProxyConfig, type Session, WebContentsView, session } from 'electron';

import { type InAppBrowserOpenPayload } from '@suite/desktop-app-api';

import { init } from './init';
import { type Dependencies, mainThreadEmitter } from '../module';
import { type MockSession, mockSession } from './mocks/mockSession';
import { mockTorSettings } from './mocks/mockTorSettings';
import { followTorSettings } from './services/session';
import type * as sessionService from './services/session';
import { Logger } from '../../libs/logger';
import { MainWindowProxy } from '../../libs/main-window-proxy';
import { type Store } from '../../libs/store';
import { type StrictBrowserWindow } from '../../typed-electron';

type IpcHandler = (...args: unknown[]) => unknown;

const mockIpcHandlers = new Map<string, IpcHandler>();

jest.mock('../../ipcMain', () => ({
    ipcMain: {
        handle: (channel: string, handler: IpcHandler) => {
            mockIpcHandlers.set(channel, handler);
        },
    },
}));

const mockWebContents = {
    id: 7,
    on: jest.fn(),
    once: jest.fn(),
    loadURL: jest.fn(() => Promise.resolve()),
    isDestroyed: () => false,
    close: jest.fn(),
    closeDevTools: jest.fn(),
    setWebRTCIPHandlingPolicy: jest.fn(),
    setWindowOpenHandler: jest.fn(),
    getURL: () => 'https://app.example/',
    navigationHistory: { canGoBack: () => false, canGoForward: () => false },
};

jest.mock('electron', () => ({
    WebContentsView: jest.fn(() => ({ webContents: mockWebContents, setVisible: jest.fn() })),
    session: { fromPartition: jest.fn(), fromPath: jest.fn() },
}));

jest.mock('fs/promises', () => ({
    mkdir: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../libs/user-data', () => ({
    resolveDirectoryInUserDataDir: jest.fn((directory: string) => ({
        success: true,
        payload: { dir: `/user-data/${directory}` },
    })),
}));

// The real session service, with `followTorSettings` wrapped so that the promise the store callback
// fires and forgets can be awaited by the tests.
jest.mock('./services/session', () => {
    const actual = jest.requireActual<typeof sessionService>('./services/session');

    return { ...actual, followTorSettings: jest.fn(actual.followTorSettings) };
});

jest.mock('./services/devTools', () => ({
    toggleDevTools: jest.fn(),
}));

jest.mock('../../libs/dev-tools-policy', () => ({
    isDevToolsEnabled: false,
}));

globalThis.logger = new Logger('mute');

const TOR_PROXY_CONFIG = { proxyRules: 'socks5://127.0.0.1:9050' } satisfies ProxyConfig;
const SYSTEM_PROXY_CONFIG = { mode: 'system' } satisfies ProxyConfig;

const openPayload: InAppBrowserOpenPayload = {
    url: 'https://app.example/',
    redirectExternalOrigins: [],
    popupExternalOrigins: [],
};

const persistentOpenPayload: InAppBrowserOpenPayload = {
    url: 'https://gpay-live-demo.web.app/',
    redirectExternalOrigins: [],
    popupExternalOrigins: [],
    entryId: 'google-pay-demo',
};

const mockMainWindowWebContents = {
    isDestroyed: () => false,
    on: jest.fn(),
    off: jest.fn(),
    send: jest.fn(),
};

const mockContentView = { addChildView: jest.fn(), removeChildView: jest.fn() };

const mockMainWindow = {
    isDestroyed: () => false,
    webContents: mockMainWindowWebContents,
    contentView: mockContentView,
} as unknown as StrictBrowserWindow;

// Rejected up front and already handled: a production path that forgot to await the promise then
// fails an assertion instead of crashing the test process with an unhandled rejection.
const createHandledRejection = (message: string) => {
    const rejection = Promise.reject(new Error(message));

    rejection.catch(() => {});

    return rejection;
};

const getInvocationOrder = (invocationCallOrder: number[], callIndex: number) => {
    const order = invocationCallOrder[callIndex];

    if (order === undefined) {
        throw new Error('the call was not recorded');
    }

    return order;
};

const getViewOptions = () => {
    const [firstCall] = jest.mocked(WebContentsView).mock.calls;
    const [options] = firstCall ?? [];

    if (options === undefined) {
        throw new Error('no view was created');
    }

    return options;
};

describe('in-app browser module and the Tor settings', () => {
    let torSettings: TorSettings;
    let torSettingsListener: ((changed?: TorSettings) => void) | undefined;
    let inMemorySession: MockSession;
    let persistentSession: MockSession;

    const unsubscribeTorSettingsChange = jest.fn();

    const store = {
        getTorSettings: () => torSettings,
        onTorSettingsChange: jest.fn((callback: (changed?: TorSettings) => void) => {
            torSettingsListener = callback;

            return unsubscribeTorSettingsChange;
        }),
    } as Pick<Store, 'getTorSettings' | 'onTorSettingsChange'> as Store;

    const initModule = () => {
        const mainWindowProxy = new MainWindowProxy();

        mainWindowProxy.setInstance(mockMainWindow);

        const dependencies: Dependencies = {
            mainWindowProxy,
            store,
            interceptor: {} as Dependencies['interceptor'],
            mainThreadEmitter,
            cspNonce: 'test-nonce',
            powerSaveBlocker: {} as Dependencies['powerSaveBlocker'],
        };
        const inAppBrowser = init(dependencies);

        if (!inAppBrowser) {
            throw new Error('the module returned no interface');
        }

        return inAppBrowser;
    };

    const openPage = async (payload: InAppBrowserOpenPayload = openPayload) => {
        const handler = mockIpcHandlers.get('in-app-browser/open-view');

        if (handler === undefined) {
            throw new Error('the open-view handler was not registered');
        }

        await handler({}, payload);
    };

    // The subscription fires and forgets; the wrapped `followTorSettings` exposes its promise.
    const changeTorSettings = async (changed: TorSettings | undefined) => {
        if (torSettingsListener === undefined) {
            throw new Error('the module did not subscribe to the Tor settings');
        }

        torSettingsListener(changed);

        const { results } = jest.mocked(followTorSettings).mock;
        const lastResult = results[results.length - 1];

        if (lastResult === undefined) {
            throw new Error('the Tor settings change did not reach followTorSettings');
        }

        await lastResult.value;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockIpcHandlers.clear();
        torSettingsListener = undefined;
        torSettings = mockTorSettings();
        inMemorySession = mockSession();
        persistentSession = mockSession({
            storagePath: '/user-data/in-app-browser/google-pay-demo',
        });

        jest.mocked(session.fromPartition).mockReturnValue(inMemorySession as Session);
        jest.mocked(session.fromPath).mockReturnValue(persistentSession as Session);
    });

    it('subscribes to the Tor settings on init and unsubscribes on quit', async () => {
        const inAppBrowser = initModule();

        expect(store.onTorSettingsChange).toHaveBeenCalledTimes(1);

        await inAppBrowser.onQuit?.();

        expect(unsubscribeTorSettingsChange).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes from the Tor settings before tearing the view down on quit', async () => {
        const inAppBrowser = initModule();
        await openPage();

        await inAppBrowser.onQuit?.();

        expect(
            getInvocationOrder(unsubscribeTorSettingsChange.mock.invocationCallOrder, 0),
        ).toBeLessThan(getInvocationOrder(mockWebContents.close.mock.invocationCallOrder, 0));
    });

    it.each([
        {
            name: 'the system proxy while Tor is off',
            running: false,
            proxyConfig: SYSTEM_PROXY_CONFIG,
        },
        { name: 'Tor while Tor is on', running: true, proxyConfig: TOR_PROXY_CONFIG },
    ])(
        'routes the session through $name before the page loads',
        async ({ running, proxyConfig }) => {
            torSettings = mockTorSettings({ running });
            initModule();

            await openPage();

            expect(inMemorySession.setProxy).toHaveBeenCalledWith(proxyConfig);
            expect(mockWebContents.loadURL).toHaveBeenCalledWith(openPayload.url);
            expect(
                getInvocationOrder(
                    jest.mocked(inMemorySession.setProxy).mock.invocationCallOrder,
                    0,
                ),
            ).toBeLessThan(getInvocationOrder(mockWebContents.loadURL.mock.invocationCallOrder, 0));
        },
    );

    it('creates the view on the in-memory session it just routed', async () => {
        torSettings = mockTorSettings({ running: true });
        initModule();

        await openPage();

        const { webPreferences } = getViewOptions();

        expect(webPreferences?.session).toBe(inMemorySession);
        expect(webPreferences).not.toHaveProperty('partition');
    });

    it('creates the view on the persistent session of a data-keeping entry, routed first', async () => {
        torSettings = mockTorSettings({ running: true });
        initModule();

        await openPage(persistentOpenPayload);

        const { webPreferences } = getViewOptions();

        expect(webPreferences?.session).toBe(persistentSession);
        expect(persistentSession.setProxy).toHaveBeenCalledWith(TOR_PROXY_CONFIG);
        expect(
            getInvocationOrder(jest.mocked(persistentSession.setProxy).mock.invocationCallOrder, 0),
        ).toBeLessThan(getInvocationOrder(mockWebContents.loadURL.mock.invocationCallOrder, 0));
        expect(inMemorySession.setProxy).not.toHaveBeenCalled();
    });

    it('re-routes the live page through Tor when Tor is toggled on and keeps it open', async () => {
        initModule();
        await openPage();
        torSettings = mockTorSettings({ running: true });

        await changeTorSettings(torSettings);

        expect(inMemorySession.setProxy).toHaveBeenLastCalledWith(TOR_PROXY_CONFIG);
        expect(inMemorySession.closeAllConnections).toHaveBeenCalledTimes(1);
        expect(mockWebContents.close).not.toHaveBeenCalled();
    });

    it('closes the live page when its session cannot follow the toggle', async () => {
        initModule();
        await openPage();
        torSettings = mockTorSettings({ running: true });
        jest.mocked(inMemorySession.setProxy).mockImplementationOnce(() =>
            createHandledRejection('network service down'),
        );

        await changeTorSettings(torSettings);

        expect(mockWebContents.close).toHaveBeenCalledTimes(1);
        expect(mockContentView.removeChildView).toHaveBeenCalledTimes(1);
    });

    it('closes the live page instead of re-routing it when the store is wiped', async () => {
        torSettings = mockTorSettings({ running: true });
        initModule();
        await openPage();

        await changeTorSettings(undefined);

        expect(mockWebContents.close).toHaveBeenCalledTimes(1);
        expect(inMemorySession.setProxy).toHaveBeenCalledTimes(1);
    });

    it('does not create a session just because the Tor settings changed', async () => {
        torSettings = mockTorSettings({ running: true });
        initModule();

        await changeTorSettings(torSettings);

        expect(session.fromPartition).not.toHaveBeenCalled();
    });

    it('routes the next page afresh after a toggle closed the previous one', async () => {
        initModule();
        await openPage();
        torSettings = mockTorSettings({ running: true });
        jest.mocked(inMemorySession.setProxy).mockImplementationOnce(() =>
            createHandledRejection('network service down'),
        );
        await changeTorSettings(torSettings);

        await openPage();

        expect(inMemorySession.setProxy).toHaveBeenLastCalledWith(TOR_PROXY_CONFIG);
        expect(mockWebContents.loadURL).toHaveBeenCalledTimes(2);
    });
});
