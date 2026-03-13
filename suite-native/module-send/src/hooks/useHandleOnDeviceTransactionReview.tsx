import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { selectIsDeviceRemembered } from '@suite-common/device';
import { sendFormActions } from '@suite-common/wallet-core';
import {
    AccountKey,
    GeneralPrecomposedTransactionFinal,
    TokenAddress,
} from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    SendStackParamList,
    SendStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { signTransactionNativeThunk } from '@suite-native/send';
import {
    TransactionReviewOutputsState,
    selectIsTransactionReviewInProgress,
    useShowReviewCancellationAlert,
} from '@suite-native/transaction-management';
import { TRANSPORT_ERROR } from '@trezor/transport';

import { useShowDeviceDisconnectedAlert } from './useShowDeviceDisconnectedAlert';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputs,
    RootStackParamList
>;

type HandleOnDeviceTransactionReviewProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    transaction: GeneralPrecomposedTransactionFinal | null;
};

export const useHandleOnDeviceTransactionReview = ({
    accountKey,
    tokenContract,
    transaction,
}: HandleOnDeviceTransactionReviewProps) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const { showAlert } = useAlert();
    const isViewOnlyDevice = useSelector(selectIsDeviceRemembered);

    const showReviewCancellationAlert = useShowReviewCancellationAlert();
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedAlert();

    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'send', accountKey, tokenContract),
    );

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            // Ask user to confirm if they want to leave the screen and cancel the review.
            if (e.data.action.type === 'GO_BACK' && isTransactionReviewInProgress) {
                e.preventDefault();
                showReviewCancellationAlert();

                return;
            }

            // Delete canceled transaction review state leftovers.
            dispatch(sendFormActions.discardTransaction());
        });

        return unsubscribe;
    }, [navigation, isTransactionReviewInProgress, showReviewCancellationAlert, dispatch]);

    // TODO(#25541): Phase 5-7 - May be refactored when fee bottom sheet moves to Send Outputs and SendFees is removed.
    const handleOnDeviceTransactionReview = useCallback(
        async (transactionOverride?: GeneralPrecomposedTransactionFinal) => {
            const txToSign = transactionOverride ?? transaction;
            if (!txToSign) return;

            const response = await dispatch(
                signTransactionNativeThunk({
                    accountKey,
                    tokenContract,
                    feeLevel: txToSign,
                }),
            );

            if (!isRejected(response)) {
                navigation.navigate(RootStackRoutes.AccountDetail, {
                    accountKey,
                    tokenContract,
                    closeActionType: 'back',
                });

                return;
            }

            const errorCode = response.payload?.errorCode;
            const message = response.payload?.message;

            if (
                errorCode === 'Failure_PinCancelled' ||
                errorCode === 'Method_Cancel' ||
                errorCode === 'Failure_ActionCancelled'
            ) {
                navigation.popTo(SendStackRoutes.SendOutputs, {
                    accountKey,
                    tokenContract,
                });

                return;
            }

            if (errorCode === 'Device_InvalidState' || errorCode === 'Method_Interrupted') {
                showAlert({
                    title: <Translation id="modulePassphrase.featureAuthorizationError" />,
                    pictogramVariant: 'critical',
                    primaryButtonTitle: <Translation id="generic.buttons.close" />,
                    primaryButtonVariant: 'redBold',
                });

                return;
            }

            if (
                message === TRANSPORT_ERROR.DEVICE_DISCONNECTED_DURING_ACTION ||
                message === TRANSPORT_ERROR.UNEXPECTED_ERROR
            ) {
                if (isViewOnlyDevice) {
                    navigation.popTo(SendStackRoutes.SendOutputs, {
                        accountKey,
                        tokenContract,
                    });
                }
                setTimeout(() => showDeviceDisconnectedAlert(), 1500);
            }
        },
        [
            accountKey,
            tokenContract,
            transaction,
            isViewOnlyDevice,
            navigation,
            showDeviceDisconnectedAlert,
            dispatch,
            showAlert,
        ],
    );

    return handleOnDeviceTransactionReview;
};
