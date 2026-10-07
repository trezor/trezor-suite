import { useCallback } from 'react';

import { useChainPushTransaction } from '@suite-common/chain-data';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { injectDispatch, injectGetState } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    pushSendFormRawTransactionThunk,
    syncAccountsWithBlockchainThunk,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { ChainSendError } from '@trezor/network-module-suite-common-types';

import { useGetSendChainNetwork } from './useGetSendChainNetwork';

export type PushRawTransactionParams = {
    account: Account;

    /** The signed transaction the user pasted, hex encoded. */
    tx: string;
    isMevProtectionEnabled: boolean;
};

/**
 * Broadcasts a transaction signed elsewhere; `true` once broadcast. Failures are told to the user.
 *
 * With the `queryChainData` flag on, the account's chain network broadcasts it and the account is
 * read again; nothing is known about the transaction to show before the backend lists it.
 */
export const usePushRawTransaction = () => {
    const { dispatch, getState } = useServices(injectDispatch, injectGetState);
    const getSendChainNetwork = useGetSendChainNetwork();
    const { mutateAsync: pushTransaction } = useChainPushTransaction();

    return useCallback(
        async ({ account, tx, isMevProtectionEnabled }: PushRawTransactionParams) => {
            const network = getSendChainNetwork(account);

            if (!network) {
                return dispatch(
                    pushSendFormRawTransactionThunk({
                        tx,
                        symbol: account.symbol,
                        descriptor: account.descriptor,
                        identity: tryGetAccountIdentity(account),
                        isMevProtectionEnabled,
                    }),
                ).unwrap();
            }

            try {
                const { txid } = await pushTransaction({
                    network,
                    account,
                    serializedTx: tx,
                    isMevProtectionEnabled,
                });

                dispatch(
                    notificationsActions.addToast({
                        type: 'raw-tx-sent',
                        device: selectSelectedDevice(getState()),
                        descriptor: account.descriptor,
                        symbol: account.symbol,
                        txid,
                        style: { maxWidth: 'auto' },
                    }),
                );
                // The wallet's own sync still serves the views that read the store.
                dispatch(syncAccountsWithBlockchainThunk(account.symbol));

                return true;
            } catch (error) {
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: error instanceof ChainSendError ? error.message : 'unknown-error',
                    }),
                );

                return false;
            }
        },
        [dispatch, getState, getSendChainNetwork, pushTransaction],
    );
};
