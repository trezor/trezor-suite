import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { AccountKey } from '@suite-common/wallet-types';
import { useConfirmOnTrezorController } from '@suite-native/device';
import type {
    AppTabsParamList,
    StackToTabCompositeNavigationProp,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { selectIsTransactionAlreadySigned } from '@suite-native/transaction-management';

import { useTradingOutputsReviewErrorAlert } from './useTradingOutputsReviewErrorAlert';
import { tradingActions } from '../../reducers';
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
    const signingExecutedRef = useRef(false);
    const navigation = useNavigation<TradingOutputsReviewScreenNavigationProp>();
    const dispatch = useDispatch();
    const { signAndSendTransaction, isConsentRequested, resolveConsent } = useExchangeFlow();
    const { confirmOnTrezorRef, closeSheet } = useConfirmOnTrezorController();
    const showAlert = useTradingOutputsReviewErrorAlert(accountKey);

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const nextStep: TradingExchangeSignAndSendTransactionProps['nextStep'] = () => {
        navigation.popToTop();
        dispatch(tradingActions.setTradeOrderIdToBeOpened(orderId));
    };
    const onError: TradingExchangeSignAndSendTransactionProps['onError'] = _error => {
        showAlert(
            () => {
                // TODO 21883 clear state and rerun flow?
                navigation.pop();
            },
            () => {
                navigation.popToTop();
            },
        );
    };

    useEffect(() => {
        if (!signingExecutedRef.current && !isTransactionAlreadySigned) {
            signingExecutedRef.current = true;
            signAndSendTransaction({ nextStep, onError });
        }
        // only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isTransactionAlreadySigned) {
            closeSheet();
        }
    }, [closeSheet, isTransactionAlreadySigned]);

    return {
        isTransactionAlreadySigned,
        isConsentRequested,
        resolveConsent,
        confirmOnTrezorRef,
    };
};
