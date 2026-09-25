import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { isSilentSendRejection } from '@suite-common/trading';
import { sendFormActions } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useConfirmOnTrezorController } from '@suite-native/confirm-on-trezor';
import { RootStackRoutes } from '@suite-native/navigation';
import type {
    TradingExchangeAnalyticReportCallback,
    TradingSellAnalyticReportCallback,
} from '@suite-native/trading-analytics';
import { tradingActions } from '@suite-native/trading-state';
import { type TradingOutputsReviewScreenNavigationProp } from '@suite-native/trading-types';
import {
    selectIsTransactionAlreadySigned,
    useOutputsReviewBackInterceptor,
} from '@suite-native/transaction-management';
import TrezorConnect from '@trezor/connect';

import { useTradingOutputsReviewErrorAlert } from './useTradingOutputsReviewErrorAlert';
import { useTradingTxValidityTimer } from './useTradingTxValidityTimer';
import type {
    TradingTransactionSignAndSendProps,
    UseTradingTransactionReturnProps,
} from '../general/useTradingTransaction';

export type UseTradingOutputsReviewScreenControlsProps = Pick<
    UseTradingTransactionReturnProps,
    'resolveTransactionSendConsent' | 'signAndSendTransaction'
> & {
    orderId: string;
    accountKey: AccountKey;
    reportToAnalytics: TradingExchangeAnalyticReportCallback | TradingSellAnalyticReportCallback;
    isDexExchange?: boolean;
};

export const useTradingOutputsReviewScreenControls = ({
    orderId,
    accountKey,
    signAndSendTransaction,
    resolveTransactionSendConsent,
    reportToAnalytics,
    isDexExchange,
}: UseTradingOutputsReviewScreenControlsProps) => {
    const signingExecutedRef = useRef(false);
    const activeSigningAttemptIdRef = useRef(0);

    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const navigation = useNavigation<TradingOutputsReviewScreenNavigationProp>();
    const { dispatch } = useServices(injectDispatch);

    const { confirmOnTrezorRef, closeSheet, revealConfirmOnTrezorSheet } =
        useConfirmOnTrezorController();
    const showOutputsReviewErrorAlert = useTradingOutputsReviewErrorAlert();

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const reportVisit = useEffectEvent(() => {
        reportToAnalytics('sign-and-send', 'visit');
    });
    useEffect(() => {
        reportVisit();
    }, []);

    const onReviewCanceled = useCallback(() => {
        activeSigningAttemptIdRef.current += 1;
        resolveTransactionSendConsent(false);
        TrezorConnect.cancel('tx-cancelled');
        navigation.popToTop();
        reportToAnalytics('sign-and-send', 'cancel');
    }, [navigation, reportToAnalytics, resolveTransactionSendConsent]);

    useOutputsReviewBackInterceptor(onReviewCanceled);

    const nextStep: TradingTransactionSignAndSendProps['nextStep'] = useCallback(() => {
        navigation.popToTop();
        reportToAnalytics('sign-and-send', 'continue');
        dispatch(tradingActions.setTradeOrderIdToBeOpened(orderId));
    }, [dispatch, navigation, orderId, reportToAnalytics]);

    const startSigning = useCallback(() => {
        signingExecutedRef.current = true;

        const runSigningAttempt = () => {
            const signingAttemptId = activeSigningAttemptIdRef.current + 1;
            activeSigningAttemptIdRef.current = signingAttemptId;

            const handleSigningError: TradingTransactionSignAndSendProps['onError'] = error => {
                if (signingAttemptId !== activeSigningAttemptIdRef.current) {
                    return;
                }

                setIsBroadcasting(false);

                // Timeout is handled by solana timer
                if (isSilentSendRejection(error.type)) return;

                showOutputsReviewErrorAlert(() => {
                    reportToAnalytics('sign-and-send', 'retry');
                    runSigningAttempt();
                }, onReviewCanceled);
            };

            return signAndSendTransaction({ nextStep, onError: handleSigningError });
        };

        return runSigningAttempt();
    }, [
        nextStep,
        onReviewCanceled,
        reportToAnalytics,
        showOutputsReviewErrorAlert,
        signAndSendTransaction,
    ]);

    const startInitialSigning = useEffectEvent(() => {
        if (!signingExecutedRef.current && !isTransactionAlreadySigned) {
            startSigning();
        }
    });

    useEffect(() => {
        startInitialSigning();

        return () => {
            // just in case, we don't want to show alert if user already left the screen
            activeSigningAttemptIdRef.current += 1;
        };
    }, []);

    // TODO: We should handle the close by event callback from the signing process.
    useEffect(() => {
        if (isTransactionAlreadySigned) {
            closeSheet();
        }
    }, [closeSheet, isTransactionAlreadySigned]);

    const handleSolanaRetry = useCallback(async () => {
        activeSigningAttemptIdRef.current += 1;
        resolveTransactionSendConsent(false);
        TrezorConnect.cancel('tx-timeout');
        dispatch(sendFormActions.clearSignedTransactionData());
        setIsBroadcasting(false);

        if (isDexExchange) {
            navigation.popTo(RootStackRoutes.TradingExchangePreview, {});

            return;
        }

        revealConfirmOnTrezorSheet();

        await startSigning();
    }, [
        dispatch,
        isDexExchange,
        navigation,
        resolveTransactionSendConsent,
        revealConfirmOnTrezorSheet,
        startSigning,
    ]);

    const { isPastDeadline, isRetryDisabled, onRetry, secondsLeft, showTimer } =
        useTradingTxValidityTimer({
            isDexExchange,
            accountKey,
            isBroadcasting,
            isTransactionAlreadySigned,
            onRetry: handleSolanaRetry,
            onCancel: onReviewCanceled,
        });

    const handleSendTransaction = useCallback(() => {
        if (isPastDeadline || isBroadcasting) {
            return;
        }

        setIsBroadcasting(true);
        resolveTransactionSendConsent(true);
    }, [isBroadcasting, resolveTransactionSendConsent, isPastDeadline]);

    return {
        isTransactionAlreadySigned,
        confirmOnTrezorRef,
        handleSendTransaction,
        showTimer,
        secondsLeft,
        isPastDeadline,
        isBroadcasting,
        onRetry,
        isRetryDisabled,
    };
};
