import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useDispatch } from '@suite-common/redux-utils';
import { sendFormActions } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useConfirmOnTrezorController } from '@suite-native/confirm-on-trezor';
import { type ExchangeFlowType } from '@suite-native/navigation';
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
    exchangeFlowType?: ExchangeFlowType;
    reportToAnalytics: TradingExchangeAnalyticReportCallback | TradingSellAnalyticReportCallback;
};

export const useTradingOutputsReviewScreenControls = ({
    orderId,
    accountKey,
    exchangeFlowType,
    signAndSendTransaction,
    resolveTransactionSendConsent,
    reportToAnalytics,
}: UseTradingOutputsReviewScreenControlsProps) => {
    const allowAlertRef = useRef(true);
    const signingExecutedRef = useRef(false);
    const activeSigningAttemptIdRef = useRef(0);

    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const navigation = useNavigation<TradingOutputsReviewScreenNavigationProp>();
    const dispatch = useDispatch();

    const { confirmOnTrezorRef, closeSheet, revealConfirmOnTrezorSheet } =
        useConfirmOnTrezorController();
    const showOutputsReviewErrorAlert = useTradingOutputsReviewErrorAlert(accountKey);

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
        TrezorConnect.cancel('tx-timeout');
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

            const handleSigningError: TradingTransactionSignAndSendProps['onError'] = () => {
                if (
                    !allowAlertRef.current ||
                    signingAttemptId !== activeSigningAttemptIdRef.current
                ) {
                    return;
                }

                setIsBroadcasting(false);
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
    }, []);

    // TODO: We should handle the close by event callback from the signing process.
    useEffect(() => {
        if (isTransactionAlreadySigned) {
            closeSheet();
        }
    }, [closeSheet, isTransactionAlreadySigned]);

    // just in case, we don't want to show alert if user already left the screen
    useEffect(
        () => () => {
            allowAlertRef.current = false;
            activeSigningAttemptIdRef.current += 1;
        },
        [],
    );

    const handleRetry = useCallback(async () => {
        activeSigningAttemptIdRef.current += 1;
        resolveTransactionSendConsent(false);
        TrezorConnect.cancel('tx-timeout');
        dispatch(sendFormActions.clearSignedTransactionData());
        setIsBroadcasting(false);
        revealConfirmOnTrezorSheet();

        await startSigning();
    }, [dispatch, resolveTransactionSendConsent, revealConfirmOnTrezorSheet, startSigning]);

    const { isPastDeadline, isRetryDisabled, onRetry, secondsLeft, showTimer } =
        useTradingTxValidityTimer({
            accountKey,
            exchangeFlowType,
            isBroadcasting,
            isTransactionAlreadySigned,
            onRetry: handleRetry,
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
