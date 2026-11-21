import { type Result, err, ok } from '@trezor/type-utils';

import {
    type ServiceWorkerBuildInfo,
    ServiceWorkerBuildInfoSchema,
} from './serviceWorkerBuildInfo';
import { ServiceWorkerCacheUpdateMessageSchema } from './serviceWorkerCacheUpdate';
import { type ServiceWorkerControl, type ServiceWorkerUpdate } from './serviceWorkerControl';
import {
    SERVICE_WORKER_DEV_LOGS_PARAMETER,
    SERVICE_WORKER_SCRIPT_NAME,
    ServiceWorkerClientMessageType,
    type ServiceWorkerMessage,
    ServiceWorkerMessageType,
    getMessageType,
} from '../serviceWorkerProtocol';

/** The parts of the browser's service worker objects the control uses. */
export type ServiceWorkerApi = {
    scriptURL: string;
    postMessage: (message: ServiceWorkerMessage, transfer: Transferable[]) => void;
    addEventListener: (type: 'statechange', listener: () => void) => void;
    removeEventListener: (type: 'statechange', listener: () => void) => void;
};

export type ServiceWorkerRegistrationApi = {
    scope: string;
    installing: ServiceWorkerApi | null;
    waiting: ServiceWorkerApi | null;
    active: ServiceWorkerApi | null;
    unregister: () => Promise<boolean>;
    update: () => Promise<unknown>;
    addEventListener: (type: 'updatefound', listener: () => void) => void;
    removeEventListener: (type: 'updatefound', listener: () => void) => void;
};

export type ServiceWorkerContainerApi = {
    getRegistration: (clientUrl: string) => Promise<ServiceWorkerRegistrationApi | undefined>;
    register: (scriptUrl: string, options: RegistrationOptions) => Promise<unknown>;
    addEventListener: (
        type: 'controllerchange' | 'message',
        listener: (event: Event) => void,
        options?: AddEventListenerOptions,
    ) => void;
    removeEventListener: (
        type: 'controllerchange' | 'message',
        listener: (event: Event) => void,
    ) => void;
};

export type ServiceWorkerControlDeps = {
    /** `navigator.serviceWorker`, which browsers leave out in insecure contexts. */
    serviceWorkerContainer: ServiceWorkerContainerApi;
    /**
     * `navigator.serviceWorker.ready`: resolves once a worker is active for the page's URL,
     * which may be one of another app at a parent path.
     */
    waitForReadyRegistration: () => Promise<ServiceWorkerRegistrationApi>;
    /** Whether a worker controls the page: `navigator.serviceWorker.controller !== null`. */
    isPageControlled: () => boolean;
    /** `navigator.storage`, read for the storage usage only. */
    storageManager: { estimate: () => Promise<StorageEstimate> };
    /** The page's `caches`, for an uninstall while no worker is active yet. */
    cacheStorage: {
        keys: () => Promise<string[]>;
        delete: (cacheName: string) => Promise<boolean>;
    };
    /** `ASSET_PREFIX` of the build: the worker is served at `${assetPrefix}/sw.js` and controls `${assetPrefix}/`. */
    assetPrefix: string;
    /** `location.origin` of the page. */
    origin: string;
    reloadPage: () => void;
};

const BUILD_INFO_TIMEOUT_MS = 1000;

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

/** Browser APIs report failures by rejecting; the control reports them as results. */
const toResult = async <T>(
    operation: () => Promise<Result<T, string>>,
): Promise<Result<T, string>> => {
    try {
        return await operation();
    } catch (error) {
        return err(getErrorMessage(error));
    }
};

const sendMessage = (
    worker: ServiceWorkerApi,
    message: ServiceWorkerMessage,
    transfer: Transferable[] = [],
) => worker.postMessage(message, transfer);

