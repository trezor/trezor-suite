import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import {
    type AccountsRootState,
    type SendRootState,
    selectAccountByKey,
    selectSendPrecomposedTx,
    sendFormActions,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    type SendStackParamList,
    SendStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { cleanupSendFormThunk, signTransactionNativeThunk } from '@suite-native/send';
import {
    selectIsTransactionAlreadySigned,
    useTxValidityTimer,
} from '@suite-native/transaction-management';
import TrezorConnect from '@trezor/connect';

import { useHandleCommonSignRejection } from './useHandleCommonSignRejection';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview,
    RootStackParamList
>;

type UseTxValidityFlowProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    revealConfirmOnTrezorSheet: () => void;
    isSendInProgress: boolean;
};

export const useTxValidityFlow = ({
    accountKey,
    tokenContract,
    revealConfirmOnTrezorSheet,
    isSendInProgress,
}: UseTxValidityFlowProps) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const handleCommonSignRejection = useHandleCommonSignRejection({ accountKey, tokenContract });

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const precomposedTx = useSelector((state: SendRootState) => selectSendPrecomposedTx(state));
    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    // Keep precomposedTx so the approved-address row stays rendered while we re-sign.
    const handleRetry = useCallback(async () => {
        if (!precomposedTx) return;

        const txToRetry = precomposedTx;

        TrezorConnect.cancel('tx-timeout');
        dispatch(sendFormActions.clearSignedTransactionData());
        revealConfirmOnTrezorSheet();

        const trySign = () =>
            dispatch(
                signTransactionNativeThunk({
                    accountKey,
                    tokenContract,
                    feeLevel: txToRetry,
                }),
            );

        let response = await trySign();

        // Cancel + new sign in the same tick can transiently reject mid-session-reset; retry once.
        if (isRejected(response)) {
            const transientErrorCode = response.payload?.errorCode;
            if (
                transientErrorCode === 'Device_InvalidState' ||
                transientErrorCode === 'Method_Interrupted'
            ) {
                response = await trySign();
            }
        }

        if (!isRejected(response)) return;

        handleCommonSignRejection(response.payload);
    }, [
        accountKey,
        tokenContract,
        precomposedTx,
        dispatch,
        revealConfirmOnTrezorSheet,
        handleCommonSignRejection,
    ]);

    // popTo dispatches POP, not GO_BACK — skips the back-interceptor's cancel alert.
    const handleCancel = useCallback(() => {
        TrezorConnect.cancel('tx-timeout');
        dispatch(cleanupSendFormThunk({ accountKey, tokenContract, shouldDeleteDraft: false }));
        navigation.popTo(SendStackRoutes.SendOutputs, { accountKey, tokenContract });
    }, [accountKey, tokenContract, navigation, dispatch]);

    return useTxValidityTimer({
        networkType: account?.networkType,
        createdTimestamp: precomposedTx?.createdTimestamp ?? 0,
        isBroadcasting: isSendInProgress,
        isTransactionAlreadySigned,
        onRetry: handleRetry,
        onCancel: handleCancel,
    });
};
