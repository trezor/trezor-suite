import { useEffect, useRef } from 'react';

import { type AnalyticsDesktopEvents, events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import {
    type YieldFlowType,
    type YieldPendingTransactionState,
    fetchAndUpdateAccountThunk,
    selectConvertedNetworkFeeInfo,
    selectStablecoinYieldSession,
    selectTransactionByAccountKeyAndTxid,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';
import { type Analytics } from '@trezor/analytics-uploader';
import { useCurrentRef } from '@trezor/react-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { getApyBreakdown } from '../yieldFlowUtils';

const DEFAULT_PENDING_TX_POLL_INTERVAL_MS = 3_000;
const MIN_PENDING_TX_POLL_INTERVAL_MS = 2_000;
const BLOCK_TIME_TO_POLL_INTERVAL_RATIO = 2;

const getPollIntervalMs = (blockTime: number | undefined): number => {
    if (!blockTime) return DEFAULT_PENDING_TX_POLL_INTERVAL_MS;

    return Math.max(
        (blockTime / BLOCK_TIME_TO_POLL_INTERVAL_RATIO) * 1000,
        MIN_PENDING_TX_POLL_INTERVAL_MS,
    );
};

type ResolutionEventType =
    | { type: 'deposit'; successType: 'approve-success' | 'revoke-success' | 'success' }
    | { type: 'withdraw'; successType: 'success' }
    | { type: 'claim'; successType: 'success' };

const getResolutionEventType = (
    pendingTxType: YieldPendingTransactionState['type'],
    flowType: YieldFlowType,
): ResolutionEventType | null => {
    switch (pendingTxType) {
        case 'approve':
            return { type: 'deposit', successType: 'approve-success' };
        case 'revoke':
        case 'revoke-only':
            return { type: 'deposit', successType: 'revoke-success' };
        case 'deposit':
            return { type: 'deposit', successType: 'success' };
        case 'withdraw':
            return { type: 'withdraw', successType: 'success' };
        case 'claim':
            return flowType === 'claim' ? { type: 'claim', successType: 'success' } : null;
        default:
            return null;
    }
};

type ReportContext = {
    networkSymbol: string;
    vault?: YieldDto | null;
    durationMs?: number;
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
                ...(apyBreakdown && { apyBreakdown }),
                ...errorMessage,
            },
        });

        return;
    }

    if (resolution.type === 'withdraw') {
        const apyBreakdown =
            outcome === 'success' ? getApyBreakdown(context.vault?.rewardRate?.components) : '';

        analytics.report({
            type: events.yieldWithdrawEvent.name,
            payload: {
                action: 'continue',
                type: resolveReportedType(outcome, resolution.successType),
                networkSymbol: context.networkSymbol,
                vaultId: context.vault?.id,
                durationMs: context.durationMs,
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
    waitForMerkleToResolveClaim?: () => Promise<unknown>;
    vault?: YieldDto | null;
};

const stablePlaceholderPromise = () => Promise.resolve();

export const useYieldPendingTransactionTracking = ({
    account,
    flowType,
    flowKey,
    waitForMerkleToResolveClaim = stablePlaceholderPromise,
    vault,
}: UseYieldPendingTransactionTrackingProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const pendingTransaction = useSelector(
        state => selectStablecoinYieldSession(state, flowType, flowKey).action.pendingTransaction,
    );
    const trackedPendingTransaction = useSelector(state =>
        pendingTransaction
            ? selectTransactionByAccountKeyAndTxid(state, account.key, pendingTransaction.txid)
            : null,
    );
    const feeInfo = useSelector(state => selectConvertedNetworkFeeInfo(state, account.symbol));
    const pollIntervalMs = getPollIntervalMs(feeInfo?.blockTime);

    const isCurrentlyPending =
        !!pendingTransaction &&
        (!trackedPendingTransaction || isPending(trackedPendingTransaction));

    // Track start time per pending txid so we can compute durationMs on resolution.
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
        if (!isCurrentlyPending) {
            return;
        }

        const interval = setInterval(() => {
            dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
        }, pollIntervalMs);

        return () => clearInterval(interval);
    }, [account, dispatch, isCurrentlyPending, pollIntervalMs]);

    useEffect(() => {
        if (!pendingTransaction || !trackedPendingTransaction) {
            return;
        }

        if (isPending(trackedPendingTransaction)) {
            return;
        }

        const resolution = getResolutionEventType(pendingTransaction.type, flowType);
        const durationMs = pendingStartRef.current
            ? Date.now() - pendingStartRef.current.startedAt
            : undefined;
        const context: ReportContext = {
            networkSymbol: account.symbol,
            vault,
            durationMs,
        };

        if (trackedPendingTransaction.type === 'failed') {
            if (resolution) {
                reportResolution(analytics, resolution, 'error', context);
            }

            pendingStartRef.current = null;
            dispatch(stablecoinYieldActions.transactionFailed({ flowType, flowKey }));

            return;
        }

        if (resolution) {
            reportResolution(analytics, resolution, 'success', context);
            pendingStartRef.current = null;
        }

        if (pendingTransaction.type === 'revoke' || pendingTransaction.type === 'revoke-only') {
            dispatch(stablecoinYieldActions.revokeSuccess({ flowType, flowKey }));
            dispatch(stablecoinYieldActions.invalidateAllowance({ flowType, flowKey }));

            return;
        }

        if (pendingTransaction.type === 'approve') {
            dispatch(
                stablecoinYieldActions.completeApproval({
                    flowType,
                    flowKey,
                    amount: pendingTransaction.amount,
                }),
            );
            dispatch(stablecoinYieldActions.invalidateAllowance({ flowType, flowKey }));

            return;
        }

        if (pendingTransaction.type === flowType) {
            const completeAction = () => {
                dispatch(
                    stablecoinYieldActions.completeAction({
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

            waitForMerkleToResolveClaim().then(completeAction);

            return;
        }

        dispatch(stablecoinYieldActions.resetSession({ flowType, flowKey }));
    }, [
        flowKey,
        flowType,
        pendingTransaction,
        dispatch,
        trackedPendingTransaction,
        analytics,
        account.symbol,
        vault,
        waitForMerkleToResolveClaim,
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

            const durationMs = pendingStartRef.current
                ? Date.now() - pendingStartRef.current.startedAt
                : undefined;

            reportResolution(analytics, resolution, 'leftPending', {
                networkSymbol: snapshot.networkSymbol,
                vault: snapshot.vault,
                durationMs,
            });
        },
        [analytics, latestRef],
    );
};
