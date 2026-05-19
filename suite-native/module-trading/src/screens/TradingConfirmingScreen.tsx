import { useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import {
    selectTradingExchangeSelectedQuote,
    tradingExchangeActions,
    useAllowanceTxTracking,
} from '@suite-common/trading';
import { sendFormActions } from '@suite-common/wallet-core';
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

    const { confirmApproval } = useApprovalFlow();

    const hasConfirmedRef = useRef(false);

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
        dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
        reportToAnalytics('cancel');
        navigateToInitialScreen();
    }, [dispatch, navigateToInitialScreen, reportToAnalytics]);

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
                        const response = await confirmApproval(activeQuote);

                        if (response?.status === 'APPROVAL_PENDING') {
                            // we know it was confirmed, so we can set the status to CONFIRM even if it came as APPROVAL_PENDING
                            // that is basically what api does (but it takes time)
                            // so we need to do it here to avoid the approval screen transition through useExchangeFlow
                            dispatch(
                                tradingExchangeActions.saveSelectedQuote({
                                    ...response,
                                    status: 'CONFIRM',
                                }),
                            );
                        }

                        if (!response) {
                            // confirmApproval already sets the error state — stay on this screen.
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

                    case 'revoke-and-approve':
                        dispatch(sendFormActions.dispose());
                        // The post-revoke quote carries the revoke transaction's
                        // approvalSendTxHash and approvalType: 'ZERO'. Strip them so the
                        // next confirmApproval call requests a fresh approval rather than
                        // re-using the revoke txid as the approval txid.
                        if (activeQuote) {
                            dispatch(
                                tradingExchangeActions.saveSelectedQuote({
                                    ...activeQuote,
                                    approvalSendTxHash: undefined,
                                    approvalType: undefined,
                                    status: 'APPROVAL_REQ',
                                }),
                            );
                        }
                        navigation.popToTop();
                        navigation.push(RootStackRoutes.TradingExchangeApproval, {
                            isRevoked: true,
                        });
                        break;

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
