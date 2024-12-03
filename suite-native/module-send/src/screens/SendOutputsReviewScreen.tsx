import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    RootStackParamList,
    RootStackRoutes,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { ReviewOutputItemList } from '../components/ReviewOutputItemList';
import { OutputsReviewFooter } from '../components/OutputsReviewFooter';
import { SendScreen } from '../components/SendScreen';
import { SendScreenSubHeader } from '../components/SendScreenSubHeader';
import { useShowReviewCancellationAlert } from '../hooks/useShowReviewCancellationAlert';
import { cleanupSendFormThunk } from '../sendFormThunks';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview,
    RootStackParamList
>;

export const SendOutputsReviewScreen = ({
    route,
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputsReview>) => {
    const { accountKey, tokenContract } = route.params;
    const { translate } = useTranslate();
    const navigation = useNavigation<NavigationProps>();
    const showReviewCancellationAlert = useShowReviewCancellationAlert();
    const dispatch = useDispatch();

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', async e => {
            // We want to modify only behavior of back button actions.
            if (e.data.action.type !== 'GO_BACK') return;

            e.preventDefault();

            const { wasReviewCanceled } = await showReviewCancellationAlert();

            if (wasReviewCanceled) {
                dispatch(cleanupSendFormThunk({ accountKey, shouldDeleteDraft: false }));
                navigation.navigate(RootStackRoutes.AccountDetail, {
                    accountKey,
                    tokenContract,
                    closeActionType: 'back',
                });
            }
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
        >
            <VStack flex={1} spacing="sp16" justifyContent="space-between">
                <ReviewOutputItemList accountKey={accountKey} tokenContract={tokenContract} />
                <OutputsReviewFooter accountKey={accountKey} tokenContract={tokenContract} />
            </VStack>
        </SendScreen>
    );
};
