import { useEffect, useRef, useState } from 'react';

import { openModal } from '@suite/modal';
import { commonQueryKeys, useMutation, useQueryClient } from '@suite-common/react-query';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type EvmPendingTxStatus,
    type LidoTransactionData,
    type LidoTransactionKind,
    type YieldFlowDisplayToken,
    findPendingLidoTransaction,
    selectAccountTransactions,
    useEvmPendingTxStatus,
} from '@suite-common/wallet-core';
import {
    type Account,
    type EvmTransactionPurpose,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { type EvmOperation, getEvmTransactionOperation } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { getLidoDeployment } from '@trezor/network-ethereum-suite-common';
import { injectDispatch } from '@trezor/redux-utils';

import { submitLidoTransactionThunk } from '#src/actions/wallet/lido/submitLidoTransactionThunk';
import { useSelector } from '#src/hooks/suite/useSelector';
import { useDeviceReadyGuardWithToast } from '#src/hooks/wallet/useDeviceReadyGuardWithToast';

// A same-nonce replacement is matched against the followed call itself; the purpose only serves
// until that call is known.
const PURPOSE_BY_KIND: Record<LidoTransactionKind, EvmTransactionPurpose> = {
    stake: 'unknown',
    approve: 'approve',
    'request-withdrawal': 'unknown',
    claim: 'unknown',
};

export type LidoBroadcast = {
    // The hash to follow; it moves to the replacement when the transaction is sped up.
    txid: string;
    // Empty for a transaction found pending on the account, whose amount was entered elsewhere.
    amount: string;
    operation: EvmOperation;
};

type SubmitLidoTransactionParams = {
    transaction: LidoTransactionData;
    amount: string;
    token: YieldFlowDisplayToken;
};

type UseLidoTransactionParams = {
    account: Account;
    kind: LidoTransactionKind;
};

export type LidoTransaction = {
    submit: (params: SubmitLidoTransactionParams) => Promise<void>;
    isSubmitting: boolean;
    // What the flow follows to its end: what this visit has broadcast, or the transaction of this
    // kind it found pending on the account, broadcast before the flow was left and reopened.
    broadcast: LidoBroadcast | null;
    pendingTxid: string | null;
    status: EvmPendingTxStatus | null;
    isConfirmed: boolean;
    resetBroadcast: () => void;
    // The followed transaction as the account knows it; null until the account has it.
    transaction: WalletAccountTransaction | null;
    openTxDetail: (txid: string) => void;
};

/** One Lido transaction of a flow: its submit, the broadcast it led to and its confirmation. */
export const useLidoTransaction = ({
    account,
    kind,
}: UseLidoTransactionParams): LidoTransaction => {
    const { dispatch } = useServices(injectDispatch);
    const queryClient = useQueryClient();
    const ensureDeviceReady = useDeviceReadyGuardWithToast(account.deviceState);
    const [broadcast, setBroadcast] = useState<LidoBroadcast | null>(null);
    const isSubmittingRef = useRef(false);
    const accountKey = account.key;
    const deployment = getLidoDeployment(account.symbol);
    const transactions = useSelector(state => selectAccountTransactions(state, accountKey));

    const pendingTransaction =
        deployment === null
            ? undefined
            : findPendingLidoTransaction({ deployment, transactions, kind });
    const trackedTxid = broadcast?.txid ?? pendingTransaction?.txid ?? null;
    const transaction =
        trackedTxid === null
            ? null
            : (transactions.find(({ txid }) => txid === trackedTxid) ?? null);

    // The pending transaction leaves the account's pending ones the moment it is mined, so it is
    // kept as the broadcast to follow: the flow then ends on its completion instead of offering
    // the same action again.
    useEffect(() => {
        if (pendingTransaction === undefined) {
            return;
        }

        const operation = getEvmTransactionOperation(pendingTransaction);

        if (operation === null) {
            return;
        }

        setBroadcast(
            current => current ?? { txid: pendingTransaction.txid, amount: '', operation },
        );
    }, [pendingTransaction]);

    // A replacement only shares the nonce: it completes the flow when it makes the very call that
    // was submitted, as a sped up transaction does, and fails it when it is a cancellation or a
    // call with another target, calldata or value.
    const { status, replacementTxid } = useEvmPendingTxStatus(
        account,
        trackedTxid,
        PURPOSE_BY_KIND[kind],
        undefined,
        broadcast?.operation,
    );
    const pendingTxid = status === 'pending' ? trackedTxid : null;

    useEffect(() => {
        if (replacementTxid === undefined) {
            return;
        }

        setBroadcast(current =>
            current === null ? current : { ...current, txid: replacementTxid },
        );
    }, [replacementTxid]);

    // What a mined transaction changed is read from the contracts, so those reads start over.
    useEffect(() => {
        if (pendingTxid === null) {
            return undefined;
        }

        return () => {
            void queryClient.invalidateQueries({
                queryKey: commonQueryKeys.lidoWithdrawalRequests(accountKey),
            });
            void queryClient.invalidateQueries({
                queryKey: commonQueryKeys.lidoWithdrawalAllowance(accountKey),
            });
        };
    }, [pendingTxid, accountKey, queryClient]);

    useEffect(() => {
        if (status !== 'failed') {
            return;
        }

        dispatch(
            notificationsActions.addToast({
                type: 'sign-tx-error',
                error: 'The Lido transaction failed.',
            }),
        );
        setBroadcast(null);
    }, [status, dispatch]);

    const mutation = useMutation({
        // A paid action runs once: a failure is reported, never tried again on its own.
        retry: false,
        mutationFn: async (params: SubmitLidoTransactionParams) => {
            // Part of the mutation, so the flow reads as submitting while the device gets ready.
            if (!(await ensureDeviceReady())) {
                return undefined;
            }

            return dispatch(submitLidoTransactionThunk({ account, kind, ...params })).unwrap();
        },
        onSuccess: (result, { amount, transaction: operation }) => {
            if (result) {
                setBroadcast({ txid: result.txid, amount, operation });
            }
        },
        onError: error => {
            dispatch(
                notificationsActions.addToast({ type: 'sign-tx-error', error: error.message }),
            );
        },
    });

    const submit = async (params: SubmitLidoTransactionParams) => {
        // The state of the mutation reaches the button a render after the click, and a second
        // submit must not open a second review in between.
        if (isSubmittingRef.current) {
            return;
        }

        isSubmittingRef.current = true;
        // The failure is reported by the mutation.
        await mutation.mutateAsync(params).catch(() => undefined);
        isSubmittingRef.current = false;
    };

    const openTxDetail = (txid: string) => {
        dispatch(
            openModal({
                type: 'transaction-detail',
                txid,
                descriptor: account.descriptor,
                symbol: account.symbol,
                deviceState: account.deviceState,
                flow: 'detail',
                showCancelButton: true,
            }),
        );
    };

    return {
        submit,
        isSubmitting: mutation.isPending,
        broadcast,
        pendingTxid,
        status,
        isConfirmed: broadcast !== null && status === 'confirmed',
        resetBroadcast: () => setBroadcast(null),
        transaction,
        openTxDetail,
    };
};
