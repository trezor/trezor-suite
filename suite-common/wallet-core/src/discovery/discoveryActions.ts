import { createAction } from '@reduxjs/toolkit';

import { PartialDiscovery } from '@suite-common/wallet-types';

export const MODULE_PREFIX = '@common/wallet-core/discovery';

export const createDiscovery = createAction(`${MODULE_PREFIX}/create`, payload => ({ payload }));

export const startDiscovery = createAction(`${MODULE_PREFIX}/start`, payload => ({ payload }));

export const interruptDiscovery = createAction(`${MODULE_PREFIX}/interrupt`, payload => ({
    payload,
}));

export const completeDiscovery = createAction(`${MODULE_PREFIX}/complete`, payload => ({
    payload,
}));

export const stopDiscovery = createAction(`${MODULE_PREFIX}/stop`, payload => ({
    payload,
}));

export const removeDiscovery = createAction(
    `${MODULE_PREFIX}/remove`,
    (deviceState: string): { payload: string } => ({
        payload: deviceState,
    }),
);

export const updateDiscovery = createAction(
    `${MODULE_PREFIX}/update`,
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
