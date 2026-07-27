import { createAction } from '@reduxjs/toolkit';

import { type DiscoveryStatus } from '@suite-common/wallet-types';
import { type DeviceUniquePath } from '@trezor/connect';

export const DISCOVERY_MODULE_PREFIX = '@common/wallet-core/discovery';

export const updateDiscovery = createAction(
    `${DISCOVERY_MODULE_PREFIX}/update`,
    (status: DiscoveryStatus, path: DeviceUniquePath) => ({
        payload: {
            status,
            path,
        },
    }),
);

export const deleteDiscovery = createAction(
    `${DISCOVERY_MODULE_PREFIX}/delete`,
    (path: DeviceUniquePath) => ({
        payload: {
            path,
        },
    }),
);

type StartDiscoveryParams = {
    isAddingHiddenWallet?: boolean;
    isAddingExistingWallet?: boolean;
    useScopedCallIds?: boolean;
};

export const startDiscovery = createAction(
    `${DISCOVERY_MODULE_PREFIX}/start`,
    (
        path: DeviceUniquePath,
        {
            isAddingHiddenWallet,
            isAddingExistingWallet,
            useScopedCallIds,
        }: StartDiscoveryParams = {},
    ) => ({
        payload: {
            path,
            isAddingHiddenWallet,
            isAddingExistingWallet,
            useScopedCallIds,
        },
    }),
);

export const discoveryActions = {
    updateDiscovery,
    deleteDiscovery,
    startDiscovery,
};
