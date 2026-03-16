import { type Dispatch } from '@reduxjs/toolkit';

import { type SuiteSyncListener } from '@suite-common/suite-sync-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

import {
    clearDataForWallet,
    upsertManyAccounts,
    upsertManyAddresses,
    upsertManyOutputs,
    upsertManyWallets,
} from './suiteSyncDataReducer';

export type CreateSuiteSyncListenerDeps = {
    dispatch: Dispatch;
};

export const createSuiteSyncListener = (deps: CreateSuiteSyncListenerDeps): SuiteSyncListener => ({
    onEntityChange: {
        wallets: (_deviceStaticId, entities) => {
            deps.dispatch(upsertManyWallets(entities));
        },
        accounts: (deviceStaticSessionId, entities) => {
            const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);
            deps.dispatch(upsertManyAccounts({ walletDescriptor, accounts: entities }));
        },
        addresses: (deviceStaticSessionId, entities) => {
            const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);
            deps.dispatch(upsertManyAddresses({ walletDescriptor, addresses: entities }));
        },
        outputs: (deviceStaticSessionId, entities) => {
            const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);
            deps.dispatch(upsertManyOutputs({ walletDescriptor, outputs: entities }));
        },
    },
    onUnsubscribe: ({ walletDescriptor }) => {
        deps.dispatch(clearDataForWallet(walletDescriptor));
    },
});
