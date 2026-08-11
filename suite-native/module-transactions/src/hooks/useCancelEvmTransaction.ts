import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import { useMutation } from '@suite-common/react-query';
import {
    type AccountsRootState,
    type TransactionsRootState,
    composeEthereumCancelTransactionThunk,
    selectAccountByKey,
    selectIsTransactionPending,
    useEvmNonceInfo,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type WalletAccountTransaction,
    type WalletAccountTransactionWithRequiredRbfParams,
} from '@suite-common/wallet-types';
import {
    getNetworkAccountFeatures,
    getPendingEvmNonceStatus,
    isSignedByAccount,
    isTransactionCancellable,
} from '@suite-common/wallet-utils';
import { useTranslate } from '@suite-native/intl';
import {
    type NavigateParameters,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    type TransactionDetailStackParamList,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import {
    type SignAndPushEvmCancelTransactionError,
    signAndPushEvmCancelTransactionThunk,
} from '@suite-native/send';
import { useToast } from '@suite-native/toasts';

import { useDeviceGuardedSign } from './useDeviceGuardedSign';

type NavigationProp = StackToStackCompositeNavigationProps<
    TransactionDetailStackParamList,
    TransactionDetailStackRoutes.TransactionDetail,
    RootStackParamList
>;

const hasEthereumRbfParams = (
    tx: WalletAccountTransaction,
): tx is WalletAccountTransactionWithRequiredRbfParams => tx.rbfParams?.type === 'ethereum';

// Extracts a human-readable failure reason: push failures carry the node's message in `metadata`
// (e.g. "nonce too low", "could not replace existing tx"), while signing failures/timeouts expose
// it directly on `message`.
const getCancelFailureReason = (
    error: SignAndPushEvmCancelTransactionError,
): string | undefined => {
    if (!error) return undefined;

    if ('metadata' in error) return error.metadata.error?.message;

    return error.message;
};

type UseCancelEvmTransactionParams = {
    accountKey: AccountKey;
    transaction: WalletAccountTransaction;
    // Closes the caller's bottom sheet. Called on both success and failure — the outcome is then
    // surfaced via a toast, so there is nothing left to keep the sheet open for.
    onClose?: () => void;
};

/**
 * Cancels a pending EVM transaction by composing, signing and broadcasting a 0-value self-transfer
 * that reuses the original tx's nonce with a bumped fee. Mirrors the desktop flow
 * (useEthereumCancelTxCompose + CancelTransactionModal) with the native device-connection guard.
 */
export const useCancelEvmTransaction = ({
    accountKey,
    transaction,
    onClose,
}: UseCancelEvmTransactionParams) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const { translate } = useTranslate();
    const { showToast } = useToast();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const isPendingTx = useSelector((state: TransactionsRootState & AccountsRootState) =>
        selectIsTransactionPending(state, accountKey, transaction.txid),
    );
    const ethereumAccount = account?.networkType === 'ethereum' ? account : undefined;
    const isEvmTxWithRbfParams = hasEthereumRbfParams(transaction);
    const networkFeatures = ethereumAccount
        ? getNetworkAccountFeatures(ethereumAccount)
        : undefined;

    // Same gate the desktop TxDetailModal uses, checked before the nonce fetch below so the
    // backend round trip is skipped when the tx isn't cancellable anyway.
    const isLocallyCancellable =
        isEvmTxWithRbfParams && isTransactionCancellable(transaction, isPendingTx, networkFeatures);

    // A pending EVM tx whose own nonce is gapped or already superseded can't be cancelled — the
    // replacement would re-send at a nonce that either can't confirm yet or already confirmed
    // elsewhere. A foreign-signed tx carries the signer's nonce, not the account's, so it is
    // exempt. Same check the desktop TxDetailModal uses.
    const { nonceInfo } = useEvmNonceInfo(ethereumAccount, { enabled: isLocallyCancellable });
    const pendingTxNonce = isSignedByAccount(transaction)
        ? transaction.ethereumSpecific?.nonce
        : undefined;
    const isNonceStuck =
        nonceInfo !== undefined &&
        pendingTxNonce !== undefined &&
        getPendingEvmNonceStatus(pendingTxNonce, nonceInfo) !== 'ok';

    const isCancellable = isLocallyCancellable && !isNonceStuck;

    const {
        mutate: composeCancelTx,
        data: composedData,
        error: composeMutationError,
        isPending: isComposing,
    } = useMutation({
        mutationFn: async () => {
            if (!ethereumAccount || !hasEthereumRbfParams(transaction)) {
                throw new Error('Not a cancellable EVM transaction');
            }

            const result = await dispatch(
                composeEthereumCancelTransactionThunk({
                    account: ethereumAccount,
                    tx: transaction,
                }),
            );
            if (isRejected(result)) {
                throw new Error(
                    result.payload?.message ?? result.payload?.error ?? 'Unknown error',
                );
            }

            return result.payload;
        },
        // Compose failures are mostly deterministic — surface the error to the sheet instead of
        // the provider's default retries.
        retry: false,
    });

    const signAndPush = useCallback(async () => {
        if (!composedData) return;

        const response = await dispatch(
            signAndPushEvmCancelTransactionThunk({
                accountKey,
                composedCancelTx: composedData.composedCancelTx,
                cancelFormState: composedData.cancelFormState,
            }),
        );

        // Close the bottom sheet regardless of the outcome — success and failure are both surfaced
        // via a toast, so there is nothing left to keep the sheet open for.
        onClose?.();

        if (isFulfilled(response)) {
            showToast({
                intent: 'neutral',
                icon: 'check',
                message: translate('transactions.detail.cancelTransaction.successToast'),
            });
            // The original tx is evicted from the store right after the push, so this detail
            // screen has nothing to show anymore.
            navigation.goBack();

            return;
        }

        const reason = getCancelFailureReason(response.payload);
        showToast({
            intent: 'critical',
            message: reason
                ? translate('transactions.detail.cancelTransaction.errorToast', { error: reason })
                : translate('transactions.detail.cancelTransaction.errorToastGeneric'),
        });
    }, [accountKey, composedData, dispatch, navigation, onClose, showToast, translate]);

    // The device-connection guard returns the user to this detail screen if they abort connecting.
    const cancelNavigationTarget = useMemo(
        (): NavigateParameters<RootStackParamList> => ({
            name: RootStackRoutes.TransactionDetailStack,
            params: {
                screen: TransactionDetailStackRoutes.TransactionDetail,
                params: { accountKey, txid: transaction.txid },
            },
        }),
        [accountKey, transaction.txid],
    );

    const { isSigning, isWaitingForDevice, requestSign } = useDeviceGuardedSign({
        sign: signAndPush,
        cancelNavigationTarget,
    });

    return {
        isCancellable,
        composeCancelTx,
        composedCancelTx: composedData?.composedCancelTx ?? null,
        composeError: composeMutationError !== null,
        isComposing,
        confirmCancellation: requestSign,
        isSigning,
        isWaitingForDevice,
    };
};
