import { type UnknownAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type BlockchainRootState,
    type FetchAndUpdateAccountThunkDeps,
    type FetchAndUpdateAccountThunkState,
    type WalletSettingsRootState,
    applySolanaStakingSignature,
    composeSolanaStakingTransaction,
    fetchAndUpdateAccountThunk,
    getSolanaStakingUserAgent,
    hasSolanaStakingBalanceChangedError,
    isEarnSigningCancelled,
    isSolanaStakingBalanceChangedErrorCode,
    isSupportedSolStakingNetworkSymbol,
    prepareSolanaStakeTxData,
    selectAddressDisplayType,
    selectBlockchainUrlBySymbol,
} from '@suite-common/wallet-core';
import {
    type Account,
    AddressDisplayOptions,
    type ComposeActionContext,
    type PrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { type Dispatch as AppDispatch, type WithServices } from '@trezor/redux-utils';

export type ComposeTransactionThunkState = BlockchainRootState & FetchAndUpdateAccountThunkState;

export type ComposeTransactionThunkDeps = FetchAndUpdateAccountThunkDeps;

export const composeTransactionThunk =
    (formValues: StakeFormState, formState: ComposeActionContext) =>
    async (
        dispatch: ThunkDispatch<
            ComposeTransactionThunkState,
            ComposeTransactionThunkDeps,
            UnknownAction
        >,
        getState: () => ComposeTransactionThunkState,
    ) => {
        const { account } = formState;
        if (account.networkType !== 'solana') return;

        const blockchainUrl = selectBlockchainUrlBySymbol(getState(), account.symbol);
        if (!blockchainUrl) return;

        const composedLevels = await composeSolanaStakingTransaction({
            formValues,
            composeContext: formState,
            blockchainUrl,
            userAgent: getSolanaStakingUserAgent(),
        });

        if (hasSolanaStakingBalanceChangedError(composedLevels)) {
            await dispatch(
                fetchAndUpdateAccountThunk({ accountKey: account.key, forceFullRefresh: true }),
            );
        }

        return composedLevels;
    };

type SignTransactionThunkState = BlockchainRootState &
    DeviceRootState &
    WalletSettingsRootState &
    FetchAndUpdateAccountThunkState;

type SignTransactionThunkDeps = WithServices<DesktopAnalyticsDep> & FetchAndUpdateAccountThunkDeps;

type SignTransactionThunkParams = {
    account: Account;
    formValues: StakeFormState;
    transactionInfo: PrecomposedTransactionFinal;
};

export const signTransactionThunk =
    ({ account, formValues, transactionInfo }: SignTransactionThunkParams) =>
    async (
        dispatch: AppDispatch,
        getState: () => SignTransactionThunkState,
        extra: SignTransactionThunkDeps,
    ) => {
        const device = selectSelectedDevice(getState());
        if (!device || transactionInfo?.type !== 'final') {
            return;
        }

        if (
            account.networkType !== 'solana' ||
            !isSupportedSolStakingNetworkSymbol(account.symbol)
        ) {
            return;
        }

        const blockchainUrl = selectBlockchainUrlBySymbol(getState(), account.symbol);
        if (!blockchainUrl) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: `Blockchain backend URL not found for ${account.symbol}.`,
                }),
            );

            return;
        }

        const addressDisplayType = selectAddressDisplayType(getState());

        const txData = await prepareSolanaStakeTxData({
            from: account.descriptor,
            symbol: account.symbol,
            amount: formValues.outputs[0]?.amount ?? '0',
            stakeType: formValues.stakeType,
            blockchainUrl,
            userAgent: getSolanaStakingUserAgent(),
            estimatedFee: {
                feePerTx: transactionInfo.fee,
                feeLimit: transactionInfo.feeLimit,
                feePerUnit: transactionInfo.feePerByte ?? '',
            },
        });

        if (!txData) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: 'Unknown stake action',
                }),
            );

            return;
        }

        if (!txData.success) {
            if (isSolanaStakingBalanceChangedErrorCode(txData.errorCode)) {
                await dispatch(
                    fetchAndUpdateAccountThunk({ accountKey: account.key, forceFullRefresh: true }),
                );
            }

            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: txData.errorMessage,
                }),
            );

            return;
        }

        const signedTx = await TrezorConnect.solanaSignTransaction({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            path: account.path,
            serializedTx: txData.txShim.serializeMessage(),
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });

        if (!signedTx.success) {
            if (isEarnSigningCancelled(signedTx.error)) {
                extra.services.analytics.report({
                    type: events.transactionCancelEvent.name,
                    payload: {
                        txType: 'stake',
                        networkSymbol: account.symbol,
                        stage: 'signing',
                    },
                });
            }

            // catch manual error from TransactionReviewModal
            if (signedTx.error.message === 'tx-cancelled') {
                return;
            }

            if (signedTx.error.message !== 'tx-timeout') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: signedTx.error.message,
                    }),
                );
            }

            return signedTx;
        }

        return applySolanaStakingSignature({
            txShim: txData.txShim,
            descriptor: account.descriptor,
            signature: signedTx.payload.signature,
        });
    };
