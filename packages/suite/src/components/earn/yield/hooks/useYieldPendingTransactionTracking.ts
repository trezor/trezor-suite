import { useEffect, useRef } from 'react';

import { type AnalyticsDesktopEvents, selectDesktopAnalyticsDep } from '@suite/analytics';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { useDispatch } from '@suite-common/redux-utils';
import {
    type YieldFlowType,
    type YieldPendingTransactionState,
    type YieldWithdrawFlowType,
    isYieldWithdrawFlow,
    selectYieldSession,
    useYieldPendingTxStatus,
    yieldActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getApyBreakdown } from '@suite-common/wallet-utils';
import { type Analytics } from '@trezor/analytics-uploader';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { useCurrentRef } from '@trezor/react-utils';

import { useSelector } from 'src/hooks/suite';

type ResolutionEventType =
    | {
          type: 'deposit';
          successType: 'approve-success' | 'revoke-success' | 'wrap-success' | 'success';
      }
    | {
          type: 'withdraw';
          operation: YieldWithdrawFlowType;
          successType: 'unwrap-success' | 'success';
      }
    | { type: 'claim'; successType: 'success' };

const getResolutionEventType = (
    pendingTxType: YieldPendingTransactionState['type'],
    flowType: YieldFlowType,
): ResolutionEventType | null => {
    switch (pendingTxType) {
        case 'approve':
            return { type: 'deposit', successType: 'approve-success' };
        case 'revoke':
            return { type: 'deposit', successType: 'revoke-success' };
        case 'deposit':
            return { type: 'deposit', successType: 'success' };
        case 'withdraw':
            return { type: 'withdraw', operation: 'withdraw', successType: 'success' };
        case 'redeem':
            return { type: 'withdraw', operation: 'redeem', successType: 'success' };
        case 'claim':
            return flowType === 'claim' ? { type: 'claim', successType: 'success' } : null;
        case 'wrap':
            return flowType === 'deposit' ? { type: 'deposit', successType: 'wrap-success' } : null;
        case 'unwrap':
            return isYieldWithdrawFlow(flowType)
                ? { type: 'withdraw', operation: flowType, successType: 'unwrap-success' }
                : null;
        default:
            return null;
    }
};

type ReportContext = {
    networkSymbol: string;
    vault?: YieldDtoV2 | null;
    durationMs?: number;
    wrappedNative?: boolean;
};

// The stored submittedAt survives leaving and reopening the page, unlike the mount-scoped ref
// fallback, which restarts the measurement on every remount.
const getPendingDurationMs = (
    pendingTransaction: YieldPendingTransactionState,
    pendingStart: { txid: string; startedAt: number } | null,
) => {
    if (pendingTransaction.submittedAt) {
        return Date.now() - pendingTransaction.submittedAt;
    }

    if (pendingStart) {
        return Date.now() - pendingStart.startedAt;
    }

    return undefined;
};

const resolveReportedType = <T extends string>(
    outcome: 'success' | 'error' | 'leftPending',
    successType: T,
): T | 'error' | 'leftPending' => {
    if (outcome === 'error') return 'error';
    if (outcome === 'leftPending') return 'leftPending';

    return successType;
};

const reportResolution = (
    analytics: Analytics<AnalyticsDesktopEvents>,
    resolution: ResolutionEventType,
    outcome: 'success' | 'error' | 'leftPending',
    context: ReportContext,
) => {
    const errorMessage = outcome === 'error' ? { errorMessage: 'on-chain-failure' } : {};

    if (resolution.type === 'deposit') {
        // Only the deposit-success path (not approve-success / revoke-success / error / leftPending) carries APY context.
        const isDepositSuccess = outcome === 'success' && resolution.successType === 'success';
        const apyBreakdown = isDepositSuccess
            ? getApyBreakdown(context.vault?.rewardRate?.components)
            : '';

        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                action: 'continue',
                type: resolveReportedType(outcome, resolution.successType),
                networkSymbol: context.networkSymbol,
                vaultId: context.vault?.id,
                durationMs: context.durationMs,
                ...(isDepositSuccess ? { wrappedNative: context.wrappedNative } : {}),
                ...(apyBreakdown && { apyBreakdown }),
                ...errorMessage,
            },
        });

        return;
    }

    if (resolution.type === 'withdraw') {
        const isWithdrawSuccess = outcome === 'success' && resolution.successType === 'success';
        const apyBreakdown = isWithdrawSuccess
            ? getApyBreakdown(context.vault?.rewardRate?.components)
            : '';

        analytics.report({
            type: events.yieldWithdrawEvent.name,
            payload: {
                action: 'continue',
                type: resolveReportedType(outcome, resolution.successType),
                operation: resolution.operation,
                networkSymbol: context.networkSymbol,
                vaultId: context.vault?.id,
                durationMs: context.durationMs,
                ...(outcome === 'success' ? { wrappedNative: context.wrappedNative } : {}),
                ...(apyBreakdown && { apyBreakdown }),
                ...errorMessage,
            },
        });

        return;
    }

    analytics.report({
        type: events.yieldClaimEvent.name,
        payload: {
            action: 'continue',
            type: resolveReportedType(outcome, resolution.successType),
            networkSymbol: context.networkSymbol,
            durationMs: context.durationMs,
            ...errorMessage,
        },
    });
};

