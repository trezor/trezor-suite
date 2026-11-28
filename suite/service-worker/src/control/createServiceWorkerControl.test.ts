import { createMockDeps, mock } from '@trezor/dependency-injection';
import { err, ok } from '@trezor/type-utils';

import {
    type ServiceWorkerApi,
    type ServiceWorkerControlDeps,
    type ServiceWorkerRegistrationApi,
    createServiceWorkerControl,
} from './createServiceWorkerControl';
import { type ServiceWorkerBuildInfo } from './serviceWorkerBuildInfo';
import { type ServiceWorkerUpdate } from './serviceWorkerControl';
import {
    ServiceWorkerClientMessageType,
    type ServiceWorkerMessage,
    ServiceWorkerMessageType,
} from '../serviceWorkerProtocol';

const ORIGIN = 'https://suite.example';
const SCOPE = `${ORIGIN}/web/`;
const SCRIPT_URL = `${ORIGIN}/web/sw.js`;
const DEV_LOGS_SCRIPT_URL = `${ORIGIN}/web/sw.js?dev-logs`;

const buildInfo: ServiceWorkerBuildInfo = {
    version: '26.11.0',
    commit: 'abc123',
    precachedEntryCount: 481,
    isCachingEnabled: true,
};

const newerBuildInfo: ServiceWorkerBuildInfo = { ...buildInfo, version: '26.12.0' };

type MockWorkerParams = {
    /** What the worker answers to a build info request, the way `sw.ts` does. */
    answer?: unknown;
    scriptUrl?: string;
};

const mockWorker = ({
    answer = buildInfo,
    scriptUrl = SCRIPT_URL,
}: MockWorkerParams = {}): ServiceWorkerApi => ({
    scriptURL: scriptUrl,
    postMessage: mock<ServiceWorkerApi['postMessage']>((message, transfer) => {
        const [port] = transfer;

        if (message.type === ServiceWorkerMessageType.GetBuildInfo && port instanceof MessagePort) {
            port.postMessage(answer);
        }
    }),
    addEventListener: mock<ServiceWorkerApi['addEventListener']>(),
    removeEventListener: mock<ServiceWorkerApi['removeEventListener']>(),
});

const mockRegistration = (
    registration: Partial<ServiceWorkerRegistrationApi> = {},
): ServiceWorkerRegistrationApi => ({
    scope: SCOPE,
    installing: null,
    waiting: null,
    active: null,
    unregister: mock<ServiceWorkerRegistrationApi['unregister']>(() => Promise.resolve(true)),
    update: mock<ServiceWorkerRegistrationApi['update']>(() => Promise.resolve()),
    addEventListener: mock<ServiceWorkerRegistrationApi['addEventListener']>(),
    removeEventListener: mock<ServiceWorkerRegistrationApi['removeEventListener']>(),
    ...registration,
});

type MockControlDepsParams = {
    registration?: ServiceWorkerRegistrationApi;
    /** What `waitForReadyRegistration` resolves with, by default the registration; never without one. */
    readyRegistration?: ServiceWorkerRegistrationApi;
    cacheNames?: string[];
    isPageControlled?: boolean;
};

const mockControlDeps = ({
    registration,
    readyRegistration = registration,
    cacheNames = [],
    isPageControlled = true,
}: MockControlDepsParams = {}) =>
    createMockDeps<ServiceWorkerControlDeps>({
        serviceWorkerContainer: {
            getRegistration: () => Promise.resolve(registration),
            register: () => Promise.resolve(undefined),
            addEventListener: () => {},
            removeEventListener: () => {},
        },
        waitForReadyRegistration: () =>
            readyRegistration ? Promise.resolve(readyRegistration) : new Promise(() => {}),
        isPageControlled: () => isPageControlled,
        storageManager: { estimate: () => Promise.resolve({ usage: 2048, quota: 4096 }) },
        cacheStorage: {
            keys: () => Promise.resolve(cacheNames),
            delete: () => Promise.resolve(true),
        },
        assetPrefix: '/web',
        origin: ORIGIN,
        reloadPage: null,
    });

const getSentMessages = (worker: ServiceWorkerApi) =>
    jest.mocked(worker.postMessage).mock.calls.map(([message]): ServiceWorkerMessage => message);

