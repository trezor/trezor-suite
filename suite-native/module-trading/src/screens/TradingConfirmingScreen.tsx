import { useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import {
    selectTradingExchangeSelectedQuote,
    tradingExchangeActions,
    useAllowanceTxTracking,
    useTradingExchangeWatchApproval,
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

import { ConfirmationQuoteDebugView } from '../components/exchange/Confirmation/ConfirmationQuoteDebugView';
import { ExchangeConfirmationHeader } from '../components/exchange/Confirmation/ExchangeConfirmationHeader';
import { ExchangeConfirmationInfo } from '../components/exchange/Confirmation/ExchangeConfirmationInfo';
import { ExchangeConfirmationTitle } from '../components/exchange/Confirmation/ExchangeConfirmationTitle';
import { ExploreInBlockchainButton } from '../components/exchange/Confirmation/ExploreInBlockchainButton';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';

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
            navigation.popToTop();
            reportToAnalytics('continue');

            return;
        }

        if (activeQuote.status === 'CONFIRM') {
            hasNavigatedRef.current = true;
            dispatch(sendFormActions.dispose());
            navigation.popToTop();
            navigation.push(RootStackRoutes.TradingExchangePreview, { isApproved: true });
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
            navigation.popToTop();
            navigation.push(RootStackRoutes.TradingExchangeApproval, {
                isRevoked: flowType === 'revoke-and-approve',
            });
            reportToAnalytics('continue');
        }
    }, [activeQuote, flowType, isConfirmed, dispatch, navigation, reportToAnalytics]);

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
