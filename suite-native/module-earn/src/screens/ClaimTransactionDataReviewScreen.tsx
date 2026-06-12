import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { Button, Card, LottieAnimation, Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    type RootStackRoutes,
    ScreenHeader,
    type StackProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import {
    type TransactionReviewOutputsState,
    TxValidityTimer,
    selectIsTransactionAlreadySigned,
    selectIsTransactionReviewInProgress,
    sendArrowsLottie,
} from '@suite-native/transaction-management';

import { ClaimTransactionDataReviewStepList } from '../components/ClaimTransactionDataReviewStepList';
import { useEarnTxValidityFlow } from '../hooks/useEarnTxValidityFlow';
import { useHandleOnEarnTransactionReview } from '../hooks/useHandleOnEarnTransactionReview';
import { useNavigateAfterPushedTransaction } from '../hooks/useNavigateAfterPushedTransaction';

export const ClaimTransactionDataReviewScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.ClaimTransactionDataReview>) => {
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();
    const { accountKey } = route.params;
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const [isPushing, setIsPushing] = useState(false);

    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'claim', accountKey),
    );

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const { handleSign, handlePush } = useHandleOnEarnTransactionReview({
        accountKey,
        stakeType: 'claim',
    });

    const { trackPushedTransaction } = useNavigateAfterPushedTransaction({ accountKey });

    const { showTimer, secondsLeft, isPastDeadline, isBroadcasting, onRetry, isRetryDisabled } =
        useEarnTxValidityFlow({
            accountKey,
            stakeType: 'claim',
            revealConfirmOnTrezorSheet,
            isPushing,
        });

    const isSolanaAccount = account?.networkType === 'solana';

    // Once signed, the user reviews the summary and taps "Claim now" to broadcast the transaction.
    const isReadyToClaim = isTransactionAlreadySigned && !!account;

    useEffect(() => {
        if (isTransactionReviewInProgress) {
            revealConfirmOnTrezorSheet();
        }
    }, [isTransactionReviewInProgress, revealConfirmOnTrezorSheet]);

    useEffect(() => {
        if (isTransactionAlreadySigned) {
            closeSheet();
        }
    }, [closeSheet, isTransactionAlreadySigned]);

    const handleClaimNow = useCallback(async () => {
        setIsPushing(true);

        const pushedTxid = await handlePush();

        if (pushedTxid) {
            trackPushedTransaction(pushedTxid);

            return;
        }

        setIsPushing(false);
    }, [handlePush, trackPushedTransaction]);

    return (
        <ConfirmOnTrezorWrapper
            isManualControlEnabled
            controlRef={confirmOnTrezorRef}
            closeActionType="close"
            defaultHeader={
                <ScreenHeader
                    customContent={
                        <Text variant="body-md-strong">
                            <Translation id="earn.claimTransactionDataReviewScreen.title" />
                        </Text>
                    }
                    closeActionType="close"
                    closeAction={navigateToInitialScreen}
                />
            }
        >
            <VStack flex={1} justifyContent="space-between">
                <VStack justifyContent="center" spacing="sp24">
                    {showTimer && (
                        <TxValidityTimer
                            secondsLeft={secondsLeft}
                            isPastDeadline={isPastDeadline}
                            isBroadcasting={isBroadcasting}
                            onRetry={onRetry}
                            isRetryDisabled={isRetryDisabled}
                        />
                    )}
                    <ClaimTransactionDataReviewStepList onSign={handleSign} />
                </VStack>
                {isReadyToClaim && (
                    <Card>
                        <VStack
                            paddingTop="sp8"
                            paddingHorizontal="sp24"
                            paddingBottom="sp24"
                            alignItems="center"
                            spacing="sp24"
                        >
                            <LottieAnimation source={sendArrowsLottie} size="small" />
                            <Text variant="body-md-strong" textAlign="center">
                                <Translation id="earn.claimTransactionDataReviewScreen.successMessage" />
                            </Text>
                        </VStack>
                        <Button
                            isLoading={isPushing}
                            isDisabled={isSolanaAccount && isPastDeadline}
                            onPress={handleClaimNow}
                            testID="@earn/claim-now"
                        >
                            <Translation id="earn.claimTransactionDataReviewScreen.viewTransactionButton" />
                        </Button>
                    </Card>
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};
