import { type Dispatch } from '@reduxjs/toolkit';

import { type SuiteSyncListener } from '@suite-common/suite-sync-types';
import { parseStaticSessionId } from '@trezor/device-utils';

import {
    clearDataForWallet,
    upsertManyAccounts,
    upsertManyAddresses,
    upsertManyOutputs,
    upsertManyWallets,
} from './suiteSyncDataReducer';

export type SuiteSyncListenerDeps = {
    dispatch: Dispatch;
};

export const createSuiteSyncListener = (deps: SuiteSyncListenerDeps): SuiteSyncListener => ({
    onEntityChange: {
        wallets: (_deviceStaticId, entities) => {
            deps.dispatch(upsertManyWallets(entities));
        },
        accounts: (deviceStaticSessionId, entities) => {
            const { walletDescriptor } = parseStaticSessionId(deviceStaticSessionId);
            deps.dispatch(upsertManyAccounts({ walletDescriptor, accounts: entities }));
        },
        addresses: (deviceStaticSessionId, entities) => {
            const { walletDescriptor } = parseStaticSessionId(deviceStaticSessionId);
            deps.dispatch(upsertManyAddresses({ walletDescriptor, addresses: entities }));
        },
        outputs: (deviceStaticSessionId, entities) => {
            const { walletDescriptor } = parseStaticSessionId(deviceStaticSessionId);
            deps.dispatch(upsertManyOutputs({ walletDescriptor, outputs: entities }));
        },
    },
    onUnsubscribe: ({ walletDescriptor }) => {
        deps.dispatch(clearDataForWallet(walletDescriptor));
    },
});
