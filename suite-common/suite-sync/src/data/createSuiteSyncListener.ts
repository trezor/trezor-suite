import { type Dispatch } from '@reduxjs/toolkit';

import { type SuiteSyncListener } from '@suite-common/suite-sync-types';
import { parseStaticSessionId } from '@trezor/device-utils';

import {
    clearDataForWallet,
    upsertManyAccounts,
    upsertManyAddresses,
    upsertManyContactAddresses,
    upsertManyContacts,
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
        contacts: (deviceStaticSessionId, entities) => {
            const { walletDescriptor } = parseStaticSessionId(deviceStaticSessionId);
            deps.dispatch(upsertManyContacts({ walletDescriptor, contacts: entities }));
        },
        contactAddresses: (deviceStaticSessionId, entities) => {
            const { walletDescriptor } = parseStaticSessionId(deviceStaticSessionId);
            deps.dispatch(
                upsertManyContactAddresses({ walletDescriptor, contactAddresses: entities }),
            );
        },
    },
    onUnsubscribe: ({ walletDescriptor }) => {
        deps.dispatch(clearDataForWallet(walletDescriptor));
    },
});
