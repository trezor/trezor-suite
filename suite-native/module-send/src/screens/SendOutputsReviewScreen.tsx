import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsRootState,
    cancelSignSendFormTransactionThunk,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { Box, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper, useConfirmOnTrezorController } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    ScreenHeader,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
    StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { OutputsReviewFooter } from '../components/OutputsReviewFooter';
import { ReviewOutputItemList } from '../components/ReviewOutputItemList';
import { useShowReviewCancellationAlert } from '../hooks/useShowReviewCancellationAlert';
import { selectIsTransactionAlreadySigned } from '../selectors';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview,
    RootStackParamList
>;
const spacerStyle = prepareNativeStyle(_ => ({
    height: 150,
}));

export const SendOutputsReviewScreen = ({
    route,
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputsReview>) => {
    const { accountKey, tokenContract } = route.params;
    const navigation = useNavigation<NavigationProps>();
    const showReviewCancellationAlert = useShowReviewCancellationAlert();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const { confirmOnTrezorRef, closeSheet } = useConfirmOnTrezorController();

    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const showOutputsReviewFooter = isTransactionAlreadySigned && account;

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', async e => {
            // We want to modify only behavior of back button actions.

            if (e.data.action.type !== 'GO_BACK') return;

            e.preventDefault();

            const { wasReviewCanceled } = await showReviewCancellationAlert();

            if (wasReviewCanceled) {
                dispatch(cancelSignSendFormTransactionThunk());
                navigateToInitialScreen();
            }
        });

        return unsubscribe;
    });

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
