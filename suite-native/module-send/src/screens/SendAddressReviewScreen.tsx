import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { AccountsRootState, DeviceRootState, SendRootState } from '@suite-common/wallet-core';
import { Box, Text, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper, useConfirmOnTrezorController } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    ScreenHeader,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
} from '@suite-native/navigation';

import { AddressReviewStepList } from '../components/AddressReviewStepList';
import {
    selectIsReceiveAddressOutputConfirmed,
    selectIsTransactionReviewInProgress,
} from '../selectors';

export const SendAddressReviewScreen = ({
    route,
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendAddressReview>) => {
    const { confirmOnTrezorRef, triggerTransition } = useConfirmOnTrezorController();
    const { accountKey, tokenContract } = route.params;
    const isAddressConfirmed = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsReceiveAddressOutputConfirmed(state, accountKey, tokenContract),
    );

    const isTransactionReviewInProgress = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsTransactionReviewInProgress(state, accountKey, tokenContract),
    );

    useEffect(() => {
        if (isAddressConfirmed) {
            navigation.navigate(SendStackRoutes.SendOutputsReview, { accountKey, tokenContract });
        }
    }, [isAddressConfirmed, accountKey, navigation, tokenContract]);

    useEffect(() => {
        if (isTransactionReviewInProgress) {
            triggerTransition();
        }
    }, [isTransactionReviewInProgress, triggerTransition]);

    return (
        <ConfirmOnTrezorWrapper
            isManualControlEnabled
            controlRef={confirmOnTrezorRef}
            closeActionType="close"
            defaultHeader={<ScreenHeader closeActionType="back" />}
        >
            <Box flex={1} justifyContent="space-between">
                <VStack justifyContent="center" spacing="sp24">
                    <Text variant="titleSmall">
                        <Translation id="moduleSend.review.address.title" />
                    </Text>
                    <AddressReviewStepList />
                </VStack>
            </Box>
        </ConfirmOnTrezorWrapper>
    );
};
