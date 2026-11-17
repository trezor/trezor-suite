import { createCallConnectPopup } from '@suite-common/connect-popup';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import {
    type MevProtectionRootState,
    selectIsMevProtectionFeatureEnabled,
} from '@suite-common/mev';
import {
    type AccountsRootState,
    type TransactionsRootState,
    type WalletSettingsRootState,
    ethereumGetCurrentNonceThunk,
    selectAccounts,
    selectIsMevProtectionEnabled,
} from '@suite-common/wallet-core';
import { type GetTrezorConnectDep } from '@trezor/connect-common';
import { toGetter } from '@trezor/dependency-injection';
import { type Dispatch } from '@trezor/redux-utils';

import { createBitcoinWalletConnectAdapter } from './adapters/createBitcoinWalletConnectAdapter';
import { createEthereumWalletConnectAdapter } from './adapters/createEthereumWalletConnectAdapter';
import { createSolanaWalletConnectAdapter } from './adapters/createSolanaWalletConnectAdapter';
import { createStellarWalletConnectAdapter } from './adapters/createStellarWalletConnectAdapter';
import { createTronWalletConnectAdapter } from './adapters/createTronWalletConnectAdapter';
import { type WalletConnectAdaptersDep } from './walletConnectTypes';

export type WalletConnectCompositionRootDeps = GetTrezorConnectDep<
    'blockchainEstimateFee' | 'composeTransaction' | 'pushTransaction'
> & {
    dispatch: Dispatch;
    getState: () => AccountsRootState &
        DeviceRootState &
        MevProtectionRootState &
        TransactionsRootState &
        WalletSettingsRootState;
};

export const createWalletConnectCompositionRoot = (
    deps: WalletConnectCompositionRootDeps,
): WalletConnectAdaptersDep => {
    const callConnectPopup = createCallConnectPopup({ dispatch: deps.dispatch });
    const getAccounts = toGetter(deps.getState, selectAccounts);
    const getSelectedDevice = toGetter(deps.getState, selectSelectedDevice);

    return {
        walletConnectAdapters: [
            createEthereumWalletConnectAdapter({
                callConnectPopup,
                getTrezorConnect: deps.getTrezorConnect,
                getAccounts,
                getSelectedDevice,
                getIsMevProtectionEnabled: toGetter(deps.getState, selectIsMevProtectionEnabled),
                getIsMevProtectionFeatureEnabled: toGetter(
                    deps.getState,
                    selectIsMevProtectionFeatureEnabled,
                ),
                getEthereumCurrentNonce: params =>
                    deps.dispatch(ethereumGetCurrentNonceThunk(params)).unwrap(),
            }),
            createSolanaWalletConnectAdapter({
                callConnectPopup,
                getTrezorConnect: deps.getTrezorConnect,
                getAccounts,
                getSelectedDevice,
            }),
            createBitcoinWalletConnectAdapter({
                callConnectPopup,
                getTrezorConnect: deps.getTrezorConnect,
                getAccounts,
                getSelectedDevice,
            }),
            createStellarWalletConnectAdapter({
                callConnectPopup,
                getTrezorConnect: deps.getTrezorConnect,
                getAccounts,
                getSelectedDevice,
            }),
            createTronWalletConnectAdapter({ callConnectPopup, getAccounts, getSelectedDevice }),
        ],
    };
};
