import { useSelector } from 'react-redux';
import { useEffect } from 'react';

import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';
import { Box, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { AccountsRootState, DeviceRootState, SendRootState } from '@suite-common/wallet-core';
import { Text } from '@suite-native/atoms';

import {
    selectIsFirstTransactionAddressConfirmed,
    selectIsOutputsReviewInProgress,
} from '../selectors';
import { AddressReviewStepList } from '../components/AddressReviewStepList';
import { SendScreen } from '../components/SendScreen';
import { SendScreenSubHeader } from '../components/SendScreenSubHeader';
import { SendConfirmOnDeviceImage } from '../components/SendConfirmOnDeviceImage';
import { useShowReviewCancellationAlert } from '../hooks/useShowReviewCancellationAlert';

export const SendAddressReviewScreen = ({
    route,
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendAddressReview>) => {
    const { accountKey } = route.params;
    const { translate } = useTranslate();

    const showReviewCancellationAlert = useShowReviewCancellationAlert();

    const isAddressConfirmed = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsFirstTransactionAddressConfirmed(state, accountKey),
    );

    const isReviewInProgress = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsOutputsReviewInProgress(state, accountKey),
    );

    useEffect(() => {
        if (isAddressConfirmed) {
            navigation.navigate(SendStackRoutes.SendOutputsReview, { accountKey });
        }
    }, [isAddressConfirmed, accountKey, navigation]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            // We want to modify only behavior of back button actions.
            if (e.data.action.type !== 'GO_BACK') return;

            if (isReviewInProgress) {
                e.preventDefault();
                showReviewCancellationAlert();

                return;
            }
        });

        return unsubscribe;
    });

    return (
        <SendScreen
            screenHeader={
                <SendScreenSubHeader
                    content={translate('moduleSend.review.outputs.title')}
                    closeActionType={isReviewInProgress ? 'close' : 'back'}
                />
            }
            // TODO: improve the illustration: https://github.com/trezor/trezor-suite/issues/13965
            footer={isReviewInProgress && <SendConfirmOnDeviceImage />}
        >
            <Box flex={1} justifyContent="space-between" marginTop="sp16">
                <VStack justifyContent="center" alignItems="center" spacing="sp24">
                    <Text variant="titleSmall">
                        <Translation id="moduleSend.review.address.title" />
                    </Text>
                    <AddressReviewStepList />
                </VStack>
            </Box>
        </SendScreen>
    );
};
