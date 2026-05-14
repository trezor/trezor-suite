import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import {
    type SendStackParamList,
    SendStackRoutes,
    type StackProps,
} from '@suite-native/navigation';
import {
    type TransactionReviewOutputsState,
    selectIsDestinationTagOutputConfirmed,
    selectIsTransactionReviewInProgress,
} from '@suite-native/transaction-management';

import { ReviewDestinationTagCard } from '../components/ReviewDestinationTagCard';
import { useHandleOnDeviceTransactionReview } from '../hooks/useHandleOnDeviceTransactionReview';

export const SendDestinationTagReviewScreen = ({
    route,
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendDestinationTagReview>) => {
    const { accountKey, tokenContract, destinationTag, transaction } = route.params;
    const [hasReviewAlreadyStarted, setHasReviewAlreadyStarted] = useState(false);

    const { confirmOnTrezorRef, currentHeaderHeight } = useConfirmOnTrezorController();

    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'send', accountKey, tokenContract),
    );
    const isDestinationTagConfirmed = useSelector((state: TransactionReviewOutputsState) =>
        selectIsDestinationTagOutputConfirmed(state, 'send', accountKey, tokenContract),
    );

    const handleOnDeviceTransactionReview = useHandleOnDeviceTransactionReview({
        accountKey,
        tokenContract,
        transaction,
    });

    useFocusEffect(
        useCallback(() => {
            if (!isTransactionReviewInProgress && !hasReviewAlreadyStarted) {
                handleOnDeviceTransactionReview();
                setHasReviewAlreadyStarted(true);
            }
        }, [
            handleOnDeviceTransactionReview,
            isTransactionReviewInProgress,
            hasReviewAlreadyStarted,
        ]),
    );

    useFocusEffect(
        useCallback(() => {
            if (isDestinationTagConfirmed) {
                navigation.navigate(SendStackRoutes.SendAddressReview, {
                    accountKey,
                    tokenContract,
                    transaction,
                    prevHeaderHeight: currentHeaderHeight,
                    initialSnapIndex: currentHeaderHeight ? 1 : undefined,
                });
            }
        }, [
            accountKey,
            currentHeaderHeight,
            isDestinationTagConfirmed,
            navigation,
            tokenContract,
            transaction,
        ]),
    );

    return (
        <ConfirmOnTrezorWrapper
            controlRef={confirmOnTrezorRef}
            closeActionType={isTransactionReviewInProgress ? 'close' : 'back'}
        >
            <VStack flex={1} spacing="sp24" marginTop="sp16">
                <Text variant="headline-sm">
                    <Translation id="moduleSend.review.destinationTagTitle" />
                </Text>
                <ReviewDestinationTagCard destinationTag={destinationTag} />
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};
