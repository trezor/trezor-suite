import { useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { useSelector } from 'react-redux';

import {
    selectTradingExchangeSelectedQuote,
    tradingExchangeActions,
    useTradingExchangeWatchApproval,
} from '@suite-common/trading';
import { sendFormActions, useAllowanceTxTracking } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { Screen, TradingStackRoutes } from '@suite-native/navigation';
import { useExchangeAnalyticsStepReport } from '@suite-native/trading-analytics';
import { useTransactionStatusOverride } from '@suite-native/trading-debug';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';
import { type TradingStackScreenProps } from '@suite-native/trading-types';
import {
    useNavigationRemoveInterceptorAlert,
    useTransactionDetails,
} from '@suite-native/transaction-management';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { ConfirmationQuoteDebugView } from '../components/exchange/Confirmation/ConfirmationQuoteDebugView';
import { ExchangeConfirmationHeader } from '../components/exchange/Confirmation/ExchangeConfirmationHeader';
import { ExchangeConfirmationInfo } from '../components/exchange/Confirmation/ExchangeConfirmationInfo';
import { ExchangeConfirmationTitle } from '../components/exchange/Confirmation/ExchangeConfirmationTitle';
import { ExploreInBlockchainButton } from '../components/exchange/Confirmation/ExploreInBlockchainButton';
import { useCloseTradingFlow } from '../hooks/general/useCloseTradingFlow';

export type TradingConfirmingScreenProps =
    TradingStackScreenProps<TradingStackRoutes.TradingConfirming>;

export const TradingConfirmingScreen = ({
    route: { params },
    navigation,
}: TradingConfirmingScreenProps) => {
    const { flowType } = params;

    const { dispatch } = useServices(injectDispatch);
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const activeQuote = useSelector(selectTradingExchangeSelectedQuote);
    const accountKey = sendAccount?.key ?? null;
    const approvalSendTxHash = activeQuote?.approvalSendTxHash;
    const reportToAnalytics = useExchangeAnalyticsStepReport(
        flowType === 'approve' ? 'approval-confirming' : 'revoke-confirming',
    );

    const hasNavigatedRef = useRef(false);

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

    const { isConfirmed, isFailed: isTxFailed } = status;

    const isFailed = isTxFailed || activeQuote?.status === 'ERROR';

    const isPending = !isFailed && activeQuote?.status === 'APPROVAL_PENDING';

    const closeTradingFlow = useCloseTradingFlow();
    const handleRemoveConfirmed = useCallback(() => {
        dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
        reportToAnalytics('cancel');
        closeTradingFlow();
    }, [dispatch, closeTradingFlow, reportToAnalytics]);

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

    useTradingExchangeWatchApproval({
        account: sendAccount,
        isEnabled: isConfirmed && flowType !== 'revoke',
    });

    useEffect(() => {
        if (!activeQuote || hasNavigatedRef.current || !isConfirmed) {
            return;
        }

        if (flowType === 'revoke') {
            hasNavigatedRef.current = true;
            dispatch(sendFormActions.dispose());
            dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
            closeTradingFlow();
            reportToAnalytics('continue');

            return;
        }

        if (activeQuote.status === 'CONFIRM') {
            hasNavigatedRef.current = true;
            dispatch(sendFormActions.dispose());
            // Reset drops the finished approval steps, so going back leaves the flow.
            navigation.reset({
                index: 0,
                routes: [
                    {
                        name: TradingStackRoutes.TradingExchangePreview,
                        params: { isApproved: true },
                    },
                ],
            });
            reportToAnalytics('continue');

            return;
        }

        if (activeQuote.status === 'APPROVAL_REQ') {
            hasNavigatedRef.current = true;
            dispatch(sendFormActions.dispose());
            dispatch(
                tradingExchangeActions.saveSelectedQuote({
                    ...activeQuote,
                    approvalSendTxHash: undefined,
                    approvalType: undefined,
                }),
            );
            navigation.reset({
                index: 0,
                routes: [
                    {
                        name: TradingStackRoutes.TradingExchangeApproval,
                        params: { isRevoked: flowType === 'revoke-and-approve' },
                    },
                ],
            });
            reportToAnalytics('continue');
        }
    }, [
        activeQuote,
        flowType,
        isConfirmed,
        dispatch,
        closeTradingFlow,
        navigation,
        reportToAnalytics,
    ]);

    return (
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
    );
};
