import { createAction } from '@reduxjs/toolkit';

import { Discovery, PartialDiscovery } from '@suite-common/wallet-types';

export const DISCOVERY_MODULE_PREFIX = '@common/wallet-core/discovery';

export const createDiscovery = createAction(
    `${DISCOVERY_MODULE_PREFIX}/create`,
    (payload: Discovery) => ({
        payload,
    }),
);

export const startDiscovery = createAction(
    `${DISCOVERY_MODULE_PREFIX}/start`,
    (payload: Discovery) => ({
        payload,
    }),
);

export const interruptDiscovery = createAction(
    `${DISCOVERY_MODULE_PREFIX}/interrupt`,
    (payload: PartialDiscovery) => ({
        payload,
    }),
);

export const completeDiscovery = createAction(
    `${DISCOVERY_MODULE_PREFIX}/complete`,
    (payload: PartialDiscovery) => ({
        payload,
    }),
);

export const stopDiscovery = createAction(
    `${DISCOVERY_MODULE_PREFIX}/stop`,
    (payload: PartialDiscovery) => ({
        payload,
    }),
);

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
