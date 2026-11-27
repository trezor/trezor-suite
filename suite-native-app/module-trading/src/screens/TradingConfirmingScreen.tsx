import { useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeSelectedQuote,
    tradingExchangeActions,
    useTradingExchangeWatchApproval,
} from '@suite-common/trading';
import { sendFormActions, useAllowanceTxTracking } from '@suite-common/wallet-core';
import { BannerInline, Box, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, TradingStackRoutes } from '@suite-native/navigation';
import { useExchangeAnalyticsStepReport } from '@suite-native/trading-analytics';
import { useTransactionStatusOverride } from '@suite-native/trading-debug';
import {
    selectExchangeFlowApprovalStatus,
    selectExchangeSelectedSendAccount,
} from '@suite-native/trading-state';
import { type TradingStackScreenProps } from '@suite-native/trading-types';
import {
    useNavigationRemoveInterceptorAlert,
    useTransactionDetails,
} from '@suite-native/transaction-management';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { LimitInfoRow } from '../components/exchange/Approval/LimitInfoRow';
import { ConfirmationQuoteDebugView } from '../components/exchange/Confirmation/ConfirmationQuoteDebugView';
import { ExchangeConfirmationFeeRow } from '../components/exchange/Confirmation/ExchangeConfirmationFeeRow';
import { ExchangeConfirmationFooter } from '../components/exchange/Confirmation/ExchangeConfirmationFooter';
import { ExchangeConfirmationHeader } from '../components/exchange/Confirmation/ExchangeConfirmationHeader';
import { ExchangeConfirmationTransactionIdRow } from '../components/exchange/Confirmation/ExchangeConfirmationTransactionIdRow';
import { ExchangeRevokeConfirmationDetails } from '../components/exchange/Confirmation/ExchangeRevokeConfirmationDetails';
import { ExchangeFlowApproveStepContent } from '../components/exchange/Flow/ExchangeFlowApproveStepContent';
import { ExchangeFlowIncreaseStepContent } from '../components/exchange/Flow/ExchangeFlowIncreaseStepContent';
import { ExchangeFlowRevokeStepContent } from '../components/exchange/Flow/ExchangeFlowRevokeStepContent';
import { ExchangeFlowScreenHeader } from '../components/exchange/Flow/ExchangeFlowScreenHeader';
import { ExchangeFlowStepsLayout } from '../components/exchange/Flow/ExchangeFlowStepsLayout';
import { useCloseTradingFlow } from '../hooks/general/useCloseTradingFlow';
import { getExchangeApprovalFlowStatus } from '../utils/exchange/exchangeFlowSteps';
import { hasPreapprovedLimit } from '../utils/exchange/quotesUtils';

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
    const flowApprovalStatus = useSelector(selectExchangeFlowApprovalStatus);
    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, activeQuote?.send),
    );
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

    const transactionIdRow = (
        <ExchangeConfirmationTransactionIdRow txid={approvalTxid} onPress={openInBlockchain} />
    );
    const feeRow = <ExchangeConfirmationFeeRow transaction={transaction} />;
    const footer = isFailed ? undefined : <ExchangeConfirmationFooter flowType={flowType} />;
    const failedBanner = isFailed && (
        <BannerInline
            title={<Translation id="moduleTrading.tradingConfirmationScreen.error" />}
            intent="critical"
        />
    );
    const debugView = (
        <ConfirmationQuoteDebugView
            forceStatus={forceStatus}
            approvalTxid={approvalTxid}
            transactionStatus={status}
        />
    );

    // A standalone revoke is not a part of the swap steps.
    if (flowType === 'revoke') {
        return (
            <Screen header={<ExchangeConfirmationHeader flowType={flowType} />} footer={footer}>
                <VStack spacing="sp16">
                    {debugView}
                    {failedBanner}
                    <ExchangeRevokeConfirmationDetails
                        exchange={activeQuote?.exchange}
                        feeRow={feeRow}
                        transactionIdRow={transactionIdRow}
                    />
                </VStack>
            </Screen>
        );
    }

    // The content depends only on this step, the step numbers on the whole flow stored on quote selection.
    const stepApprovalStatus = getExchangeApprovalFlowStatus({
        isRevoked: flowType === 'revoke-and-approve',
        shouldIncreaseLimit: hasPreapprovedLimit(activeQuote),
    });
    const approvalStatus = flowApprovalStatus ?? stepApprovalStatus;
    const readOnlyLimitRow = <LimitInfoRow testID="ExchangeApproval/LimitPicker" />;
    const extraRows = (
        <>
            {transactionIdRow}
            {!!failedBanner && <Box padding="sp16">{failedBanner}</Box>}
        </>
    );

    return (
        <ExchangeFlowStepsLayout
            approvalStatus={approvalStatus}
            currentStep={flowType === 'revoke-and-approve' ? 'revoke' : 'approval'}
            header={<ExchangeFlowScreenHeader closeActionType="close" />}
            footer={footer}
            belowCards={debugView}
        >
            {stepApprovalStatus === 'needs_revoke' && (
                <ExchangeFlowRevokeStepContent coinSymbol={coinSymbol} feeRow={feeRow}>
                    {extraRows}
                </ExchangeFlowRevokeStepContent>
            )}
            {stepApprovalStatus === 'needs_increase' && (
                <ExchangeFlowIncreaseStepContent
                    coinSymbol={coinSymbol}
                    limitRow={readOnlyLimitRow}
                    feeRow={feeRow}
                >
                    {extraRows}
                </ExchangeFlowIncreaseStepContent>
            )}
            {stepApprovalStatus === 'needs_approval' && (
                <ExchangeFlowApproveStepContent
                    coinSymbol={coinSymbol}
                    limitRow={readOnlyLimitRow}
                    feeRow={feeRow}
                >
                    {extraRows}
                </ExchangeFlowApproveStepContent>
            )}
        </ExchangeFlowStepsLayout>
    );
};