/** A worker from an older deploy may not answer, so the request gives up after a while. */
const requestBuildInfo = (worker: ServiceWorkerApi) =>
    new Promise<ServiceWorkerBuildInfo | null>(resolve => {
        const channel = new MessageChannel();
        const timeout = setTimeout(() => {
            channel.port1.close();
            resolve(null);
        }, BUILD_INFO_TIMEOUT_MS);

        channel.port1.onmessage = (event: MessageEvent<unknown>) => {
            clearTimeout(timeout);
            channel.port1.close();

            const buildInfo = ServiceWorkerBuildInfoSchema.safeParse(event.data);
            resolve(buildInfo.success ? buildInfo.data : null);
        };

        sendMessage(worker, { type: ServiceWorkerMessageType.GetBuildInfo }, [channel.port2]);
    });

export const createServiceWorkerControl = (
    deps: ServiceWorkerControlDeps,
): ServiceWorkerControl => {
    const scriptUrl = `${deps.assetPrefix}/${SERVICE_WORKER_SCRIPT_NAME}`;
    const devLogsScriptUrl = `${scriptUrl}?${SERVICE_WORKER_DEV_LOGS_PARAMETER}`;
    const scope = new URL(`${deps.assetPrefix}/`, deps.origin).href;
    /**
     * A first install that fails removes the registration but leaves its partly filled caches.
     * They are looked for only once this page has enabled the worker,
     * so a page that never did keeps the cache storage untouched.
     */
    let hasBeenEnabled = false;

    // `getRegistration` falls back to a registration of a parent path, which belongs to another app.
    const getOwnRegistration = async () => {
        const registration = await deps.serviceWorkerContainer.getRegistration(scope);

        return registration?.scope === scope ? registration : undefined;
    };

    /** The URL is compared with the worker the browser installed last, which may still wait. */
    const isRegisteredWithScript = (
        registration: ServiceWorkerRegistrationApi,
        expectedScriptUrl: string,
    ) => {
        const newestWorker = registration.installing ?? registration.waiting ?? registration.active;

        return newestWorker?.scriptURL === new URL(expectedScriptUrl, deps.origin).href;
    };

    const getStorageUsage = async () => {
        try {
            const { usage } = await deps.storageManager.estimate();

            return usage ?? null;
        } catch {
            return null;
        }
    };

    const deleteScopeCaches = async () => {
        const cacheNames = await deps.cacheStorage.keys();
        await Promise.all(
            cacheNames
                .filter(cacheName => cacheName.endsWith(scope))
                .map(cacheName => deps.cacheStorage.delete(cacheName)),
        );
    };

    const uninstall = async (registration: ServiceWorkerRegistrationApi) => {
        // The active worker removes itself, see `uninstall` in the worker.
        if (registration.active) {
            sendMessage(registration.active, { type: ServiceWorkerMessageType.Uninstall });

            return;
        }

        // Without an active worker no tab is controlled, so the page can remove the registration itself.
        await registration.unregister();
        await deleteScopeCaches();
    };

    return {
        isSupported: () => true,

        reconcile: ({ isEnabled, isDevLogsEnabled }) =>
            toResult(async () => {
                const registration = await getOwnRegistration();
                const expectedScriptUrl = isDevLogsEnabled ? devLogsScriptUrl : scriptUrl;

                if (isEnabled) {
                    hasBeenEnabled = true;
                }

                if (
                    isEnabled &&
                    (!registration || !isRegisteredWithScript(registration, expectedScriptUrl))
                ) {
                    await deps.serviceWorkerContainer.register(expectedScriptUrl, {
                        scope,
                        updateViaCache: 'none',
                    });
                }

                if (!isEnabled && registration) {
                    await uninstall(registration);
                }

                if (!isEnabled && !registration && hasBeenEnabled) {
                    await deleteScopeCaches();
                }

                return ok();
            }),

        getStatus: () =>
            toResult(async () => {
                const registration = await getOwnRegistration();

                if (!registration) {
                    return ok(null);
                }

                const [buildInfo, storageUsage] = await Promise.all([
                    registration.active ? requestBuildInfo(registration.active) : null,
                    getStorageUsage(),
                ]);

                return ok({
                    scope: registration.scope,
                    isInstalling: registration.installing !== null,
                    isUpdateWaiting: registration.waiting !== null,
                    isActive: registration.active !== null,
                    buildInfo,
                    storageUsage,
                });
            }),

        checkForUpdate: () =>
            toResult(async () => {
                const registration = await getOwnRegistration();

                if (!registration) {
                    return err('The service worker is not registered.');
                }

                await registration.update();

                return ok();
            }),

        activateWaiting: () =>
            toResult(async () => {
                const registration = await getOwnRegistration();

                if (!registration?.waiting) {
                    return err('No update is waiting.');
                }

                sendMessage(registration.waiting, { type: ServiceWorkerMessageType.SkipWaiting });

                return ok();
            }),

        listenForReloadRequests: () => {
            const handleMessage = (event: Event) => {
                const isReloadRequest =
                    'data' in event &&
                    getMessageType(event.data) === ServiceWorkerClientMessageType.Reload;

                if (isReloadRequest) {
                    deps.reloadPage();
                }
            };
            deps.serviceWorkerContainer.addEventListener('message', handleMessage);

            return () => deps.serviceWorkerContainer.removeEventListener('message', handleMessage);
        },

        listenForCacheUpdates: onCacheUpdate => {
            const handleMessage = (event: Event) => {
                const message = ServiceWorkerCacheUpdateMessageSchema.safeParse(
                    'data' in event ? event.data : undefined,
                );

                if (message.success) {
                    onCacheUpdate(message.data.payload.updatedURL);
                }
            };
            deps.serviceWorkerContainer.addEventListener('message', handleMessage);

            return () => deps.serviceWorkerContainer.removeEventListener('message', handleMessage);
        },

        listenForTakeover: onTakeover => {
            let wasControlled = deps.isPageControlled();

            const handleControllerChange = () => {
                if (wasControlled) {
                    onTakeover();
                }

                wasControlled = deps.isPageControlled();
            };
            deps.serviceWorkerContainer.addEventListener(
                'controllerchange',
                handleControllerChange,
            );

            return () =>
                deps.serviceWorkerContainer.removeEventListener(
                    'controllerchange',
                    handleControllerChange,
                );
        },

        reloadPage: () => deps.reloadPage(),

        watchForUpdates: onWaitingUpdateChange => {
            let isWatching = true;
            let latestReportId = 0;
            let stopListening = () => {};

            const reportWaitingUpdate = async (registration: ServiceWorkerRegistrationApi) => {
                latestReportId += 1;
                const reportId = latestReportId;
                const { waiting } = registration;
                const buildInfo = waiting ? await requestBuildInfo(waiting) : null;
                const waitingUpdate: ServiceWorkerUpdate | null = waiting ? { buildInfo } : null;

                // A worker may change state again while it is asked for its build.
                if (isWatching && reportId === latestReportId) {
                    onWaitingUpdateChange(waitingUpdate);
                }
            };

            const watchRegistration = (registration: ServiceWorkerRegistrationApi) => {
                const watchedWorkers = new Set<ServiceWorkerApi>();
                const handleStateChange = () => reportWaitingUpdate(registration);
                const handleUpdateFound = () => {
                    const { installing } = registration;

                    if (installing) {
                        installing.addEventListener('statechange', handleStateChange);
                        watchedWorkers.add(installing);
                    }
                };

                registration.addEventListener('updatefound', handleUpdateFound);
                stopListening = () => {
                    registration.removeEventListener('updatefound', handleUpdateFound);
                    watchedWorkers.forEach(worker =>
                        worker.removeEventListener('statechange', handleStateChange),
                    );
                };
                reportWaitingUpdate(registration);
            };

            deps.waitForReadyRegistration().then(registration => {
                if (isWatching && registration.scope === scope) {
                    watchRegistration(registration);
                }
            });

            return () => {
                isWatching = false;
                stopListening();
            };
        },
    };
};
