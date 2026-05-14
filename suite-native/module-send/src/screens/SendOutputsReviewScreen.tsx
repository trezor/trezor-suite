import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { Box, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import {
    ScreenHeader,
    type SendStackParamList,
    type SendStackRoutes,
    type StackProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import {
    ReviewOutputItemList,
    selectIsTransactionAlreadySigned,
    useOutputsReviewBackInterceptor,
} from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { OutputsReviewFooter } from '../components/OutputsReviewFooter';

const spacerStyle = prepareNativeStyle(_ => ({
    height: 150,
}));

export const SendOutputsReviewScreen = ({
    route,
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputsReview>) => {
    const { accountKey, tokenContract } = route.params;

    const { confirmOnTrezorRef, closeSheet } = useConfirmOnTrezorController();

    const { applyStyle } = useNativeStyles();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const showOutputsReviewFooter = isTransactionAlreadySigned && account;

    const navigateToInitialScreen = useNavigateToInitialScreen();
    useOutputsReviewBackInterceptor(navigateToInitialScreen);

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
                <ReviewOutputItemList
                    prefix="send"
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                />
                {showOutputsReviewFooter ? (
                    <OutputsReviewFooter accountKey={accountKey} tokenContract={tokenContract} />
                ) : (
                    <Box style={applyStyle(spacerStyle)} />
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};
