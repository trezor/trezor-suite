import { closeModal, openDeferredModal, preserveModal } from '@suite/modal';
import { selectSelectedDevice } from '@suite-common/device';
import { buildStablecoinYieldTransactionReview } from '@suite-common/earn-stablecoin/src/signing';
import {
    type YieldFlowDisplayToken,
    selectAddressDisplayType,
    selectIsMevProtectionEnabled,
    stablecoinYieldActions,
    synchronizeSentTransactionThunk,
} from '@suite-common/wallet-core';
import {
    type Account,
    AddressDisplayOptions,
    type EvmSelectedFee,
} from '@suite-common/wallet-types';
import { getAccountIdentity, getMevProtectedTxData } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import type { AppState, Dispatch } from 'src/types/suite';

export const getYieldErrorTranslationKey = (error: unknown) =>
    error instanceof Error &&
    (error.cause === 'Device_InvalidState' || // incorrect passphrase submitted
        error.cause === 'Method_Interrupted') // passphrase modal closed
        ? 'TR_EARN_YIELD_ERROR_PASSPHRASE_INCORRECT'
        : 'TR_EARN_YIELD_ERROR_GENERIC';

export type SendYieldTransactionParams = {
    account: Account;
    amount: string;
    token: YieldFlowDisplayToken;
    unsignedTransaction: string;
    dispatch: Dispatch;
    getState: () => AppState;
    selectedFee: EvmSelectedFee | null;
};

export const sendYieldTransaction = async ({
    account,
    amount,
    token,
    unsignedTransaction,
    dispatch,
    getState,
    selectedFee,
}: SendYieldTransactionParams) => {
    const device = selectSelectedDevice(getState());
    const addressDisplayType = selectAddressDisplayType(getState());

    if (!device) {
        throw new Error('Device not found.');
    }

    if (account.networkType !== 'ethereum') {
        throw new Error('Yield actions currently support only EVM accounts.');
    }

    const transactionReview = buildStablecoinYieldTransactionReview({
        unsignedTransaction,
        selectedFee,
        amount,
        token,
        symbol: account.symbol,
    });

    const { transactionForSigning, formState, precomposedTransaction } = transactionReview;

    dispatch(
        stablecoinYieldActions.storePrecomposedTransaction({
            precomposedTx: precomposedTransaction,
            precomposedForm: formState,
            accountKey: account.key,
        }),
    );

    try {
        dispatch(preserveModal());

        const signingResponse = await TrezorConnect.ethereumSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: account.path,
            transaction: transactionForSigning,
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!signingResponse.success) {
            dispatch(closeModal());

            const { code } = signingResponse.error;
            if (code === 'Failure_ActionCancelled' || code === 'Method_Cancel') {
                return;
            }

            throw new Error(`${code}: ${signingResponse.error.message}`, { cause: code });
        }

        dispatch(
            stablecoinYieldActions.storeSignedTransaction({
                serializedTx: {
                    tx: signingResponse.payload.serializedTx,
                    symbol: account.symbol,
                },
            }),
        );

        const isPushConfirmed = await dispatch(openDeferredModal({ type: 'review-transaction' }));

        if (!isPushConfirmed) {
            return;
        }

        const isMevProtectionEnabled = selectIsMevProtectionEnabled(getState());
        const pushResponse = await TrezorConnect.pushTransaction({
            tx: getMevProtectedTxData(
                account.symbol,
                signingResponse.payload.serializedTx,
                isMevProtectionEnabled,
            ),
            coin: account.symbol,
            identity: getAccountIdentity(account),
        });

        dispatch(closeModal());

        if (!pushResponse.success) {
            throw new Error(`${pushResponse.error.code}: ${pushResponse.error.message}`);
        }

        dispatch(
            synchronizeSentTransactionThunk({
                selectedAccount: account,
                precomposedTransaction,
                precomposedForm: formState,
                txid: pushResponse.payload.txid,
            }),
        );

        return pushResponse.payload;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        dispatch(stablecoinYieldActions.discardTransaction());
    }
};
