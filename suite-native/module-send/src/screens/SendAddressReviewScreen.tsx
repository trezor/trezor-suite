import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { Box, Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import {
    ScreenHeader,
    type SendStackParamList,
    SendStackRoutes,
    type StackProps,
} from '@suite-native/navigation';
import {
    type TransactionReviewOutputsState,
    selectIsReceiveAddressOutputConfirmed,
    selectIsTransactionReviewInProgress,
} from '@suite-native/transaction-management';

import { AddressReviewStepList } from '../components/AddressReviewStepList';

export const SendAddressReviewScreen = ({
    route,
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendAddressReview>) => {
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, currentHeaderHeight } =
        useConfirmOnTrezorController();
    const { accountKey, tokenContract } = route.params;
    const isAddressConfirmed = useSelector((state: TransactionReviewOutputsState) =>
        selectIsReceiveAddressOutputConfirmed(state, 'send', accountKey, tokenContract),
    );

    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'send', accountKey, tokenContract),
    );

    useFocusEffect(
        useCallback(() => {
            if (isAddressConfirmed) {
                navigation.navigate(SendStackRoutes.SendOutputsReview, {
                    accountKey,
                    tokenContract,
                    prevHeaderHeight: currentHeaderHeight,
                    initialSnapIndex: currentHeaderHeight ? 1 : undefined,
                });
            }
        }, [accountKey, currentHeaderHeight, isAddressConfirmed, navigation, tokenContract]),
    );

    useEffect(() => {
        if (isTransactionReviewInProgress) {
            revealConfirmOnTrezorSheet();
        }
    }, [isTransactionReviewInProgress, revealConfirmOnTrezorSheet]);

    return (
        <ConfirmOnTrezorWrapper
            isManualControlEnabled
            controlRef={confirmOnTrezorRef}
            closeActionType="close"
            defaultHeader={<ScreenHeader closeActionType="back" />}
        >
            <Box flex={1} justifyContent="space-between">
                <VStack justifyContent="center" spacing="sp24">
                    <Text variant="headline-sm">
                        <Translation id="moduleSend.review.address.title" />
                    </Text>
                    <AddressReviewStepList />
                </VStack>
            </Box>
        </ConfirmOnTrezorWrapper>
    );
};
