import { useDispatch } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import {
    Screen,
    ScreenSubHeader,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { IconButton, VStack } from '@suite-native/atoms';
import { cancelSignSendFormTransactionThunk } from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';
import { useNativeStyles } from '@trezor/styles';

import { ReviewOutputItemList } from '../components/ReviewOutputItemList';
import { OutputsReviewFooter } from '../components/OutputsReviewFooter';
import { SignSuccessMessage } from '../components/SignSuccessMessage';
import { cleanupSendFormThunk } from '../sendFormThunks';

export const SendOutputsReviewScreen = ({
    route,
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputsReview>) => {
    const { accountKey } = route.params;
    const { utils } = useNativeStyles();
    const { translate } = useTranslate();
    const dispatch = useDispatch();

    const handleGoBack = async () => {
        const response = await dispatch(cancelSignSendFormTransactionThunk());
        if (isFulfilled(response)) {
            // If success navigation is handled by signTransactionThunk call on SendAddressReviewScreen.

            return;
        }

        dispatch(cleanupSendFormThunk({ accountKey }));
        navigation.navigate(SendStackRoutes.SendAccounts);
    };

    return (
        <Screen
            customHorizontalPadding={utils.spacings.small}
            subheader={
                <ScreenSubHeader
                    content={translate('moduleSend.review.outputs.title')}
                    leftIcon={
                        <IconButton
                            iconName="close"
                            size="medium"
                            colorScheme="tertiaryElevation0"
                            onPress={handleGoBack}
                            accessibilityRole="button"
                            accessibilityLabel="Cancel"
                        />
                    }
                />
            }
            footer={<OutputsReviewFooter accountKey={accountKey} />}
        >
            <VStack
                flex={1}
                spacing="extraLarge"
                justifyContent="space-between"
                paddingBottom="xxl"
            >
                <ReviewOutputItemList accountKey={accountKey} />
                <SignSuccessMessage />
            </VStack>
        </Screen>
    );
};
