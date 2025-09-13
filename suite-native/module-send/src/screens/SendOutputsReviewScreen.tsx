import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    AccountsRootState,
    cancelSignSendFormTransactionThunk,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { Box, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper, useConfirmOnTrezorController } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    ScreenHeader,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
    useNavigateToInitialScreen,
    useOverrideBackNavigation,
} from '@suite-native/navigation';
import { selectIsTransactionAlreadySigned } from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { OutputsReviewFooter } from '../components/OutputsReviewFooter';
import { ReviewOutputItemList } from '../components/ReviewOutputItemList';
import { useShowReviewCancellationAlert } from '../hooks/useShowReviewCancellationAlert';

const spacerStyle = prepareNativeStyle(_ => ({
    height: 150,
}));

export const SendOutputsReviewScreen = ({
    route,
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputsReview>) => {
    const { accountKey, tokenContract } = route.params;
    const showReviewCancellationAlert = useShowReviewCancellationAlert();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const { confirmOnTrezorRef, closeSheet } = useConfirmOnTrezorController();

    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const showOutputsReviewFooter = isTransactionAlreadySigned && account;

    const onNavigateBack = useCallback(async () => {
        const { wasReviewCanceled } = await showReviewCancellationAlert();

        if (wasReviewCanceled) {
            dispatch(cancelSignSendFormTransactionThunk());
            navigateToInitialScreen();
        }
    }, [dispatch, navigateToInitialScreen, showReviewCancellationAlert]);

    useOverrideBackNavigation({ onNavigateBack });

    useEffect(() => {
        if (showOutputsReviewFooter) {
            closeSheet();
        }
    }, [closeSheet, showOutputsReviewFooter]);

    return (
        <ConfirmOnTrezorWrapper
            controlRef={confirmOnTrezorRef}
            closeActionType="close"
            defaultHeader={
                <ScreenHeader
                    title={<Translation id="moduleSend.review.outputs.title" />}
                    closeActionType="close"
                />
            }
        >
            <VStack flex={1} spacing="sp16" justifyContent="space-between">
                <ReviewOutputItemList accountKey={accountKey} tokenContract={tokenContract} />
                {showOutputsReviewFooter ? (
                    <OutputsReviewFooter accountKey={accountKey} tokenContract={tokenContract} />
                ) : (
                    <Box style={applyStyle(spacerStyle)} />
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};
