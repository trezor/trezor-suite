import { useEffect, useRef } from 'react';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { useDispatch } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type YieldFlowType,
    type YieldPendingTransactionState,
    type YieldWithdrawFlowType,
    useYieldPendingTxStatus,
    yieldActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getApyBreakdown } from '@suite-common/wallet-utils';
import { type NativeAnalyticsDep, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { exhaustive } from '@trezor/type-utils';

type UseYieldPendingTransactionTrackingParams = {
    account: Account | null;
    flowKey: string | null;
    flowType: YieldFlowType;
    isScreenFocused?: boolean;
    onApprovalConfirmed?: () => void;
    onRevokeConfirmed?: () => void;
    pendingTransaction: YieldPendingTransactionState | undefined;
    vault?: YieldDtoV2 | null;
    waitForMerklToResolveClaim?: () => Promise<unknown>;
};

type YieldResolutionOutcome = 'success' | 'error' | 'leftPending';

type ReportYieldTransactionResolutionParams = {
    analytics: NativeAnalyticsDep['analytics'];
    networkSymbol: NetworkSymbol;
    outcome: YieldResolutionOutcome;
    pendingTransactionType: YieldPendingTransactionState['type'];
    submittedAt: number | undefined;
    vault: YieldDtoV2 | null | undefined;
    withdrawOperation?: YieldWithdrawFlowType;
};

const getWithdrawOperation = (flowType: YieldFlowType): YieldWithdrawFlowType | undefined =>
    flowType === 'withdraw' || flowType === 'redeem' ? flowType : undefined;

const reportYieldTransactionResolution = ({
    analytics,
    networkSymbol,
    outcome,
    pendingTransactionType,
    submittedAt,
    vault,
    withdrawOperation,
}: ReportYieldTransactionResolutionParams) => {
    const durationMs = submittedAt ? Date.now() - submittedAt : undefined;
    const errorMessage = outcome === 'error' ? { errorMessage: 'on-chain-failure' } : {};
    const wrappedNative = isWrappedNativeToken(networkSymbol, vault?.token.address);

    switch (pendingTransactionType) {
        case 'approve':
        case 'revoke':
        case 'deposit':
        case 'wrap': {
            const successType = {
                approve: 'approve-success',
                revoke: 'revoke-success',
                deposit: 'success',
                wrap: 'wrap-success',
            } as const;

            const isDepositSuccess = pendingTransactionType === 'deposit' && outcome === 'success';
            const apyBreakdown = isDepositSuccess
                ? getApyBreakdown(vault?.rewardRate?.components)
                : '';

            analytics.report({
                type: events.yieldDepositEvent.name,
                payload: {
                    action: 'continue',
                    type: outcome === 'success' ? successType[pendingTransactionType] : outcome,
                    networkSymbol,
                    vaultId: vault?.id,
                    durationMs,
                    ...(apyBreakdown && { apyBreakdown }),
                    ...(isDepositSuccess && { wrappedNative }),
                    ...errorMessage,
                },
            });

            return;
        }
        case 'withdraw':
        case 'redeem': {
            const apyBreakdown =
                outcome === 'success' ? getApyBreakdown(vault?.rewardRate?.components) : '';

            analytics.report({
                type: events.yieldWithdrawEvent.name,
                payload: {
                    action: 'continue',
                    type: outcome,
                    operation: pendingTransactionType,
                    networkSymbol,
                    vaultId: vault?.id,
                    durationMs,
                    ...(apyBreakdown && { apyBreakdown }),
                    ...(outcome === 'success' && { wrappedNative }),
                    ...errorMessage,
                },
            });

            return;
        }
        case 'claim': {
            analytics.report({
                type: events.yieldClaimEvent.name,
                payload: {
                    action: 'continue',
                    type: outcome,
                    networkSymbol,
                    durationMs,
                    ...errorMessage,
                },
            });

            return;
        }
        case 'unwrap': {
            analytics.report({
                type: events.yieldWithdrawEvent.name,
                payload: {
                    action: 'continue',
                    type: outcome === 'success' ? 'unwrap-success' : outcome,
                    operation: withdrawOperation,
                    networkSymbol,
                    vaultId: vault?.id,
                    durationMs,
                    ...errorMessage,
                },
            });

            return;
        }
        default:
            exhaustive(pendingTransactionType);
    }
};

export const useYieldPendingTransactionTracking = ({
    account,
    flowKey,
    onApprovalConfirmed,
    onRevokeConfirmed,
    flowType,
    isScreenFocused,
    pendingTransaction,
    vault,
    waitForMerklToResolveClaim,
}: UseYieldPendingTransactionTrackingParams) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const pendingTxidRef = useRef(pendingTransaction?.txid);
    const claimCompletionTxidRef = useRef<string | null>(null);
    const accountSymbol = account?.symbol;

    const pendingTxStatus = useYieldPendingTxStatus({
        account,
        flowType,
        flowKey,
        pendingTransaction,
    });

    const isPendingTransactionUnresolved = pendingTxStatus === 'pending';

    // Snapshot of the still-unresolved transaction so the unmount cleanup can emit `leftPending`.
    const leftPendingSnapshotRef = useRef<Omit<
        ReportYieldTransactionResolutionParams,
        'analytics' | 'outcome'
    > | null>(null);
    leftPendingSnapshotRef.current =
        pendingTransaction && accountSymbol && isPendingTransactionUnresolved
            ? {
                  networkSymbol: accountSymbol,
                  pendingTransactionType: pendingTransaction.type,
                  submittedAt: pendingTransaction.submittedAt,
                  vault,
                  withdrawOperation: getWithdrawOperation(flowType),
              }
            : null;

    useEffect(
        () => () => {
            if (!leftPendingSnapshotRef.current) {
                return;
            }

            reportYieldTransactionResolution({
                ...leftPendingSnapshotRef.current,
                analytics,
                outcome: 'leftPending',
            });
        },
        [analytics],
    );

    useEffect(() => {
        pendingTxidRef.current = pendingTransaction?.txid;

        if (claimCompletionTxidRef.current !== pendingTransaction?.txid) {
            claimCompletionTxidRef.current = null;
        }
    }, [pendingTransaction?.txid]);

    useEffect(() => {
        if (!flowKey || !pendingTransaction || pendingTxStatus === null) {
            return;
        }

        const sessionParams = { flowType, flowKey };
        const reportResolution = (outcome: Exclude<YieldResolutionOutcome, 'leftPending'>) => {
            if (!accountSymbol) {
                return;
            }

            reportYieldTransactionResolution({
                analytics,
                networkSymbol: accountSymbol,
                outcome,
                pendingTransactionType: pendingTransaction.type,
                submittedAt: pendingTransaction.submittedAt,
                vault,
                withdrawOperation: getWithdrawOperation(flowType),
            });
        };

        if (pendingTxStatus === 'pending') {
            return;
        }

        if (pendingTxStatus === 'failed') {
            reportResolution('error');
            dispatch(yieldActions.transactionFailed(sessionParams));

            return;
        }

        if (pendingTransaction.type === 'wrap' || pendingTransaction.type === 'unwrap') {
            reportResolution('success');
            dispatch(
                yieldActions.resolveWrappedNativeStep({
                    ...sessionParams,
                    step: pendingTransaction.type,
                    amount: pendingTransaction.amount,
                }),
            );

            return;
        }

        if (pendingTransaction.type === 'revoke') {
            reportResolution('success');
            dispatch(yieldActions.revokeSuccess(sessionParams));
            dispatch(yieldActions.invalidateAllowance(sessionParams));

            if (isScreenFocused && onRevokeConfirmed) {
                onRevokeConfirmed();
            }

            return;
        }

        if (pendingTransaction.type === 'claim' && flowType === 'claim') {
            if (claimCompletionTxidRef.current === pendingTransaction.txid) {
                return;
            }

            claimCompletionTxidRef.current = pendingTransaction.txid;
            reportResolution('success');

            const completeClaimAction = async () => {
                try {
                    await waitForMerklToResolveClaim?.();
                } catch {
                    // Merkl can lag after on-chain success; the claim transaction is already confirmed.
                } finally {
                    if (pendingTxidRef.current === pendingTransaction.txid) {
                        dispatch(
                            yieldActions.completeAction({
                                ...sessionParams,
                                amount: pendingTransaction.amount,
                            }),
                        );
                    }
                }
            };

            void completeClaimAction();

            return;
        }

        if (pendingTransaction.type !== 'approve') {
            reportResolution('success');
            dispatch(
                yieldActions.completeAction({
                    ...sessionParams,
                    amount: pendingTransaction.amount,
                }),
            );

            if (pendingTransaction.type === 'deposit') {
                dispatch(yieldActions.invalidateAllowance(sessionParams));
            }

            return;
        }

        reportResolution('success');
        dispatch(
            yieldActions.completeApproval({
                ...sessionParams,
                amount: pendingTransaction.amount,
            }),
        );
        dispatch(yieldActions.invalidateAllowance(sessionParams));

        if (isScreenFocused && onApprovalConfirmed) {
            onApprovalConfirmed();
        }
    }, [
        accountSymbol,
        analytics,
        dispatch,
        flowKey,
        flowType,
        isScreenFocused,
        onApprovalConfirmed,
        onRevokeConfirmed,
        pendingTransaction,
        pendingTxStatus,
        vault,
        waitForMerklToResolveClaim,
    ]);
};