/** Collects what `watchForUpdates` reports, which arrives asynchronously. */
const collectWaitingUpdates = () => {
    const waitingUpdates: Array<ServiceWorkerUpdate | null> = [];
    let notifyReport = () => {};

    const onWaitingUpdateChange = (waitingUpdate: ServiceWorkerUpdate | null) => {
        waitingUpdates.push(waitingUpdate);
        notifyReport();
    };

    const waitForReports = (count: number) =>
        new Promise<void>(resolve => {
            notifyReport = () => {
                if (waitingUpdates.length >= count) {
                    resolve();
                }
            };
            notifyReport();
        });

    return { waitingUpdates, onWaitingUpdateChange, waitForReports };
};

const flushTasks = () =>
    new Promise(resolve => {
        setTimeout(resolve, 0);
    });

describe(createServiceWorkerControl.name, () => {
    describe('reconcile', () => {
        it('registers the worker for the app scope when it is enabled and not registered', async () => {
            const deps = mockControlDeps();

            const result = await createServiceWorkerControl(deps).reconcile({
                isEnabled: true,
                isDevLogsEnabled: false,
            });

            expect(result).toEqual(ok());
            expect(deps.serviceWorkerContainer.register).toHaveBeenCalledWith('/web/sw.js', {
                scope: SCOPE,
                updateViaCache: 'none',
            });
        });

        it("registers the worker with Serwist's logs when the dev logs are enabled", async () => {
            const deps = mockControlDeps();

            await createServiceWorkerControl(deps).reconcile({
                isEnabled: true,
                isDevLogsEnabled: true,
            });

            expect(deps.serviceWorkerContainer.register).toHaveBeenCalledWith(
                '/web/sw.js?dev-logs',
                { scope: SCOPE, updateViaCache: 'none' },
            );
        });

        it('leaves an existing registration alone when it is enabled', async () => {
            const registration = mockRegistration({ active: mockWorker() });
            const deps = mockControlDeps({ registration });

            const result = await createServiceWorkerControl(deps).reconcile({
                isEnabled: true,
                isDevLogsEnabled: false,
            });

            expect(result).toEqual(ok());
            expect(deps.serviceWorkerContainer.register).not.toHaveBeenCalled();
            expect(registration.unregister).not.toHaveBeenCalled();
        });

        it('registers the worker again when the dev logs change', async () => {
            const registration = mockRegistration({ active: mockWorker() });
            const deps = mockControlDeps({ registration });

            await createServiceWorkerControl(deps).reconcile({
                isEnabled: true,
                isDevLogsEnabled: true,
            });

            expect(deps.serviceWorkerContainer.register).toHaveBeenCalledWith(
                '/web/sw.js?dev-logs',
                { scope: SCOPE, updateViaCache: 'none' },
            );
        });

        it('leaves a registration alone whose waiting worker already has the script', async () => {
            const registration = mockRegistration({
                active: mockWorker(),
                waiting: mockWorker({ scriptUrl: DEV_LOGS_SCRIPT_URL }),
            });
            const deps = mockControlDeps({ registration });

            await createServiceWorkerControl(deps).reconcile({
                isEnabled: true,
                isDevLogsEnabled: true,
            });

            expect(deps.serviceWorkerContainer.register).not.toHaveBeenCalled();
        });

        it('lets the active worker uninstall itself when it is disabled', async () => {
            const activeWorker = mockWorker();
            const registration = mockRegistration({ active: activeWorker });
            const deps = mockControlDeps({ registration });

            const result = await createServiceWorkerControl(deps).reconcile({
                isEnabled: false,
                isDevLogsEnabled: false,
            });

            expect(result).toEqual(ok());
            expect(getSentMessages(activeWorker)).toEqual([
                { type: ServiceWorkerMessageType.Uninstall },
            ]);
            /**
             * Unregistering from a page while another tab stays controlled
             * lets the next registration revive the old worker.
             */
            expect(registration.unregister).not.toHaveBeenCalled();
        });

        it('removes a registration without an active worker and its caches from the page', async () => {
            const registration = mockRegistration({ installing: mockWorker() });
            const deps = mockControlDeps({
                registration,
                cacheNames: [
                    `serwist-precache-v2-${SCOPE}`,
                    `serwist-precache-v2-${ORIGIN}/suite-web/branch/web/`,
                    'unrelated-cache',
                ],
            });

            const result = await createServiceWorkerControl(deps).reconcile({
                isEnabled: false,
                isDevLogsEnabled: false,
            });

            expect(result).toEqual(ok());
            expect(registration.unregister).toHaveBeenCalledTimes(1);
            expect(deps.cacheStorage.delete).toHaveBeenCalledTimes(1);
            expect(deps.cacheStorage.delete).toHaveBeenCalledWith(`serwist-precache-v2-${SCOPE}`);
        });

        it('does nothing when it is disabled and not registered', async () => {
            const deps = mockControlDeps();

            const result = await createServiceWorkerControl(deps).reconcile({
                isEnabled: false,
                isDevLogsEnabled: false,
            });

            expect(result).toEqual(ok());
            expect(deps.serviceWorkerContainer.register).not.toHaveBeenCalled();
            expect(deps.cacheStorage.keys).not.toHaveBeenCalled();
        });

        it('removes the caches of a failed first install once the worker was enabled', async () => {
            // A first install that fails removes the registration and leaves its partly filled precache.
            const deps = mockControlDeps({
                cacheNames: [`serwist-precache-v2-${SCOPE}`, 'unrelated-cache'],
            });
            const serviceWorkerControl = createServiceWorkerControl(deps);

            expect(
                await serviceWorkerControl.reconcile({ isEnabled: true, isDevLogsEnabled: false }),
            ).toEqual(ok());
            expect(
                await serviceWorkerControl.reconcile({ isEnabled: false, isDevLogsEnabled: false }),
            ).toEqual(ok());

            expect(deps.cacheStorage.delete).toHaveBeenCalledTimes(1);
            expect(deps.cacheStorage.delete).toHaveBeenCalledWith(`serwist-precache-v2-${SCOPE}`);
        });

        it('treats a registration of a parent path as one of another app', async () => {
            const parentActiveWorker = mockWorker();
            const parentRegistration = mockRegistration({
                scope: `${ORIGIN}/`,
                active: parentActiveWorker,
            });
            const deps = mockControlDeps({ registration: parentRegistration });
            const serviceWorkerControl = createServiceWorkerControl(deps);

            expect(
                await serviceWorkerControl.reconcile({ isEnabled: false, isDevLogsEnabled: false }),
            ).toEqual(ok());
            expect(parentActiveWorker.postMessage).not.toHaveBeenCalled();
            expect(parentRegistration.unregister).not.toHaveBeenCalled();

            expect(
                await serviceWorkerControl.reconcile({ isEnabled: true, isDevLogsEnabled: false }),
            ).toEqual(ok());
            expect(deps.serviceWorkerContainer.register).toHaveBeenCalledTimes(1);
        });

        it('reports a failed registration as an error', async () => {
            const deps = mockControlDeps();
            deps.serviceWorkerContainer.register.mockRejectedValue(
                new TypeError(
                    'Failed to register a ServiceWorker: A bad HTTP response code (404).',
                ),
            );

            const result = await createServiceWorkerControl(deps).reconcile({
                isEnabled: true,
                isDevLogsEnabled: false,
            });

            expect(result).toEqual(
                err('Failed to register a ServiceWorker: A bad HTTP response code (404).'),
            );
        });
    });

    describe('getStatus', () => {
        it('reports nothing while the worker is not registered', async () => {
            const result = await createServiceWorkerControl(mockControlDeps()).getStatus();

            expect(result).toEqual(ok(null));
        });

        it('reports the registration with the build info of the active worker', async () => {
            const registration = mockRegistration({
                active: mockWorker(),
                waiting: mockWorker(),
            });

            const result = await createServiceWorkerControl(
                mockControlDeps({ registration }),
            ).getStatus();

            expect(result).toEqual(
                ok({
                    scope: SCOPE,
                    isInstalling: false,
                    isUpdateWaiting: true,
                    isActive: true,
                    buildInfo,
                    storageUsage: 2048,
                }),
            );
        });

        it('reports no build info when the active worker answers in an unknown shape', async () => {
            const registration = mockRegistration({
                active: mockWorker({ answer: { version: 1 } }),
            });

            const result = await createServiceWorkerControl(
                mockControlDeps({ registration }),
            ).getStatus();

            expect(result.success && result.payload?.buildInfo).toBeNull();
        });
    });

    describe('checkForUpdate', () => {
        it('checks the registration for an update', async () => {
            const registration = mockRegistration({ active: mockWorker() });

            const result = await createServiceWorkerControl(
                mockControlDeps({ registration }),
            ).checkForUpdate();

            expect(result).toEqual(ok());
            expect(registration.update).toHaveBeenCalledTimes(1);
        });

        it('reports an error while the worker is not registered', async () => {
            const result = await createServiceWorkerControl(mockControlDeps()).checkForUpdate();

            expect(result.success).toBe(false);
        });
    });

    describe('listenForCacheUpdates', () => {
        const createMessageEvent = (data: unknown) => Object.assign(new Event('message'), { data });
        const updatedURL =
            'https://data.trezor.io/suite/definitions/stable/ethereum.simple.coin.definitions.v1.json';
        const cacheUpdateMessage = {
            type: 'CACHE_UPDATED',
            meta: 'serwist-broadcast-update',
            payload: {
                cacheName: 'suite-token-definitions-https://suite.trezor.io/web/',
                updatedURL,
            },
        };

        it('reports the URL of each file the worker updated, until it stops listening', () => {
            const deps = mockControlDeps();
            const onCacheUpdate = jest.fn();

            const stopListening =
                createServiceWorkerControl(deps).listenForCacheUpdates(onCacheUpdate);
            const [type, onMessage] =
                deps.serviceWorkerContainer.addEventListener.mock.calls[0] ?? [];

            expect(type).toBe('message');
            onMessage?.(createMessageEvent(cacheUpdateMessage));
            expect(onCacheUpdate).toHaveBeenCalledWith(updatedURL);

            stopListening();
            expect(deps.serviceWorkerContainer.removeEventListener).toHaveBeenCalledWith(
                'message',
                onMessage,
            );
        });

        it.each([
            ['another message of the worker', { type: ServiceWorkerClientMessageType.Reload }],
            ['a message without its URL', { ...cacheUpdateMessage, payload: { cacheName: 'x' } }],
            [
                'a message of another library',
                { ...cacheUpdateMessage, meta: 'workbox-broadcast-update' },
            ],
            ['no data', undefined],
        ])('ignores %s', (_, data) => {
            const deps = mockControlDeps();
            const onCacheUpdate = jest.fn();

            createServiceWorkerControl(deps).listenForCacheUpdates(onCacheUpdate);
            const [, onMessage] = deps.serviceWorkerContainer.addEventListener.mock.calls[0] ?? [];
            onMessage?.(createMessageEvent(data));

            expect(onCacheUpdate).not.toHaveBeenCalled();
        });
    });

    describe('listenForReloadRequests', () => {
        const createMessageEvent = (data: unknown) => Object.assign(new Event('message'), { data });

        it('reloads the page when the worker asks for it, until it stops listening', () => {
            const deps = mockControlDeps();
            deps.reloadPage.mockImplementation(() => {});

            const stopListening = createServiceWorkerControl(deps).listenForReloadRequests();
            const [type, onMessage] =
                deps.serviceWorkerContainer.addEventListener.mock.calls[0] ?? [];

            expect(type).toBe('message');
            onMessage?.(createMessageEvent({ type: 'GET_BUILD_INFO' }));
            expect(deps.reloadPage).not.toHaveBeenCalled();
            onMessage?.(createMessageEvent({ type: ServiceWorkerClientMessageType.Reload }));
            expect(deps.reloadPage).toHaveBeenCalledTimes(1);

            stopListening();
            expect(deps.serviceWorkerContainer.removeEventListener).toHaveBeenCalledWith(
                'message',
                onMessage,
            );
        });
    });

    describe('activateWaiting', () => {
        it('lets the waiting worker take over and leaves the reload to the takeover listener', async () => {
            const waitingWorker = mockWorker();
            const registration = mockRegistration({ active: mockWorker(), waiting: waitingWorker });
            const deps = mockControlDeps({ registration });

            const result = await createServiceWorkerControl(deps).activateWaiting();

            expect(result).toEqual(ok());
            expect(getSentMessages(waitingWorker)).toEqual([
                { type: ServiceWorkerMessageType.SkipWaiting },
            ]);
            expect(deps.serviceWorkerContainer.addEventListener).not.toHaveBeenCalled();
        });

        it('reports an error when no update is waiting', async () => {
            const registration = mockRegistration({ active: mockWorker() });
            const deps = mockControlDeps({ registration });

            const result = await createServiceWorkerControl(deps).activateWaiting();

            expect(result).toEqual(err('No update is waiting.'));
        });
    });

    describe('listenForTakeover', () => {
        const controllerChange = () => new Event('controllerchange');

        it('reports a newer worker taking over the page, until it stops listening', () => {
            const deps = mockControlDeps();
            const onTakeover = mock<() => void>();

            const stopListening = createServiceWorkerControl(deps).listenForTakeover(onTakeover);
            const [type, onControllerChange] =
                deps.serviceWorkerContainer.addEventListener.mock.calls[0] ?? [];

            expect(type).toBe('controllerchange');
            onControllerChange?.(controllerChange());
            expect(onTakeover).toHaveBeenCalledTimes(1);

            stopListening();
            expect(deps.serviceWorkerContainer.removeEventListener).toHaveBeenCalledWith(
                'controllerchange',
                onControllerChange,
            );
        });

        it('ignores the first install, which takes over a page no worker controlled', () => {
            const deps = mockControlDeps({ isPageControlled: false });
            const onTakeover = mock<() => void>();

            createServiceWorkerControl(deps).listenForTakeover(onTakeover);
            const [, onControllerChange] =
                deps.serviceWorkerContainer.addEventListener.mock.calls[0] ?? [];

            deps.isPageControlled.mockReturnValue(true);
            onControllerChange?.(controllerChange());
            expect(onTakeover).not.toHaveBeenCalled();

            onControllerChange?.(controllerChange());
            expect(onTakeover).toHaveBeenCalledTimes(1);
        });
    });

    describe('watchForUpdates', () => {
        it('reports the build of a worker that already waits once a worker is active', async () => {
            const registration = mockRegistration({
                active: mockWorker(),
                waiting: mockWorker({ answer: newerBuildInfo }),
            });
            const { waitingUpdates, onWaitingUpdateChange, waitForReports } =
                collectWaitingUpdates();

            createServiceWorkerControl(mockControlDeps({ registration })).watchForUpdates(
                onWaitingUpdateChange,
            );
            await waitForReports(1);

            expect(waitingUpdates).toEqual([{ buildInfo: newerBuildInfo }]);
        });

        it('reports a worker that finishes installing later, and then that none waits', async () => {
            const registration = mockRegistration({ active: mockWorker() });
            const { waitingUpdates, onWaitingUpdateChange, waitForReports } =
                collectWaitingUpdates();

            createServiceWorkerControl(mockControlDeps({ registration })).watchForUpdates(
                onWaitingUpdateChange,
            );
            await waitForReports(1);

            const newWorker = mockWorker({ answer: newerBuildInfo });
            const [, onUpdateFound] =
                jest.mocked(registration.addEventListener).mock.calls[0] ?? [];
            registration.installing = newWorker;
            onUpdateFound?.();
            const [, onStateChange] = jest.mocked(newWorker.addEventListener).mock.calls[0] ?? [];

            registration.installing = null;
            registration.waiting = newWorker;
            onStateChange?.();
            await waitForReports(2);

            registration.waiting = null;
            registration.active = newWorker;
            onStateChange?.();
            await waitForReports(3);

            expect(waitingUpdates).toEqual([null, { buildInfo: newerBuildInfo }, null]);
        });

        it('ignores a worker of another app at a parent path', async () => {
            const parentRegistration = mockRegistration({
                scope: `${ORIGIN}/`,
                active: mockWorker(),
                waiting: mockWorker(),
            });
            const onWaitingUpdateChange =
                mock<(waitingUpdate: ServiceWorkerUpdate | null) => void>();

            createServiceWorkerControl(
                mockControlDeps({ readyRegistration: parentRegistration }),
            ).watchForUpdates(onWaitingUpdateChange);
            await flushTasks();

            expect(onWaitingUpdateChange).not.toHaveBeenCalled();
            expect(parentRegistration.addEventListener).not.toHaveBeenCalled();
        });

        it('stops listening once unsubscribed', async () => {
            const registration = mockRegistration({ active: mockWorker() });
            const { onWaitingUpdateChange, waitForReports } = collectWaitingUpdates();

            const stopWatching = createServiceWorkerControl(
                mockControlDeps({ registration }),
            ).watchForUpdates(onWaitingUpdateChange);
            await waitForReports(1);
            stopWatching();

            const [type, onUpdateFound] =
                jest.mocked(registration.addEventListener).mock.calls[0] ?? [];
            expect(type).toBe('updatefound');
            expect(registration.removeEventListener).toHaveBeenCalledWith(
                'updatefound',
                onUpdateFound,
            );
        });
    });
});
