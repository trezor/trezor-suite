import { createAction } from '@reduxjs/toolkit';

import { type DiscoveryTrigger } from '@suite-common/wallet-types';
import { type DeviceUniquePath } from '@trezor/connect';

export const DISCOVERY_MODULE_PREFIX = '@common/wallet-core/discovery';

type StartDiscoveryParams = {
    trigger: DiscoveryTrigger;
    callId?: string;
    isAddingHiddenWallet?: boolean;
    isAddingExistingWallet?: boolean;
    useScopedCallIds?: boolean;
};

export const startDiscovery = createAction(
    `${DISCOVERY_MODULE_PREFIX}/start`,
    (
        path: DeviceUniquePath,
        {
            trigger,
            callId,
            isAddingHiddenWallet,
            isAddingExistingWallet,
            useScopedCallIds,
        }: StartDiscoveryParams,
    ) => ({
        payload: {
            path,
            trigger,
            callId,
            isAddingHiddenWallet,
            isAddingExistingWallet,
            useScopedCallIds,
        },
    }),
);

export const discoveryActions = {
    startDiscovery,
};
