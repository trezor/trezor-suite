import { type WalletKitTypes } from '@reown/walletkit';

import * as trezorConnectPopupActions from '@suite-common/connect-popup';
import {
    type MevProtectionRootState,
    selectIsMevProtectionFeatureEnabled,
} from '@suite-common/mev';
import { type NetworkModuleRepositoryDep, type NetworkSymbol } from '@suite-common/networks';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    type EthereumGetCurrentNonceThunkState,
    type WalletSettingsRootState,
    ethereumGetCurrentNonceThunk,
    selectAccounts,
    selectIsMevProtectionEnabled,
} from '@suite-common/wallet-core';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import type {
    WalletConnectCallDeviceResult,
    WalletConnectRequestContext,
} from '@trezor/network-module-suite-common-types';

import { WALLETCONNECT_MODULE } from './walletConnectConstants';
import { getWalletConnectAdapterByMethod, toWalletConnectAccount } from './walletConnectNetworks';
import { type WalletConnectStateRootState, selectSessionByTopic } from './walletConnectReducer';

export type WalletConnectRequestThunkState = trezorConnectPopupActions.ConnectPopupCallThunkState &
    AccountsRootState &
    WalletConnectStateRootState &
    MevProtectionRootState &
    WalletSettingsRootState &
    EthereumGetCurrentNonceThunkState;

export type WalletConnectRequestThunkDeps = trezorConnectPopupActions.ConnectPopupCallThunkDeps &
    WithServices<{ networks: NetworkModuleRepositoryDep }>;

/** Lets the network module that owns the method answer the request of a dApp. */
export const walletConnectRequestThunk = createThunk<
    unknown,
    { event: WalletKitTypes.SessionRequest },
    { state: WalletConnectRequestThunkState; extra: WalletConnectRequestThunkDeps }
>(`${WALLETCONNECT_MODULE}/requestThunk`, async ({ event }, { dispatch, getState, extra }) => {
    const adapter = getWalletConnectAdapterByMethod({
        method: event.params.request.method,
        networkModuleRepository: extra.services.networks.networkModuleRepository,
    });
    if (!adapter) {
        throw new Error('Unsupported method');
    }

    const session = selectSessionByTopic(getState(), event.topic);
    if (!session) {
        throw new Error('WalletConnect Session not found');
    }

    const accounts = selectAccounts(getState());
    const source = {
        type: 'walletconnect' as const,
        origin: event.verifyContext.verified.origin,
        manifest: {
            appName: session.peer.metadata.name,
            appIcon: session.peer.metadata.icons?.[0],
        },
    };

    const context: WalletConnectRequestContext<NetworkSymbol> = {
        request: {
            method: event.params.request.method,
            params: event.params.request.params,
            chainId: event.params.chainId,
        },
        accounts: accounts.map(toWalletConnectAccount),
        sessionSymbol: session.lastAccount?.symbol,
        callDevice: (method, payload) => {
            dispatch(trezorConnectPopupActions.connectPopupCallThunk({ method, payload, source }));

            // The call thunk resolves this deferred when the popup call ends.
            return trezorConnectPopupActions.getPopupCallDeferred(true).promise as Promise<
                WalletConnectCallDeviceResult<typeof method>
            >;
        },
        resolveNonce: async walletConnectAccount => {
            const account = accounts.find(
                a =>
                    a.symbol === walletConnectAccount.symbol &&
                    a.descriptor === walletConnectAccount.descriptor &&
                    getAccountIdentity(a) === walletConnectAccount.identity,
            );
            if (account?.networkType !== 'ethereum') {
                throw new Error('Account not found');
            }

            const { nonce } = await dispatch(
                ethereumGetCurrentNonceThunk({
                    selectedAccount: account,
                    fetchConfirmedNonce: true,
                }),
            ).unwrap();

            return nonce;
        },
        isMevProtectionEnabled:
            selectIsMevProtectionEnabled(getState()) &&
            selectIsMevProtectionFeatureEnabled(getState()),
    };

    return await adapter.handleRequest(context);
});
