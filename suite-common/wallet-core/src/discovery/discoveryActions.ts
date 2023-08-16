import { createAction } from '@reduxjs/toolkit';

import { PartialDiscovery } from '@suite-common/wallet-types';

export const DISCOVERY_MODULE_PREFIX = '@common/wallet-core/discovery';

export const createDiscovery = createAction(`${DISCOVERY_MODULE_PREFIX}/create`, payload => ({
    payload,
}));

export const startDiscovery = createAction(`${DISCOVERY_MODULE_PREFIX}/start`, payload => ({
    payload,
}));

export const interruptDiscovery = createAction(`${DISCOVERY_MODULE_PREFIX}/interrupt`, payload => ({
    payload,
}));

export const completeDiscovery = createAction(`${DISCOVERY_MODULE_PREFIX}/complete`, payload => ({
    payload,
}));

export const stopDiscovery = createAction(`${DISCOVERY_MODULE_PREFIX}/stop`, payload => ({
    payload,
}));

export const removeDiscovery = createAction(
    `${DISCOVERY_MODULE_PREFIX}/remove`,
    (deviceState: string): { payload: string } => ({
        payload: deviceState,
    }),
);

export const updateDiscovery = createAction(
    `${DISCOVERY_MODULE_PREFIX}/update`,
    (payload: PartialDiscovery) => ({ payload }),
);

export const discoveryActions = {
    createDiscovery,
    startDiscovery,
    removeDiscovery,
    updateDiscovery,
    completeDiscovery,
    stopDiscovery,
    interruptDiscovery,
};
