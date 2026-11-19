import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type TokenAddress } from '@suite-common/tokens';
import {
    type AccountsRootState,
    type SendRootState,
    selectAccountNetworkType,
    selectSendPrecomposedTx,
    sendFormActions,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    type SendStackParamList,
    SendStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { cleanupSendFormThunk, injectSignSendFormTransaction } from '@suite-native/send';
import {
    selectIsTransactionAlreadySigned,
    useTxValidityTimer,
} from '@suite-native/transaction-management';
import TrezorConnect from '@trezor/connect';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

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
    const { dispatch, signSendFormTransaction } = useServices(
        injectDispatch,
        injectSignSendFormTransaction,
    );
    const navigation = useNavigation<NavigationProps>();
    const handleCommonSignRejection = useHandleCommonSignRejection({ accountKey, tokenContract });

    const networkType = useSelector((state: AccountsRootState) =>
        selectAccountNetworkType(state, accountKey),
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
            signSendFormTransaction({
                accountKey,
                tokenContract,
                feeLevel: txToRetry,
            });

        let signingResult = await trySign();

        // Cancel + new sign in the same tick can transiently reject mid-session-reset; retry once.
        if (!signingResult.success) {
            const transientErrorCode = signingResult.error.errorCode;
            if (
                transientErrorCode === 'Device_InvalidState' ||
                transientErrorCode === 'Method_Interrupted'
            ) {
                signingResult = await trySign();
            }
        }

        if (signingResult.success) return;

        handleCommonSignRejection(signingResult.error);
    }, [
        accountKey,
        tokenContract,
        precomposedTx,
        dispatch,
        signSendFormTransaction,
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
        networkType: networkType ?? undefined,
        createdTimestamp: precomposedTx?.createdTimestamp ?? 0,
        isBroadcasting: isSendInProgress,
        isTransactionAlreadySigned,
        onRetry: handleRetry,
        onCancel: handleCancel,
    });
};
