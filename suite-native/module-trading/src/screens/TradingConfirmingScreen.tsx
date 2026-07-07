import { useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';
import type { ExchangeTrade } from 'invity-api';

import {
    selectTradingExchangeSelectedQuote,
    tradingExchangeActions,
    useAllowanceTxTracking,
} from '@suite-common/trading';
import { sendFormActions } from '@suite-common/wallet-core';
import {
    getEvmTransactionTextSignature,
    isEvmApprovalTxByTextSignature,
} from '@suite-common/wallet-utils';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useExchangeAnalyticsStepReport } from '@suite-native/trading-analytics';
import { useTransactionStatusOverride } from '@suite-native/trading-debug';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';
import {
    useNavigationRemoveInterceptorAlert,
    useTransactionDetails,
} from '@suite-native/transaction-management';
import { exhaustive } from '@trezor/type-utils';
import { resolveAfter } from '@trezor/utils';

import { ConfirmationQuoteDebugView } from '../components/exchange/Confirmation/ConfirmationQuoteDebugView';
import { ExchangeConfirmationHeader } from '../components/exchange/Confirmation/ExchangeConfirmationHeader';
import { ExchangeConfirmationInfo } from '../components/exchange/Confirmation/ExchangeConfirmationInfo';
import { ExchangeConfirmationTitle } from '../components/exchange/Confirmation/ExchangeConfirmationTitle';
import { ExploreInBlockchainButton } from '../components/exchange/Confirmation/ExploreInBlockchainButton';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';
import { useApprovalFlow } from '../hooks/exchange/Approval/useApprovalFlow';

export type TradingConfirmingScreenProps = StackProps<
    RootStackParamList,
    RootStackRoutes.TradingConfirming
>;

export const APPROVAL_STATUS_POLL_INTERVAL_MS = 5000;
// Give up after ~5 minutes of polling; the user can leave or refocus to retry.
export const APPROVAL_STATUS_POLL_MAX_ATTEMPTS = 60;

// Until the API indexes the confirmed approval it keeps returning
// APPROVAL_PENDING — or CONFIRM still carrying the approval dexTx.
const isStaleApprovalQuote = (quote: ExchangeTrade) =>
    !quote.error &&
    (quote.status === 'APPROVAL_PENDING' ||
        (quote.status === 'CONFIRM' &&
            isEvmApprovalTxByTextSignature(getEvmTransactionTextSignature(quote.dexTx?.data))));

// Until the API indexes the confirmed revoke it still sees the old allowance
// and keeps returning the revoke dexTx instead of the follow-up approval.
const isStaleRevokeQuote = (quote: ExchangeTrade) =>
    !quote.error && getEvmTransactionTextSignature(quote.dexTx?.data) === 'revoke';

type PollConfirmApprovalProps = {
    initialQuote: ExchangeTrade;
    confirmApproval: (quote: ExchangeTrade) => Promise<ExchangeTrade | undefined>;
    isStale: (quote: ExchangeTrade) => boolean;
    signal: AbortSignal;
};

// Re-requests the trade until the API acknowledges the confirmed on-chain state.
// Resolves with the settled quote, or undefined when the flow should stay on the
// confirming screen (request failed, polling aborted, or attempts exhausted).
const pollConfirmApproval = async ({
    initialQuote,
    confirmApproval,
    isStale,
    signal,
}: PollConfirmApprovalProps): Promise<ExchangeTrade | undefined> => {
    let response = await confirmApproval(initialQuote);

    for (
        let attempt = 0;
        response && isStale(response) && attempt < APPROVAL_STATUS_POLL_MAX_ATTEMPTS;
        attempt += 1
    ) {
        try {
            await resolveAfter(APPROVAL_STATUS_POLL_INTERVAL_MS, signal);
        } catch {
            // Aborted by blur, unmount, or flow cancellation.
            return undefined;
        }
        response = await confirmApproval(response);
    }

    if (!response || isStale(response) || signal.aborted) {
        return undefined;
    }

    return response;
};

