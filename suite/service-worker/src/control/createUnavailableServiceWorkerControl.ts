import { err, ok } from '@trezor/type-utils';

import { type ServiceWorkerControl } from './serviceWorkerControl';

const UNAVAILABLE_ERROR = 'Service workers are not available here.';

/** For the desktop app, and for browsers or insecure contexts without service workers. */
export const createUnavailableServiceWorkerControl = (): ServiceWorkerControl => ({
    isSupported: () => false,
    reconcile: ({ isEnabled }) => Promise.resolve(isEnabled ? err(UNAVAILABLE_ERROR) : ok()),
    getStatus: () => Promise.resolve(ok(null)),
    checkForUpdate: () => Promise.resolve(err(UNAVAILABLE_ERROR)),
    activateWaiting: () => Promise.resolve(err(UNAVAILABLE_ERROR)),
    listenForReloadRequests: () => () => {},
    listenForCacheUpdates: () => () => {},
    listenForTakeover: () => () => {},
    reloadPage: () => {},
    watchForUpdates: () => () => {},
});
