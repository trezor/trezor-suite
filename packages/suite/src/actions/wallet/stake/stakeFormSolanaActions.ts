import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type SelectedAccountRootState } from '@suite/account';
import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { composeSolanaStakingTransaction, prepareSolanaStakeTxData } from '@suite-common/staking';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type BlockchainRootState,
    type WalletSettingsRootState,
    selectAddressDisplayType,
} from '@suite-common/wallet-core';
import {
    AddressDisplayOptions,
    type ComposeActionContext,
    type PrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';
import { isSupportedSolStakingNetworkSymbol } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { getSuiteVersion } from '@trezor/env-utils';
import solana from '@trezor/network-solana/runtime';

const getSolanaUserAgent = () => `Trezor Suite ${getSuiteVersion()}`;

type ComposeTransactionThunkState = BlockchainRootState & SelectedAccountRootState;

export const composeTransaction =
    (formValues: StakeFormState, formState: ComposeActionContext) =>
    async (_: Dispatch<UnknownAction>, getState: () => ComposeTransactionThunkState) => {
        const { selectedAccount, blockchain } = getState().wallet;

        if (selectedAccount.status !== 'loaded') return;

        const { account } = selectedAccount;
        if (account.networkType !== 'solana') return;

        const blockchainUrl = blockchain[account.symbol]?.url;
        if (!blockchainUrl) return;

        return await composeSolanaStakingTransaction({
            formValues,
            composeContext: formState,
            blockchainUrl,
            userAgent: getSolanaUserAgent(),
        });
    };

type SignTransactionThunkDeps = { services: DesktopAnalyticsDep };
type SignTransactionThunkState = BlockchainRootState &
    DeviceRootState &
    SelectedAccountRootState &
    WalletSettingsRootState;

export const signTransaction =
    (formValues: StakeFormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (
        dispatch: Dispatch<UnknownAction>,
        getState: () => SignTransactionThunkState,
        extra: SignTransactionThunkDeps,
    ) => {
        const { selectedAccount, blockchain } = getState().wallet;

        const device = selectSelectedDevice(getState());
        if (selectedAccount.status !== 'loaded' || !device || transactionInfo?.type !== 'final') {
            return;
        }

        const { account } = selectedAccount;
        if (
            account.networkType !== 'solana' ||
            !isSupportedSolStakingNetworkSymbol(account.symbol)
        ) {
            return;
        }

        const blockchainUrl = blockchain[account.symbol]?.url;
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
            userAgent: getSolanaUserAgent(),
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
            extra.services.analytics.report({
                type: events.transactionCancelEvent.name,
                payload: {
                    txType: 'stake',
                    networkSymbol: account.symbol,
                },
            });

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

        const { address } = await solana();

        txData.txShim.addSignature(address(account.descriptor), signedTx.payload.signature);

        return txData.txShim.serialize();
    };
