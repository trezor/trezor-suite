import { Dispatch } from '@reduxjs/toolkit';

import { SuiteSyncListener } from '@suite-common/suite-sync-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

import {
    addManyAccounts,
    addManyAddresses,
    addManyOutputs,
    clearAll,
    setWallet,
} from './suiteSyncDataReducer';

export type CreateSuiteSyncListenerDeps = {
    dispatch: Dispatch;
};

export const createSuiteSyncListener = (deps: CreateSuiteSyncListenerDeps): SuiteSyncListener => ({
    onEntityChange: {
        wallets: (_deviceStaticId, entity) => {
            deps.dispatch(setWallet(entity));
        },
        accounts: (deviceStaticSessionId, entity) => {
            const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);
            deps.dispatch(addManyAccounts({ walletDescriptor, accounts: [entity] }));
        },
        addresses: (deviceStaticSessionId, entity) => {
            const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);
            deps.dispatch(addManyAddresses({ walletDescriptor, addresses: [entity] }));
        },
        outputs: (deviceStaticSessionId, entity) => {
            const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);
            deps.dispatch(addManyOutputs({ walletDescriptor, outputs: [entity] }));
        },
    },
    onUnsubscribe: () => {
        deps.dispatch(clearAll());
    },
});
