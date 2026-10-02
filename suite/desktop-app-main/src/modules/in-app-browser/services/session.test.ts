import { type ProxyConfig, type Session, session } from 'electron';

import { getAppsEmbeddingCatalogEntry } from '@suite-common/apps-embedding';
import { ok } from '@trezor/type-utils';

import {
    applyTorProxy,
    followTorSettings,
    getTorProxyRules,
    resolveSessionForOpen,
} from './session';
import { Logger } from '../../../libs/logger';
import { MainWindowProxy } from '../../../libs/main-window-proxy';
import { type Store } from '../../../libs/store';
import { inAppBrowserContext } from '../context';
import { type MockSession, mockSession } from '../mocks/mockSession';
import { mockTorSettings } from '../mocks/mockTorSettings';

jest.mock('electron', () => ({
    session: {
        fromPartition: jest.fn(),
        fromPath: jest.fn(),
    },
}));

jest.mock('fs/promises', () => ({
    mkdir: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../libs/user-data', () => ({
    resolveDirectoryInUserDataDir: jest.fn((directory: string) => ({
        success: true,
        payload: { dir: `/user-data/${directory}` },
    })),
}));

globalThis.logger = new Logger('mute');

const TOR_PROXY_CONFIG = { proxyRules: 'socks5://127.0.0.1:9050' } satisfies ProxyConfig;
const EXTERNAL_TOR_PROXY_CONFIG = { proxyRules: 'socks5://127.0.0.1:9150' } satisfies ProxyConfig;
const SYSTEM_PROXY_CONFIG = { mode: 'system' } satisfies ProxyConfig;
const ROUTING_ERROR = 'the session could not be routed through the proxy Suite uses';

const getPersistentEntry = () => {
    const entry = getAppsEmbeddingCatalogEntry('google-pay-demo');

    if (entry === undefined) {
        throw new Error('the persistent catalog entry is gone');
    }

    return entry;
};

const flushPendingPromises = () => new Promise(resolve => setImmediate(resolve));

// Rejected up front and already handled: a production path that forgot to await the promise then
// fails an assertion instead of crashing the test process with an unhandled rejection.
const createHandledRejection = (message: string) => {
    const rejection = Promise.reject(new Error(message));

    rejection.catch(() => {});

    return rejection;
};

type RouteForOpenParams = {
    isPersistent: boolean;
};

