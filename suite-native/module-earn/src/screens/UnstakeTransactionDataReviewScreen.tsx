import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

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
} from '@suite-native/navigation';
import {
    type TransactionReviewOutputsState,
    TxValidityTimer,
    selectIsReceiveAddressOutputConfirmed,
    selectIsTransactionAlreadySigned,
    sendArrowsLottie,
} from '@suite-native/transaction-management';

import { UnstakeTransactionDataReviewStepList } from '../components/UnstakeTransactionDataReviewStepList';
import { useEarnReviewAutoStart } from '../hooks/useEarnReviewAutoStart';
import { useEarnSelectedPrecomposedTransaction } from '../hooks/useEarnSelectedPrecomposedTransaction';
import { useEarnTxValidityFlow } from '../hooks/useEarnTxValidityFlow';
import { useHandleOnEarnTransactionReview } from '../hooks/useHandleOnEarnTransactionReview';
import { useNavigateAfterPushedTransaction } from '../hooks/useNavigateAfterPushedTransaction';
import { useStakingDetailNavigation } from '../hooks/useStakingDetailNavigation';

export const UnstakeTransactionDataReviewScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.UnstakeTransactionDataReview>) => {
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();
    const { accountKey } = route.params;
    const { navigateToStakingDetail } = useStakingDetailNavigation();
    const [isPushing, setIsPushing] = useState(false);

    const isAddressConfirmed = useSelector((state: TransactionReviewOutputsState) =>
        selectIsReceiveAddressOutputConfirmed(state, 'unstake', accountKey),
    );

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const precomposedTransaction = useEarnSelectedPrecomposedTransaction('unstake', accountKey);

    const { handleSign, handlePush, closeReview } = useHandleOnEarnTransactionReview({
        accountKey,
        stakeType: 'unstake',
    });

    const { trackPushedTransaction } = useNavigateAfterPushedTransaction({ accountKey });

    const { showTimer, secondsLeft, isPastDeadline, isBroadcasting, onRetry, isRetryDisabled } =
        useEarnTxValidityFlow({
            accountKey,
            stakeType: 'unstake',
            revealConfirmOnTrezorSheet,
            isPushing,
        });

    const isSolanaAccount = account?.networkType === 'solana';

    const isReadyToUnstake = isTransactionAlreadySigned && !!account;

    useEarnReviewAutoStart({
        handleSign,
        isSigned: isTransactionAlreadySigned,
        canStart: !!precomposedTransaction,
        onDeviceReviewReady: revealConfirmOnTrezorSheet,
        onSignFailed: closeSheet,
    });

    useFocusEffect(
        useCallback(() => {
            // Solana address outputs would redirect mid-sign, skip until the success card.
            if (isAddressConfirmed && account && account.networkType !== 'solana') {
                navigateToStakingDetail({ accountKey, symbol: account.symbol });
            }
        }, [account, accountKey, isAddressConfirmed, navigateToStakingDetail]),
    );

    useEffect(() => {
        if (isTransactionAlreadySigned) {
            closeSheet();
        }
    }, [closeSheet, isTransactionAlreadySigned]);

    const handleUnstakeNow = useCallback(async () => {
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
            closeAction={closeReview}
            defaultHeader={
                <ScreenHeader
                    customContent={
                        <Text variant="body-md-strong">
                            <Translation id="earn.unstakeTransactionDataReviewScreen.title" />
                        </Text>
                    }
                    closeActionType="close"
                    closeAction={closeReview}
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
                    <UnstakeTransactionDataReviewStepList />
                </VStack>
                {isReadyToUnstake && (
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
                                <Translation id="earn.unstakeTransactionDataReviewScreen.successMessage" />
                            </Text>
                        </VStack>
                        <Button
                            isLoading={isPushing}
                            isDisabled={isSolanaAccount && isPastDeadline}
                            onPress={handleUnstakeNow}
                            testID="@earn/unstake-now"
                        >
                            <Translation id="earn.unstakeTransactionDataReviewScreen.viewTransactionButton" />
                        </Button>
                    </Card>
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};