type UseYieldPendingTransactionTrackingProps = {
    account: Account;
    flowType: YieldFlowType;
    flowKey: string;
    waitForMerklToResolveClaim?: () => Promise<unknown>;
    vault?: YieldDtoV2 | null;
};

const stablePlaceholderPromise = () => Promise.resolve();

export const useYieldPendingTransactionTracking = ({
    account,
    flowType,
    flowKey,
    waitForMerklToResolveClaim = stablePlaceholderPromise,
    vault,
}: UseYieldPendingTransactionTrackingProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const pendingTransaction = useSelector(
        state => selectYieldSession(state, flowType, flowKey).action.pendingTransaction,
    );
    const pendingTxStatus = useYieldPendingTxStatus({
        account,
        flowType,
        flowKey,
        pendingTransaction,
    });

    const isCurrentlyPending = pendingTxStatus === 'pending';

    // Fallback start time per pending txid for pending transactions stored without submittedAt.
    const pendingStartRef = useRef<{ txid: string; startedAt: number } | null>(null);
    const pendingTxid = pendingTransaction?.txid;

    useEffect(() => {
        if (pendingTxid && pendingStartRef.current?.txid !== pendingTxid) {
            pendingStartRef.current = { txid: pendingTxid, startedAt: Date.now() };
        }
    }, [pendingTxid]);

    // Snapshot latest values for the unmount-leftPending effect so we don't re-bind on every render.
    const latestRef = useCurrentRef({
        isCurrentlyPending,
        pendingTransaction,
        flowType,
        vault,
        networkSymbol: account.symbol,
    });

    useEffect(() => {
        if (!pendingTransaction || pendingTxStatus === null || pendingTxStatus === 'pending') {
            return;
        }

        const resolution = getResolutionEventType(pendingTransaction.type, flowType);
        const durationMs = getPendingDurationMs(pendingTransaction, pendingStartRef.current);
        const context: ReportContext = {
            networkSymbol: account.symbol,
            vault,
            durationMs,
            wrappedNative: isWrappedNativeToken(account.symbol, vault?.token.address),
        };

        if (pendingTxStatus === 'failed') {
            if (resolution) {
                reportResolution(analytics, resolution, 'error', context);
            }

            pendingStartRef.current = null;
            dispatch(yieldActions.transactionFailed({ flowType, flowKey }));

            return;
        }

        if (resolution) {
            reportResolution(analytics, resolution, 'success', context);
            pendingStartRef.current = null;
        }

        if (pendingTransaction.type === 'revoke') {
            dispatch(yieldActions.revokeSuccess({ flowType, flowKey }));
            dispatch(yieldActions.invalidateAllowance({ flowType, flowKey }));

            return;
        }

        if (pendingTransaction.type === 'approve') {
            dispatch(
                yieldActions.completeApproval({
                    flowType,
                    flowKey,
                    amount: pendingTransaction.amount,
                }),
            );
            dispatch(yieldActions.invalidateAllowance({ flowType, flowKey }));

            return;
        }

        if (pendingTransaction.type === 'wrap' || pendingTransaction.type === 'unwrap') {
            dispatch(
                yieldActions.resolveWrappedNativeStep({
                    flowType,
                    flowKey,
                    step: pendingTransaction.type,
                    amount: pendingTransaction.amount,
                }),
            );

            return;
        }

        if (pendingTransaction.type === flowType) {
            const completeAction = () => {
                dispatch(
                    yieldActions.completeAction({
                        flowType,
                        flowKey,
                        amount: pendingTransaction.amount,
                    }),
                );
            };

            if (flowType !== 'claim') {
                completeAction();

                return;
            }

            analytics.report({
                type: events.yieldClaimEvent.name,
                payload: {
                    action: 'continue',
                    type: 'success',
                    networkSymbol: account.symbol,
                },
            });

            waitForMerklToResolveClaim().then(completeAction);

            return;
        }

        dispatch(yieldActions.resetSession({ flowType, flowKey }));
    }, [
        flowKey,
        flowType,
        pendingTransaction,
        pendingTxStatus,
        dispatch,
        analytics,
        account.symbol,
        vault,
        waitForMerklToResolveClaim,
    ]);

    // Emit `leftPending` if the component unmounts while a tx is still unresolved.
    useEffect(
        () => () => {
            const snapshot = latestRef.current;
            if (!snapshot.isCurrentlyPending || !snapshot.pendingTransaction) return;

            const resolution = getResolutionEventType(
                snapshot.pendingTransaction.type,
                snapshot.flowType,
            );
            if (!resolution) return;

            const durationMs = getPendingDurationMs(
                snapshot.pendingTransaction,
                pendingStartRef.current,
            );

            reportResolution(analytics, resolution, 'leftPending', {
                networkSymbol: snapshot.networkSymbol,
                vault: snapshot.vault,
                durationMs,
            });
        },
        [analytics, latestRef],
    );
};
