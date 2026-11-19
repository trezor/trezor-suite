import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { useSelector, useStore } from 'react-redux';

import { useNetInfo } from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';

import {
    type TradingRootState,
    hasEip712SignData,
    isFinalStatus,
    selectTradingExchangeFormStep,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import { useExchangeAnalyticsStepReport } from '@suite-native/trading-analytics';
import {
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
} from '@suite-native/trading-state';
import { useSubscribeForSolanaBlockUpdates } from '@suite-native/transaction-management';
import { useDebounce } from '@trezor/react-utils';

import { useExchangeFlow } from './useExchangeFlow';
import { getReceiveAccountAddressText } from '../../utils/general/receiveAccountUtils';
import { useCloseTradingFlow } from '../general/useCloseTradingFlow';

type UseExchangePreviewStepParams = {
    onApprovalRequired: () => void;
};

export const useExchangePreviewStep = ({ onApprovalRequired }: UseExchangePreviewStepParams) => {
    const { showAlert } = useAlert();
    const closeTradingFlow = useCloseTradingFlow();
    const debounce = useDebounce();
    const { isInternetReachable } = useNetInfo();
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);
    const toAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const hasRequestedTradeConfirmation = useRef(false);

    const reportToAnalytics = useExchangeAnalyticsStepReport('transaction-preview');
    const reportVisit = useEffectEvent(() => {
        reportToAnalytics('visit');
    });
    useEffect(() => {
        reportVisit();
    }, []);

    useSubscribeForSolanaBlockUpdates(fromAccount ?? null);

    const { txnErrorString, confirmTrade, abortConfirmTrade, composeTradingTransaction } =
        useExchangeFlow();
    const store = useStore<TradingRootState>();

    const [isConfirmationErrorRequested, setIsConfirmationErrorRequested] =
        useState<boolean>(false);

    const isFinalized = isFinalStatus('exchange', quote?.status);

    const handleConfirmTrade = useCallback(async () => {
        const currentQuote = selectTradingExchangeSelectedQuote(store.getState());
        const addressText = getReceiveAccountAddressText(toAccount);

        if (!addressText) {
            console.warn('receiveAddress is not defined', currentQuote);

            return;
        }
        try {
            const success = await confirmTrade({
                receiveAddress: addressText,
                trade: currentQuote,
                approvalFlow: false,
                nextStep: () => {},
            });

            if (success) {
                const currentFormStep = selectTradingExchangeFormStep(store.getState());
                if (currentFormStep !== 'SIGN_DATA') {
                    await composeTradingTransaction();
                }
            }
        } catch (e) {
            debounce(() => {
                setIsConfirmationErrorRequested(true);
            });

            console.error('Failed to confirm trade', e);
        }
    }, [confirmTrade, debounce, composeTradingTransaction, store, toAccount]);

    const onSignTransactionNavigation = useCallback(() => {
        hasRequestedTradeConfirmation.current = false;
        reportToAnalytics('continue');
    }, [reportToAnalytics]);

    useFocusEffect(
        useCallback(() => {
            if (!hasRequestedTradeConfirmation.current && !isFinalized) {
                hasRequestedTradeConfirmation.current = true;

                handleConfirmTrade();
            }
        }, [handleConfirmTrade, isFinalized]),
    );

    const handleApprovalRequired = useEffectEvent(onApprovalRequired);
    useEffect(() => {
        if (quote?.status === 'APPROVAL_REQ') {
            handleApprovalRequired();
        }
    }, [quote?.status]);

    // Clearing the trading state is left to the screen, because a step unmounts within the flow
    // while the selected quote is still needed.
    useEffect(() => () => abortConfirmTrade(), [abortConfirmTrade]);

    useEffect(() => {
        if (isConfirmationErrorRequested) {
            const description =
                isInternetReachable === false ? (
                    <Translation id="moduleTrading.error.deviceOfflineDescription" />
                ) : undefined;

            showAlert({
                title: (
                    <Translation id="moduleTrading.tradingExchangePreviewScreen.confirmationAlertTitle" />
                ),
                description,
                primaryButtonTitle: <Translation id="generic.buttons.tryAgain" />,
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                onPressPrimaryButton: () => {
                    handleConfirmTrade();
                    reportToAnalytics('retry');
                },
                secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
                onPressSecondaryButton: () => {
                    closeTradingFlow();
                    reportToAnalytics('cancel');
                },
            });
            setIsConfirmationErrorRequested(false);
        }
    }, [
        handleConfirmTrade,
        isConfirmationErrorRequested,
        isInternetReachable,
        closeTradingFlow,
        showAlert,
        reportToAnalytics,
    ]);

    // EIP-712 signing has no on-chain transaction, so fee composition errors
    // (e.g. insufficient gas) are irrelevant.
    const errorString = hasEip712SignData(quote) ? null : (txnErrorString ?? quote?.error);

    return { quote, errorString, handleConfirmTrade, onSignTransactionNavigation };
};
