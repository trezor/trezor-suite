import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { AccountsRootState, DeviceRootState, SendRootState } from '@suite-common/wallet-core';
import { Text, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';

import { ReviewDestinationTagCard } from '../components/ReviewDestinationTagCard';
import { useHandleOnDeviceTransactionReview } from '../hooks/useHandleOnDeviceTransactionReview';
import {
    selectIsDestinationTagOutputConfirmed,
    selectIsTransactionReviewInProgress,
} from '../selectors';

export const SendDestinationTagReviewScreen = ({
    route,
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendDestinationTagReview>) => {
    const { accountKey, tokenContract, destinationTag, transaction } = route.params;
    const [hasReviewAlreadyStarted, setHasReviewAlreadyStarted] = useState(false);

    const isTransactionReviewInProgress = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsTransactionReviewInProgress(state, accountKey, tokenContract),
    );
    const isDestinationTagConfirmed = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsDestinationTagOutputConfirmed(state, accountKey, tokenContract),
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

    useEffect(() => {
        if (isDestinationTagConfirmed) {
            navigation.navigate(SendStackRoutes.SendAddressReview, {
                accountKey,
                tokenContract,
                transaction,
            });
        }
    }, [isDestinationTagConfirmed, accountKey, navigation, tokenContract, transaction]);

    return (
        <ConfirmOnTrezorWrapper closeActionType={isTransactionReviewInProgress ? 'close' : 'back'}>
            <VStack flex={1} spacing="sp24" marginTop="sp16">
                <Text variant="titleSmall">
                    <Translation id="moduleSend.review.destinationTagTitle" />
                </Text>
                <ReviewDestinationTagCard destinationTag={destinationTag} />
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};
