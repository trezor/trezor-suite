import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { Box, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper, useConfirmOnTrezorController } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    ScreenHeader,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import {
    selectIsTransactionAlreadySigned,
    useOutputsReviewBackInterceptor,
} from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { OutputsReviewFooter } from '../components/OutputsReviewFooter';
import { ReviewOutputItemList } from '../components/ReviewOutputItemList';

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

    useOutputsReviewBackInterceptor();

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
