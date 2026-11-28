import { useEffect } from 'react';

import { useServices } from '@trezor/dependency-injection';

import { injectServiceWorkerControl } from '../control/serviceWorkerControl';

type UseServiceWorkerCacheUpdatesParams = {
    /** Called with the URL of the file, for each newer copy the worker stores. */
    onCacheUpdate: (url: string) => void;
};

/** Lets the app load again a file the worker served from its cache once a newer copy arrives. */
export const useServiceWorkerCacheUpdates = ({
    onCacheUpdate,
}: UseServiceWorkerCacheUpdatesParams) => {
    const { serviceWorkerControl } = useServices(injectServiceWorkerControl);

    useEffect(
        () => serviceWorkerControl.listenForCacheUpdates(onCacheUpdate),
        [serviceWorkerControl, onCacheUpdate],
    );
};
