import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type DeviceRootState, selectAccountSigningDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
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
    hasStakedBalanceChangedError,
    isEarnSigningCancelled,
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
import { ERRORS } from '@trezor/connect-common';
import { type WithServices } from '@trezor/redux-utils';

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

        if (hasStakedBalanceChangedError(composedLevels)) {
            dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
        }

        return composedLevels;
    };

const pendingSignatures = new WeakMap<
    () => DeviceRootState,
    ReturnType<typeof TrezorConnect.solanaSignTransaction>
>();

type WaitForSolanaStakingSignatureThunkState = DeviceRootState;

export const waitForSolanaStakingSignatureThunk =
    () => (_dispatch: Dispatch, getState: () => WaitForSolanaStakingSignatureThunkState) =>
        pendingSignatures.get(getState)?.catch(() => undefined);

type SignTransactionThunkState = DeviceRootState & BlockchainRootState & WalletSettingsRootState;

type SignTransactionThunkDeps = WithServices<DesktopAnalyticsDep>;

type SignTransactionThunkParams = {
    device: TrezorDevice;
    account: Account;
    formValues: StakeFormState;
    transactionInfo: PrecomposedTransactionFinal;
};

export const signTransactionThunk =
    ({ account, device, formValues, transactionInfo }: SignTransactionThunkParams) =>
    async (
        dispatch: Dispatch<UnknownAction>,
        getState: () => SignTransactionThunkState,
        extra: SignTransactionThunkDeps,
    ) => {
        if (transactionInfo?.type !== 'final') {
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
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: txData.errorMessage,
                }),
            );

            return;
        }

        const signingDevice = selectAccountSigningDevice(
            getState(),
            account.deviceState,
            device.path,
        );
        if (!signingDevice) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: ERRORS.ERROR_CODES.Device_NotFound,
                }),
            );

            return;
        }

        const signature = TrezorConnect.solanaSignTransaction({
            device: {
                path: signingDevice.path,
                instance: signingDevice.instance,
                state: signingDevice.state,
                useEmptyPassphrase: signingDevice.useEmptyPassphrase,
            },
            path: account.path,
            serializedTx: txData.txShim.serializeMessage(),
            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
        });
        pendingSignatures.set(getState, signature);
        const signedTx = await signature.finally(() => {
            if (pendingSignatures.get(getState) === signature) pendingSignatures.delete(getState);
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
