import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    type SendRootState,
    selectAccountByKey,
    selectSendPrecomposedTx,
    sendFormActions,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { signStakeTransactionNativeThunk } from '@suite-native/staking';
import {
    selectIsTransactionAlreadySigned,
    useTxValidityTimer,
} from '@suite-native/transaction-management';
import TrezorConnect from '@trezor/connect';

import { type EarnFormDraftPrefix } from '../types';
import { useEarnSelectedPrecomposedTransaction } from './useEarnSelectedPrecomposedTransaction';
import { useHandleEarnReviewError } from './useHandleEarnReviewError';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

type UseEarnTxValidityFlowProps = {
    accountKey: AccountKey;
    stakeType: EarnFormDraftPrefix;
    revealConfirmOnTrezorSheet: () => void;
    isPushing: boolean;
};

export const useEarnTxValidityFlow = ({
    accountKey,
    stakeType,
    revealConfirmOnTrezorSheet,
    isPushing,
}: UseEarnTxValidityFlowProps) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const precomposedTx = useSelector((state: SendRootState) => selectSendPrecomposedTx(state));
    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);
    const precomposedTransaction = useEarnSelectedPrecomposedTransaction(stakeType, accountKey);

    const handleReviewError = useHandleEarnReviewError(stakeType, navigation);

    const handleRetry = useCallback(async () => {
        if (!precomposedTransaction) return;

        const txToRetry = precomposedTransaction;

        TrezorConnect.cancel('tx-timeout');
        dispatch(sendFormActions.clearSignedTransactionData());
        revealConfirmOnTrezorSheet();

        const trySign = () =>
            dispatch(
                signStakeTransactionNativeThunk({
                    accountKey,
                    stakeType,
                    precomposedTransaction: txToRetry,
                }),
            );

        let response = await trySign();

        // Retry once on transient cancel/re-sign errors, not on a bled `tx-timeout`
        if (isRejected(response)) {
            const transientErrorCode =
                response.payload && 'errorCode' in response.payload
                    ? response.payload.errorCode
                    : undefined;
            if (
                transientErrorCode === 'Device_InvalidState' ||
                transientErrorCode === 'Method_Interrupted'
            ) {
                response = await trySign();
            }
        }

        if (!isRejected(response)) return;

        handleReviewError(response.payload);
    }, [
        accountKey,
        stakeType,
        precomposedTransaction,
        dispatch,
        handleReviewError,
        revealConfirmOnTrezorSheet,
    ]);

    const handleCancel = useCallback(() => {
        TrezorConnect.cancel('tx-timeout');
        navigation.pop();
    }, [navigation]);

    const [reviewOpenedAt] = useState(() => Date.now());
    const precomposedTxTimestamp = precomposedTx?.createdTimestamp ?? 0;
    const isPrecomposedTxFromCurrentReview = precomposedTxTimestamp >= reviewOpenedAt;
    const createdTimestamp = isPrecomposedTxFromCurrentReview ? precomposedTxTimestamp : 0;

    return useTxValidityTimer({
        networkType: account?.networkType,
        createdTimestamp,
        isBroadcasting: isPushing,
        isTransactionAlreadySigned,
        onRetry: handleRetry,
        onCancel: handleCancel,
    });
};
