import { type Result } from '@trezor/type-utils';

import { type ServiceWorkerBuildInfo } from './serviceWorkerBuildInfo';

export type ServiceWorkerStatus = {
    scope: string;
    isInstalling: boolean;
    isUpdateWaiting: boolean;
    isActive: boolean;
    /** `null` while no worker is active, or when the active one does not answer. */
    buildInfo: ServiceWorkerBuildInfo | null;
    /** Bytes the whole origin stores, `null` where the browser gives no estimate. */
    storageUsage: number | null;
};

/** A newer worker that is installed and waits to take over. */
export type ServiceWorkerUpdate = {
    /** `null` when the waiting worker does not answer. */
    buildInfo: ServiceWorkerBuildInfo | null;
};

export type ServiceWorkerReconcileParams = {
    isEnabled: boolean;
    /** Registers a worker with Serwist's logs on, which only dev builds contain. */
    isDevLogsEnabled: boolean;
};

/**
 * Browser work around the app's service worker. It is injected, so shared code never touches the
 * service worker APIs, and the desktop app gets an implementation that reports them unavailable.
 * @serviceContract
 */
export type ServiceWorkerControl = {
    isSupported: () => boolean;
    /**
     * Registers the worker while enabled and uninstalls it otherwise; does nothing when it already matches.
     * Switching the dev logs registers the worker again, and the new one waits like any update.
     */
    reconcile: (params: ServiceWorkerReconcileParams) => Promise<Result<void, string>>;
    /** `null` while no worker is registered for the app's scope. */
    getStatus: () => Promise<Result<ServiceWorkerStatus | null, string>>;
    checkForUpdate: () => Promise<Result<void, string>>;
    /** Lets the waiting worker take over; the tabs then reload, see `listenForTakeover`. */
    activateWaiting: () => Promise<Result<void, string>>;
    /** Reloads the page when the worker asks for it while it uninstalls itself; returns the unsubscribe. */
    listenForReloadRequests: () => () => void;
    /**
     * Calls back with the URL of a file each time the worker stores a newer copy of it
     * than the one it served from its cache. Returns the unsubscribe.
     */
    listenForCacheUpdates: (onCacheUpdate: (url: string) => void) => () => void;
    /**
     * Calls back when a newer worker takes over this page, which still runs the older build.
     * The first install takes over a page no worker controlled, which does not count. Returns the unsubscribe.
     */
    listenForTakeover: (onTakeover: () => void) => () => void;
    reloadPage: () => void;
    /**
     * Reports the waiting update once a worker is active, and again whenever it changes:
     * `null` while none waits. Returns the unsubscribe.
     */
    watchForUpdates: (
        onWaitingUpdateChange: (waitingUpdate: ServiceWorkerUpdate | null) => void,
    ) => () => void;
};

export type ServiceWorkerControlDep = { serviceWorkerControl: ServiceWorkerControl };

export const injectServiceWorkerControl = (
    services: ServiceWorkerControlDep,
): ServiceWorkerControlDep => ({
    serviceWorkerControl: services.serviceWorkerControl,
});
