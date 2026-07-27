import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { Box, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import {
    ScreenHeader,
    type SendStackParamList,
    type SendStackRoutes,
    type StackProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import {
    ReviewOutputItemList,
    TxValidityTimer,
    selectIsTransactionAlreadySigned,
    useOutputsReviewBackInterceptor,
} from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { OutputsReviewFooter } from '../components/OutputsReviewFooter';
import { useTxValidityFlow } from '../hooks/useTxValidityFlow';

const spacerStyle = prepareNativeStyle(_ => ({
    height: 150,
}));

export const SendOutputsReviewScreen = ({
    route,
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputsReview>) => {
    const { accountKey, tokenContract } = route.params;

    const { confirmOnTrezorRef, closeSheet, revealConfirmOnTrezorSheet } =
        useConfirmOnTrezorController();

    const { applyStyle } = useNativeStyles();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);
    const showOutputsReviewFooter = isTransactionAlreadySigned && account;

    const [isSendInProgress, setIsSendInProgress] = useState(false);

    const navigateToInitialScreen = useNavigateToInitialScreen();
    useOutputsReviewBackInterceptor(navigateToInitialScreen);

    const { showTimer, secondsLeft, isPastDeadline, isBroadcasting, onRetry, isRetryDisabled } =
        useTxValidityFlow({
            accountKey,
            tokenContract,
            revealConfirmOnTrezorSheet,
            isSendInProgress,
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
                <VStack spacing="sp16">
                    {showTimer && (
                        <TxValidityTimer
                            secondsLeft={secondsLeft}
                            isPastDeadline={isPastDeadline}
                            isBroadcasting={isBroadcasting}
                            onRetry={onRetry}
                            isRetryDisabled={isRetryDisabled}
                        />
                    )}
                    <ReviewOutputItemList
                        prefix="send"
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                </VStack>
                {showOutputsReviewFooter ? (
                    <OutputsReviewFooter
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                        isPastDeadline={isPastDeadline}
                        isSendInProgress={isSendInProgress}
                        setIsSendInProgress={setIsSendInProgress}
                    />
                ) : (
                    <Box style={applyStyle(spacerStyle)} />
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};
