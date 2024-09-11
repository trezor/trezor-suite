import { useDispatch } from 'react-redux';
import { useEffect } from 'react';

import { isFulfilled } from '@reduxjs/toolkit';

import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';
import { VStack } from '@suite-native/atoms';
import { cancelSignSendFormTransactionThunk } from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';

import { ReviewOutputItemList } from '../components/ReviewOutputItemList';
import { OutputsReviewFooter } from '../components/OutputsReviewFooter';
import { SignSuccessMessage } from '../components/SignSuccessMessage';
import { cleanupSendFormThunk } from '../sendFormThunks';
import { SendScreen } from '../components/SendScreen';
import { SendScreenSubHeader } from '../components/SendScreenSubHeader';

export const SendOutputsReviewScreen = ({
    route,
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputsReview>) => {
    const { accountKey } = route.params;
    const { translate } = useTranslate();
    const dispatch = useDispatch();

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', async e => {
            if (e.data.action.type === 'GO_BACK') {
                e.preventDefault();
            }
            const response = await dispatch(cancelSignSendFormTransactionThunk());
            if (isFulfilled(response)) {
                // If success navigation is handled by signTransactionThunk call on SendAddressReviewScreen.

                return;
            }
            dispatch(cleanupSendFormThunk({ accountKey }));
            navigation.popToTop();
        });

        return unsubscribe;
    });

    return (
        <SendScreen
            screenHeader={
                <SendScreenSubHeader
                    content={translate('moduleSend.review.outputs.title')}
                    closeActionType="close"
                />
            }
            footer={<OutputsReviewFooter accountKey={accountKey} />}
        >
            <VStack flex={1} spacing="extraLarge" justifyContent="space-between">
                <ReviewOutputItemList accountKey={accountKey} />
                <SignSuccessMessage />
            </VStack>
        </SendScreen>
    );
};
