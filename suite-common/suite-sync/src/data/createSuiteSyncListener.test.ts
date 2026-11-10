import { type Dispatch } from '@reduxjs/toolkit';

import { type StaticSessionId, asWalletDescriptor } from '@trezor/device-utils';

import { type SuiteSyncListenerDeps, createSuiteSyncListener } from './createSuiteSyncListener';
import {
    type SuiteSyncDataState,
    initialSuiteSyncDataState,
    suiteSyncDataReducer,
} from './suiteSyncDataReducer';

const EJECTED_WALLET_DESCRIPTOR = asWalletDescriptor('ejectedWallet');
const REMAINING_WALLET_DESCRIPTOR = asWalletDescriptor('remainingWallet');
const DEVICE_STATIC_SESSION_ID: StaticSessionId = 'ejectedWallet@deviceId:0';

const createListenerWithState = () => {
    let state: SuiteSyncDataState = initialSuiteSyncDataState;
    const dispatch: Dispatch = action => {
        state = suiteSyncDataReducer(state, action);

        return action;
    };
    const deps: SuiteSyncListenerDeps = { dispatch };

    return { listener: createSuiteSyncListener(deps), getSuiteSyncDataState: () => state };
};

describe(createSuiteSyncListener.name, () => {
    // Recurring bug: https://github.com/trezor/trezor-suite/issues/25438
    it('clears only the unsubscribed wallet and keeps the labels of the other wallets', () => {
        const { listener, getSuiteSyncDataState } = createListenerWithState();
        listener.onEntityChange.wallets(DEVICE_STATIC_SESSION_ID, [
            { walletDescriptor: EJECTED_WALLET_DESCRIPTOR, label: 'Ejected wallet' },
            { walletDescriptor: REMAINING_WALLET_DESCRIPTOR, label: 'Remaining wallet' },
        ]);

        listener.onUnsubscribe({ walletDescriptor: EJECTED_WALLET_DESCRIPTOR });

        expect(getSuiteSyncDataState().wallets).toEqual({
            [REMAINING_WALLET_DESCRIPTOR]: {
                wallet: {
                    walletDescriptor: REMAINING_WALLET_DESCRIPTOR,
                    label: 'Remaining wallet',
                },
                accounts: {},
                addresses: {},
                outputs: {},
            },
        });
    });
});