export const TradingConfirmingScreen = ({
    route: { params },
    navigation,
}: TradingConfirmingScreenProps) => {
    const { flowType } = params;

    const dispatch = useDispatch();
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const activeQuote = useSelector(selectTradingExchangeSelectedQuote);
    const accountKey = sendAccount?.key ?? null;
    const approvalSendTxHash = activeQuote?.approvalSendTxHash;
    const reportToAnalytics = useExchangeAnalyticsStepReport(
        flowType === 'approve' ? 'approval-confirming' : 'revoke-confirming',
    );

    const { confirmApproval, abortConfirmApproval } = useApprovalFlow();

    const hasConfirmedRef = useRef(false);
    const pollAbortControllerRef = useRef(new AbortController());

    // Recreate the abort controller on focus; abort polling on blur or unmount.
    useFocusEffect(
        useCallback(() => {
            pollAbortControllerRef.current = new AbortController();

            return () => {
                pollAbortControllerRef.current.abort();
                abortConfirmApproval();
                hasConfirmedRef.current = false;
            };
        }, [abortConfirmApproval]),
    );

    const {
        status: originalStatus,
        approvalTxid,
        setApprovalTxid,
    } = useAllowanceTxTracking({ accountKey });

    const reportVisit = useEffectEvent(() => {
        reportToAnalytics('visit');
    });
    useEffect(() => {
        reportVisit();
    }, []);

    useEffect(() => {
        if (approvalSendTxHash) {
            setApprovalTxid(approvalSendTxHash);
        }
    }, [approvalSendTxHash, setApprovalTxid]);

    const { status, forceStatus } = useTransactionStatusOverride(originalStatus);

    const { transaction, openInBlockchain } = useTransactionDetails({
        accountKey,
        txid: approvalTxid,
    });

    const { isConfirmed, isFailed, isPending } = status;

    const navigateToInitialScreen = useNavigateToInitialScreen();
    const handleRemoveConfirmed = useCallback(() => {
        // Stop polling first so an in-flight response cannot resurrect the quote.
        pollAbortControllerRef.current.abort();
        abortConfirmApproval();
        dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
        reportToAnalytics('cancel');
        navigateToInitialScreen();
    }, [abortConfirmApproval, dispatch, navigateToInitialScreen, reportToAnalytics]);

    useNavigationRemoveInterceptorAlert({
        shouldPrevent: !isFailed,
        onRemoveConfirmed: handleRemoveConfirmed,
        alertOptions: {
            description:
                flowType === 'approve' ? (
                    <Translation id="moduleTrading.tradingConfirmationScreen.approvalPendingAlert" />
                ) : (
                    <Translation id="moduleTrading.tradingConfirmationScreen.revocationPendingAlert" />
                ),
        },
    });

    useFocusEffect(
        useCallback(() => {
            if (!isConfirmed || !activeQuote || hasConfirmedRef.current) return;

            hasConfirmedRef.current = true;

            const handleConfirmed = async () => {
                switch (flowType) {
                    case 'approve': {
                        // Poll until the API returns the follow-up quote carrying the swap
                        // transaction — navigating earlier would leave the approval calldata
                        // in the quote to be signed again as the swap.
                        const settledQuote = await pollConfirmApproval({
                            initialQuote: activeQuote,
                            confirmApproval,
                            isStale: isStaleApprovalQuote,
                            signal: pollAbortControllerRef.current.signal,
                        });

                        if (!settledQuote) {
                            // Request failed, polling aborted, or attempts exhausted —
                            // stay on this screen; refocusing restarts the confirmation.
                            hasConfirmedRef.current = false;

                            return;
                        }

                        dispatch(sendFormActions.dispose());
                        navigation.popToTop();
                        navigation.push(RootStackRoutes.TradingExchangePreview, {
                            isApproved: true,
                        });
                        break;
                    }

                    case 'revoke-and-approve': {
                        dispatch(sendFormActions.dispose());
                        // The post-revoke quote carries the revoke transaction's
                        // approvalSendTxHash and approvalType: 'ZERO'. Strip them so the
                        // next confirmApproval call requests a fresh approval rather than
                        // re-using the revoke txid as the approval txid.
                        const approvalQuote = {
                            ...activeQuote,
                            approvalSendTxHash: undefined,
                            approvalType: 'MINIMAL',
                            status: 'APPROVAL_REQ',
                        } satisfies ExchangeTrade;
                        dispatch(tradingExchangeActions.saveSelectedQuote(approvalQuote));

                        // Same stale window as 'approve': poll until the API indexes the
                        // confirmed revoke and returns the approval dexTx — navigating with
                        // the revoke calldata would let it be signed again as the approval.
                        const settledQuote = await pollConfirmApproval({
                            initialQuote: approvalQuote,
                            confirmApproval,
                            isStale: isStaleRevokeQuote,
                            signal: pollAbortControllerRef.current.signal,
                        });

                        if (!settledQuote) {
                            // Request failed, polling aborted, or attempts exhausted —
                            // stay on this screen; refocusing restarts the confirmation.
                            hasConfirmedRef.current = false;

                            return;
                        }

                        navigation.popToTop();
                        navigation.push(RootStackRoutes.TradingExchangeApproval, {
                            isRevoked: true,
                        });
                        break;
                    }

                    case 'revoke':
                        dispatch(sendFormActions.dispose());
                        dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
                        navigation.popToTop();
                        break;

                    default:
                        exhaustive(flowType);
                }

                reportToAnalytics('continue');
            };

            void handleConfirmed().catch(() => {
                hasConfirmedRef.current = false;
            });
        }, [
            isConfirmed,
            activeQuote,
            flowType,
            confirmApproval,
            dispatch,
            navigation,
            reportToAnalytics,
        ]),
    );

    return (
        <TradingDeviceConnectionGuard>
            <Screen header={<ExchangeConfirmationHeader flowType={flowType} />}>
                <ConfirmationQuoteDebugView
                    forceStatus={forceStatus}
                    approvalTxid={approvalTxid}
                    transactionStatus={status}
                />
                <ExchangeConfirmationTitle
                    flowType={flowType}
                    isFailed={isFailed}
                    isPending={isPending}
                />
                <ExchangeConfirmationInfo flowType={flowType} transaction={transaction} />
                <ExploreInBlockchainButton onPress={openInBlockchain} />
            </Screen>
        </TradingDeviceConnectionGuard>
    );
};
