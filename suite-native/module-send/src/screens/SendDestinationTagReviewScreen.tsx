import { useSelector } from 'react-redux';
import { useCallback, useEffect, useState } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';
import { VStack, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { AccountsRootState, DeviceRootState, SendRootState } from '@suite-common/wallet-core';

import {
    selectIsTransactionReviewInProgress,
    selectIsDestinationTagOutputConfirmed,
} from '../selectors';
import { SendScreen } from '../components/SendScreen';
import { SendScreenSubHeader } from '../components/SendScreenSubHeader';
import { SendConfirmOnDeviceImage } from '../components/SendConfirmOnDeviceImage';
import { ReviewDestinationTagCard } from '../components/ReviewDestinationTagCard';
import { useHandleOnDeviceTransactionReview } from '../hooks/useHandleOnDeviceTransactionReview';

export const SendDestinationTagReviewScreen = ({
    route,
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendDestinationTagReview>) => {
    const { accountKey, tokenContract, destinationTag, transaction } = route.params;
    const [hasReviewAlreadyStarted, setHasReviewAlreadyStarted] = useState(false);
    const { translate } = useTranslate();

    const isTransactionReviewInProgress = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsTransactionReviewInProgress(state, accountKey, tokenContract),
    );
    const isDestinationTagConfirmed = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsDestinationTagOutputConfirmed(state, accountKey, tokenContract),
    );

    const handleOnDeviceTransactionReview = useHandleOnDeviceTransactionReview();

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
        <SendScreen
            screenHeader={
                <SendScreenSubHeader
                    content={translate('moduleSend.review.outputs.title')}
                    closeActionType={isTransactionReviewInProgress ? 'close' : 'back'}
                />
            }
            footer={<SendConfirmOnDeviceImage />}
        >
            <VStack flex={1} spacing="sp24" marginTop="sp16">
                <Text variant="titleSmall">
                    <Translation id="moduleSend.review.destinationTagTitle" />
                </Text>
                <ReviewDestinationTagCard destinationTag={destinationTag} />
            </VStack>
        </SendScreen>
    );
};