describe('in-app browser sessions and Tor', () => {
    let torSettings: TorSettings;
    let inMemorySession: MockSession;
    let persistentSession: MockSession;
    let onCloseView: jest.Mock<Promise<void>, []>;

    const store = { getTorSettings: () => torSettings } as Pick<Store, 'getTorSettings'> as Store;

    // Routes a resolved session the way `openView` does once the previous view is torn down. The
    // teardown itself is left out, so that several sessions can hold a recorded route at once, as
    // they do after a toggle re-routes idle sessions.
    const routeForOpen = async ({ isPersistent }: RouteForOpenParams) => {
        const resolved = await resolveSessionForOpen(
            isPersistent ? getPersistentEntry() : undefined,
        );

        if (!resolved.success) {
            throw new Error(resolved.error);
        }

        const routed = await applyTorProxy(resolved.payload);

        if (!routed.success) {
            throw new Error(routed.error);
        }

        return resolved.payload;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        torSettings = mockTorSettings();
        inMemorySession = mockSession();
        persistentSession = mockSession({
            storagePath: '/user-data/in-app-browser/google-pay-demo',
        });
        onCloseView = jest.fn(() => Promise.resolve());

        jest.mocked(session.fromPartition).mockReturnValue(inMemorySession as Session);
        jest.mocked(session.fromPath).mockReturnValue(persistentSession as Session);

        inAppBrowserContext.set({
            mainWindowProxy: new MainWindowProxy(),
            store,
            sessions: new Map(),
            inMemorySession: undefined,
            appliedProxyRules: new Map(),
        });
    });

    it.each([
        { name: 'no rule while Tor is off', settings: {}, rules: '' },
        {
            name: 'no rule while an external Tor is configured but off',
            settings: { useExternalTor: true },
            rules: '',
        },
        {
            name: 'the bundled Tor port while Tor is on',
            settings: { running: true },
            rules: TOR_PROXY_CONFIG.proxyRules,
        },
        {
            name: 'the external Tor port while an external Tor is on',
            settings: { running: true, useExternalTor: true },
            rules: EXTERNAL_TOR_PROXY_CONFIG.proxyRules,
        },
        {
            name: 'the configured host',
            settings: { running: true, host: '10.0.0.2' },
            rules: 'socks5://10.0.0.2:9050',
        },
    ])('builds $name', ({ settings, rules }) => {
        expect(getTorProxyRules(mockTorSettings(settings))).toBe(rules);
    });

    describe('resolveSessionForOpen', () => {
        it('hands out the in-memory session without routing it', async () => {
            await expect(resolveSessionForOpen(undefined)).resolves.toEqual(ok(inMemorySession));

            expect(inMemorySession.setProxy).not.toHaveBeenCalled();
        });

        it('reuses the in-memory session instead of creating it on every open', async () => {
            await resolveSessionForOpen(undefined);
            await resolveSessionForOpen(undefined);

            expect(session.fromPartition).toHaveBeenCalledTimes(1);
        });

        it('hands out a persistent session for an entry that keeps its data', async () => {
            await expect(resolveSessionForOpen(getPersistentEntry())).resolves.toEqual(
                ok(persistentSession),
            );
        });
    });

    describe('applyTorProxy', () => {
        it('routes a session through Tor and resolves only once the proxy is set', async () => {
            torSettings = mockTorSettings({ running: true });
            let finishSettingProxy = () => {};
            let isRouted = false;
            jest.mocked(inMemorySession.setProxy).mockImplementation(
                () =>
                    new Promise<void>(resolve => {
                        finishSettingProxy = resolve;
                    }),
            );

            const routing = applyTorProxy(inMemorySession as Session).then(result => {
                isRouted = true;

                return result;
            });
            await flushPendingPromises();

            expect(inMemorySession.setProxy).toHaveBeenCalledWith(TOR_PROXY_CONFIG);
            expect(isRouted).toBe(false);

            finishSettingProxy();

            await expect(routing).resolves.toEqual(ok());
        });

        it('applies a rule once when a second caller asks for it while it is still being set', async () => {
            torSettings = mockTorSettings({ running: true });
            let finishSettingProxy = () => {};
            jest.mocked(inMemorySession.setProxy).mockImplementationOnce(
                () =>
                    new Promise<void>(resolve => {
                        finishSettingProxy = resolve;
                    }),
            );

            const first = applyTorProxy(inMemorySession as Session);
            const second = applyTorProxy(inMemorySession as Session);
            await flushPendingPromises();

            expect(inMemorySession.setProxy).toHaveBeenCalledTimes(1);

            finishSettingProxy();

            await expect(Promise.all([first, second])).resolves.toEqual([ok(), ok()]);
        });

        it('puts a session on the system proxy while Tor is off', async () => {
            await expect(applyTorProxy(inMemorySession as Session)).resolves.toEqual(ok());

            expect(inMemorySession.setProxy).toHaveBeenCalledWith(SYSTEM_PROXY_CONFIG);
        });

        it('leaves a session that already runs on the current route alone', async () => {
            await applyTorProxy(inMemorySession as Session);
            await applyTorProxy(inMemorySession as Session);

            expect(inMemorySession.setProxy).toHaveBeenCalledTimes(1);
            expect(inMemorySession.closeAllConnections).not.toHaveBeenCalled();
        });

        it('closes the connections of a session moved to another route', async () => {
            await applyTorProxy(inMemorySession as Session);
            torSettings = mockTorSettings({ running: true });

            await applyTorProxy(inMemorySession as Session);

            expect(inMemorySession.setProxy).toHaveBeenLastCalledWith(TOR_PROXY_CONFIG);
            expect(inMemorySession.closeAllConnections).toHaveBeenCalledTimes(1);
        });

        it('fails when the proxy cannot be set and retries on the next attempt', async () => {
            torSettings = mockTorSettings({ running: true });
            jest.mocked(inMemorySession.setProxy).mockImplementationOnce(() =>
                createHandledRejection('network service down'),
            );

            await expect(applyTorProxy(inMemorySession as Session)).resolves.toEqual({
                success: false,
                error: ROUTING_ERROR,
            });
            await expect(applyTorProxy(inMemorySession as Session)).resolves.toEqual(ok());

            expect(inMemorySession.setProxy).toHaveBeenCalledTimes(2);
        });

        it('keeps the previous route on a failed change, so the old connections are closed once it succeeds', async () => {
            await applyTorProxy(inMemorySession as Session);
            torSettings = mockTorSettings({ running: true });
            jest.mocked(inMemorySession.setProxy).mockImplementationOnce(() =>
                createHandledRejection('network service down'),
            );

            await applyTorProxy(inMemorySession as Session);
            expect(inMemorySession.closeAllConnections).not.toHaveBeenCalled();

            await expect(applyTorProxy(inMemorySession as Session)).resolves.toEqual(ok());

            expect(inMemorySession.setProxy).toHaveBeenLastCalledWith(TOR_PROXY_CONFIG);
            expect(inMemorySession.closeAllConnections).toHaveBeenCalledTimes(1);
        });

        it('keeps the new route when the old connections cannot be closed', async () => {
            await applyTorProxy(inMemorySession as Session);
            torSettings = mockTorSettings({ running: true });
            jest.mocked(inMemorySession.closeAllConnections).mockImplementationOnce(() =>
                createHandledRejection('still draining'),
            );

            await expect(applyTorProxy(inMemorySession as Session)).resolves.toEqual(ok());
            await expect(applyTorProxy(inMemorySession as Session)).resolves.toEqual(ok());

            expect(inMemorySession.setProxy).toHaveBeenCalledTimes(2);
            expect(inMemorySession.setProxy).toHaveBeenLastCalledWith(TOR_PROXY_CONFIG);
        });
    });

    describe('followTorSettings', () => {
        it('re-routes every created session and drops their connections when Tor is toggled on', async () => {
            await routeForOpen({ isPersistent: false });
            await routeForOpen({ isPersistent: true });
            torSettings = mockTorSettings({ running: true });

            await followTorSettings(torSettings, onCloseView);

            [inMemorySession, persistentSession].forEach(created => {
                expect(created.setProxy).toHaveBeenLastCalledWith(TOR_PROXY_CONFIG);
                expect(created.closeAllConnections).toHaveBeenCalledTimes(1);
            });
            expect(onCloseView).not.toHaveBeenCalled();
        });

        it('puts every live session back on the system proxy when Tor is toggled off', async () => {
            torSettings = mockTorSettings({ running: true });
            await routeForOpen({ isPersistent: false });
            await routeForOpen({ isPersistent: true });
            torSettings = mockTorSettings({ running: false });

            await followTorSettings(torSettings, onCloseView);

            [inMemorySession, persistentSession].forEach(created => {
                expect(created.setProxy).toHaveBeenLastCalledWith(SYSTEM_PROXY_CONFIG);
                expect(created.closeAllConnections).toHaveBeenCalledTimes(1);
            });
        });

        it('re-routes a live session when switching to an external Tor while it is running', async () => {
            torSettings = mockTorSettings({ running: true });
            await routeForOpen({ isPersistent: false });
            torSettings = mockTorSettings({ running: true, useExternalTor: true });

            await followTorSettings(torSettings, onCloseView);

            expect(inMemorySession.setProxy).toHaveBeenLastCalledWith(EXTERNAL_TOR_PROXY_CONFIG);
            expect(inMemorySession.closeAllConnections).toHaveBeenCalledTimes(1);
        });

        it('leaves a session alone when the Tor settings change without changing the rule', async () => {
            await routeForOpen({ isPersistent: false });
            torSettings = mockTorSettings({ externalPort: 9151 });

            await followTorSettings(torSettings, onCloseView);

            expect(inMemorySession.setProxy).toHaveBeenCalledTimes(1);
            expect(inMemorySession.closeAllConnections).not.toHaveBeenCalled();
            expect(onCloseView).not.toHaveBeenCalled();
        });

        it('routes a session whose route was forgotten by a closed view without closing anything', async () => {
            await routeForOpen({ isPersistent: false });
            const { appliedProxyRules } = await inAppBrowserContext.get();
            appliedProxyRules.clear();
            torSettings = mockTorSettings({ running: true });

            await followTorSettings(torSettings, onCloseView);

            expect(inMemorySession.setProxy).toHaveBeenLastCalledWith(TOR_PROXY_CONFIG);
            expect(inMemorySession.closeAllConnections).not.toHaveBeenCalled();
        });

        it('does not create the in-memory session just to route it', async () => {
            torSettings = mockTorSettings({ running: true });

            await followTorSettings(torSettings, onCloseView);

            expect(session.fromPartition).not.toHaveBeenCalled();
        });

        it('closes the view when a live session could not follow a toggle', async () => {
            await routeForOpen({ isPersistent: false });
            torSettings = mockTorSettings({ running: true });
            jest.mocked(inMemorySession.setProxy).mockImplementationOnce(() =>
                createHandledRejection('network service down'),
            );

            await followTorSettings(torSettings, onCloseView);

            expect(onCloseView).toHaveBeenCalledTimes(1);
        });

        it.each([
            {
                name: 'the persistent',
                failing: () => persistentSession,
                following: () => inMemorySession,
            },
            {
                name: 'the in-memory',
                failing: () => inMemorySession,
                following: () => persistentSession,
            },
        ])(
            'closes the view when only $name session could not follow while the other did',
            async ({ failing, following }) => {
                await routeForOpen({ isPersistent: false });
                await routeForOpen({ isPersistent: true });
                torSettings = mockTorSettings({ running: true });
                jest.mocked(failing().setProxy).mockImplementationOnce(() =>
                    createHandledRejection('network service down'),
                );

                await followTorSettings(torSettings, onCloseView);

                expect(following().setProxy).toHaveBeenLastCalledWith(TOR_PROXY_CONFIG);
                expect(onCloseView).toHaveBeenCalledTimes(1);
            },
        );

        it('closes the view instead of re-routing when the store is wiped', async () => {
            torSettings = mockTorSettings({ running: true });
            await routeForOpen({ isPersistent: false });

            await followTorSettings(undefined, onCloseView);

            expect(onCloseView).toHaveBeenCalledTimes(1);
            expect(inMemorySession.setProxy).toHaveBeenCalledTimes(1);
            expect(inMemorySession.closeAllConnections).not.toHaveBeenCalled();
        });
    });
});
