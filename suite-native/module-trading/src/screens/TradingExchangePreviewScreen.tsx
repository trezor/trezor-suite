import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNetInfo } from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';

import { isFinalStatus, selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    type StackProps,
    type TradingStackParamList,
    type TradingStackRoutes,
} from '@suite-native/navigation';
import { useExchangeAnalyticReportCallback } from '@suite-native/trading-analytics';
import {
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
} from '@suite-native/trading-state';
import { useSubscribeForSolanaBlockUpdates } from '@suite-native/transaction-management';
import { useDebounce } from '@trezor/react-utils';

import {
    ExchangePreviewContinueButton,
    ExchangePreviewScreenHeader,
    ExchangePreviewView,
} from '../components/exchange/ExchangePreview';
import { Footer } from '../components/general/Footer';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';
import { useExchangeFlow } from '../hooks/exchange/useExchangeFlow';
import { clearTradingStateThunk } from '../thunks';
import { getReceiveAccountAddressText } from '../utils/general/receiveAccountUtils';

export type TradingExchangePreviewScreenProps = StackProps<
    TradingStackParamList,
    TradingStackRoutes.TradingExchangePreview
>;

const TradingExchangePreviewScreenContent = ({
    navigation,
    route: { params },
}: TradingExchangePreviewScreenProps) => {
    const { isApproved } = params;
    const { showAlert } = useAlert();
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const { isInternetReachable } = useNetInfo();
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);
    const toAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const hasRequestedTradeConfirmation = useRef(false);

    const reportToAnalytics = useExchangeAnalyticReportCallback();
    useEffect(() => {
        reportToAnalytics('transaction-preview', 'visit');
    }, [reportToAnalytics]);

    useSubscribeForSolanaBlockUpdates(fromAccount ?? null);

    const { txnErrorString, confirmTrade, fetchFeesAndCompose } = useExchangeFlow();

    const [isConfirmationErrorRequested, setIsConfirmationErrorRequested] =
        useState<boolean>(false);

    const isFinalized = isFinalStatus('exchange', quote?.status);

    const handleConfirmTrade = useCallback(async () => {
        const addressText = getReceiveAccountAddressText(toAccount);

        if (!addressText) {
            console.warn('receiveAddress is not defined', quote);

            return;
        }
        try {
            const success = await confirmTrade({
                receiveAddress: addressText,
                trade: quote,
                approvalFlow: false,
                nextStep: () => {},
            });

            if (success) {
                await fetchFeesAndCompose();
            }
        } catch (e) {
            debounce(() => {
                setIsConfirmationErrorRequested(true);
            });

            console.error('Failed to confirm trade', e);
        }
    }, [confirmTrade, debounce, fetchFeesAndCompose, quote, toAccount]);

    const onSignTransactionNavigation = useCallback(() => {
        hasRequestedTradeConfirmation.current = false;
        reportToAnalytics('transaction-preview', 'continue');
    }, [reportToAnalytics]);

    useFocusEffect(
        useCallback(() => {
            if (!hasRequestedTradeConfirmation.current && !isFinalized) {
                hasRequestedTradeConfirmation.current = true;

                handleConfirmTrade();
            }
        }, [handleConfirmTrade, isFinalized]),
    );

    // clear trading state on unmount
    useEffect(
        () => () => {
            dispatch(clearTradingStateThunk());
        },
        [dispatch],
    );

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
                    reportToAnalytics('transaction-preview', 'retry');
                },
                secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
                onPressSecondaryButton: () => {
                    navigation.popToTop();
                    reportToAnalytics('transaction-preview', 'cancel');
                },
            });
            setIsConfirmationErrorRequested(false);
        }
    }, [
        handleConfirmTrade,
        isConfirmationErrorRequested,
        isInternetReachable,
        navigation,
        showAlert,
        reportToAnalytics,
    ]);

    const errorString = txnErrorString ?? quote?.error;

    return (
        <Screen
            header={<ExchangePreviewScreenHeader />}
            footer={
                <ExchangePreviewContinueButton
                    isDisabled={!!errorString}
                    onSignTransactionNavigation={onSignTransactionNavigation}
                />
            }
        >
            <ExchangePreviewView
                quote={quote}
                txnErrorString={errorString}
                isApproved={isApproved}
            />
            <Footer />
        </Screen>
    );
};

export const TradingExchangePreviewScreen = (props: TradingExchangePreviewScreenProps) => (
    <TradingDeviceConnectionGuard>
        <TradingExchangePreviewScreenContent {...props} />
    </TradingDeviceConnectionGuard>
);
