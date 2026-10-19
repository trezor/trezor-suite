import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type BlockchainRootState,
    type WalletSettingsRootState,
    applySolanaStakingSignature,
    composeSolanaStakingTransaction,
    getSolanaStakingUserAgent,
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
import { type WithServices } from '@trezor/redux-utils';

type ComposeTransactionThunkState = BlockchainRootState;

export const composeTransactionThunk =
    (formValues: StakeFormState, formState: ComposeActionContext) =>
    async (_: Dispatch<UnknownAction>, getState: () => ComposeTransactionThunkState) => {
        const { account } = formState;
        if (account.networkType !== 'solana') return;

        const blockchainUrl = selectBlockchainUrlBySymbol(getState(), account.symbol);
        if (!blockchainUrl) return;

        return await composeSolanaStakingTransaction({
            formValues,
            composeContext: formState,
            blockchainUrl,
            userAgent: getSolanaStakingUserAgent(),
        });
    };

type SignTransactionThunkState = BlockchainRootState & DeviceRootState & WalletSettingsRootState;

type SignTransactionThunkDeps = WithServices<DesktopAnalyticsDep>;

type SignTransactionThunkParams = {
    account: Account;
    formValues: StakeFormState;
    transactionInfo: PrecomposedTransactionFinal;
};

export const signTransactionThunk =
    ({ account, formValues, transactionInfo }: SignTransactionThunkParams) =>
    async (
        dispatch: Dispatch<UnknownAction>,
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
