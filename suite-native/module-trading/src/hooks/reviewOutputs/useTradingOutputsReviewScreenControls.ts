import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { sendFormActions } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { useConfirmOnTrezorController } from '@suite-native/device';
import type {
    AppTabsParamList,
    StackToTabCompositeNavigationProp,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { tradingActions } from '@suite-native/trading-state';
import {
    selectIsTransactionAlreadySigned,
    transactionManagementActions,
    useOutputsReviewBackInterceptor,
} from '@suite-native/transaction-management';

import { useTradingOutputsReviewErrorAlert } from './useTradingOutputsReviewErrorAlert';
import { useExchangeAnalyticReportCallback } from '../exchange/useExchangeAnalyticReportCallback';
import {
    TradingExchangeSignAndSendTransactionProps,
    useExchangeFlow,
} from '../exchange/useExchangeFlow';

type TradingOutputsReviewScreenNavigationProp = StackToTabCompositeNavigationProp<
    TradingStackParamList,
    TradingStackRoutes.TradingOutputsReview,
    AppTabsParamList
>;

export const useTradingOutputsReviewScreenControls = (orderId: string, accountKey: AccountKey) => {
    const allowAlertRef = useRef(true);
    const signingExecutedRef = useRef(false);

    const navigation = useNavigation<TradingOutputsReviewScreenNavigationProp>();
    const dispatch = useDispatch();
    const {
        signAndSendTransaction,
        isTransactionSendConsentRequested: isConsentRequested,
        resolveTransactionSendConsent: resolveConsent,
    } = useExchangeFlow();
    const { confirmOnTrezorRef, closeSheet } = useConfirmOnTrezorController();
    const showOutputsReviewErrorAlert = useTradingOutputsReviewErrorAlert(accountKey);

    const reportToAnalytics = useExchangeAnalyticReportCallback();
    useEffect(() => {
        reportToAnalytics('sign-and-send', 'visit');
    }, [reportToAnalytics]);

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const onReviewCanceled = useCallback(() => {
        navigation.popToTop();
        reportToAnalytics('sign-and-send', 'cancel');
    }, [navigation, reportToAnalytics]);
    useOutputsReviewBackInterceptor(onReviewCanceled);

    const nextStep: TradingExchangeSignAndSendTransactionProps['nextStep'] = useCallback(() => {
        navigation.popToTop();
        reportToAnalytics('sign-and-send', 'continue');
        dispatch(tradingActions.setTradeOrderIdToBeOpened(orderId));
    }, [dispatch, navigation, orderId, reportToAnalytics]);

    const onError: TradingExchangeSignAndSendTransactionProps['onError'] = useCallback(
        _error => {
            if (allowAlertRef.current) {
                showOutputsReviewErrorAlert(
                    () => {
                        dispatch(sendFormActions.dispose());
                        dispatch(transactionManagementActions.clearFeeLevels());
                        navigation.pop();
                        reportToAnalytics('sign-and-send', 'retry');
                    },
                    () => {
                        navigation.popToTop();
                        reportToAnalytics('sign-and-send', 'cancel');
                    },
                );
            }
        },
        [dispatch, navigation, showOutputsReviewErrorAlert, reportToAnalytics],
    );

    useEffect(() => {
        if (!signingExecutedRef.current && !isTransactionAlreadySigned) {
            signingExecutedRef.current = true;
            signAndSendTransaction({ nextStep, onError });
        }
    }, [nextStep, onError, signAndSendTransaction, isTransactionAlreadySigned]);

    useEffect(() => {
        if (isTransactionAlreadySigned) {
            closeSheet();
        }
    }, [closeSheet, isTransactionAlreadySigned]);

    // just in case, we don't want to show alert if user already left the screen
    useEffect(
        () => () => {
            allowAlertRef.current = false;
        },
        [],
    );

    return {
        isTransactionAlreadySigned,
        isConsentRequested,
        resolveConsent,
        confirmOnTrezorRef,
    };
};
