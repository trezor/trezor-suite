import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { sendFormActions } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useConfirmOnTrezorController } from '@suite-native/confirm-on-trezor';
import type {
    TradingExchangeAnalyticReportCallback,
    TradingSellAnalyticReportCallback,
} from '@suite-native/trading-analytics';
import { tradingActions } from '@suite-native/trading-state';
import { type TradingOutputsReviewScreenNavigationProp } from '@suite-native/trading-types';
import {
    selectIsTransactionAlreadySigned,
    transactionManagementActions,
    useOutputsReviewBackInterceptor,
} from '@suite-native/transaction-management';

import { useTradingOutputsReviewErrorAlert } from './useTradingOutputsReviewErrorAlert';
import type { TradingExchangeSignAndSendTransactionProps } from '../exchange/useExchangeFlow';
import type { UseTradingTransactionReturnProps } from '../general/useTradingTransaction';

export type UseTradingOutputsReviewScreenControlsProps = Pick<
    UseTradingTransactionReturnProps,
    'signAndSendTransaction'
> & {
    orderId: string;
    accountKey: AccountKey;
    reportToAnalytics: TradingExchangeAnalyticReportCallback | TradingSellAnalyticReportCallback;
};

export const useTradingOutputsReviewScreenControls = ({
    orderId,
    accountKey,
    signAndSendTransaction,
    reportToAnalytics,
}: UseTradingOutputsReviewScreenControlsProps) => {
    const allowAlertRef = useRef(true);
    const signingExecutedRef = useRef(false);

    const navigation = useNavigation<TradingOutputsReviewScreenNavigationProp>();
    const dispatch = useDispatch();

    const { confirmOnTrezorRef, closeSheet } = useConfirmOnTrezorController();
    const showOutputsReviewErrorAlert = useTradingOutputsReviewErrorAlert(accountKey);

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
        confirmOnTrezorRef,
    };
};
