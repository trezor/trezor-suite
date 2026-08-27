import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { isDeviceReviewOnly } from '@suite-common/wallet-utils';
import { Button, Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { FollowDeviceScreenContent } from '@suite-native/device';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';
import { ScrollToEndOnMount } from '@suite-native/scrollview';
import {
    TxValidityTimer,
    selectIsTransactionAlreadySigned,
} from '@suite-native/transaction-management';

import { UnstakeTransactionDataReviewStepList } from '../components/UnstakeTransactionDataReviewStepList';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { useEarnAccountLabel } from '../hooks/useEarnAccountLabel';
import { useEarnPendingTransactionSheet } from '../hooks/useEarnPendingTransactionSheet';
import { useEarnReviewAutoStart } from '../hooks/useEarnReviewAutoStart';
import { useEarnSelectedPrecomposedTransaction } from '../hooks/useEarnSelectedPrecomposedTransaction';
import { useEarnTxValidityFlow } from '../hooks/useEarnTxValidityFlow';
import { useHandleOnEarnTransactionReview } from '../hooks/useHandleOnEarnTransactionReview';
import { useNavigateAfterPushedTransaction } from '../hooks/useNavigateAfterPushedTransaction';
import { getAmountInBaseUnits } from '../utils/getAmountInBaseUnits';

export const UnstakeTransactionDataReviewScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.UnstakeTransactionDataReview>) => {
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();
    const { accountKey, amount } = route.params;
    const [isPushing, setIsPushing] = useState(false);

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const accountLabel = useEarnAccountLabel(account);

    const precomposedTransaction = useEarnSelectedPrecomposedTransaction('unstake', accountKey);

    const pendingAmountInBaseUnits = account ? getAmountInBaseUnits(amount, account.symbol) : '0';

    const { handleSign, handlePush, closeReview, markReviewNavigationSuccess } =
        useHandleOnEarnTransactionReview({
            accountKey,
            stakeType: 'unstake',
        });

    const { trackPushedTransaction, pendingTxid, isPending, submittedAt } =
        useNavigateAfterPushedTransaction({
            accountKey,
            amountInBaseUnits: pendingAmountInBaseUnits,
            markReviewNavigationSuccess,
            stakeType: 'unstake',
        });

    const { pendingBottomSheetRef, isExploreDisabled, openInBlockchain } =
        useEarnPendingTransactionSheet({ accountKey, isPending, pendingTxid });

    const { showTimer, secondsLeft, isPastDeadline, isBroadcasting, onRetry, isRetryDisabled } =
        useEarnTxValidityFlow({
            accountKey,
            stakeType: 'unstake',
            revealConfirmOnTrezorSheet,
            isPushing,
        });

    const isSolanaAccount = account?.networkType === 'solana';

    const isReadyToUnstake = isTransactionAlreadySigned && !!account;

    const isFollowDeviceReview = isDeviceReviewOnly(precomposedTransaction);

    useEarnReviewAutoStart({
        handleSign,
        isSigned: isTransactionAlreadySigned,
        canStart: !!precomposedTransaction,
        onDeviceReviewReady: revealConfirmOnTrezorSheet,
        onSignFailed: closeSheet,
    });

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

    const timer = showTimer ? (
        <TxValidityTimer
            secondsLeft={secondsLeft}
            isPastDeadline={isPastDeadline}
            isBroadcasting={isBroadcasting}
            onRetry={onRetry}
            isRetryDisabled={isRetryDisabled}
            retryTestID={isFollowDeviceReview ? '@earn/follow-device-retry' : undefined}
            isCompact={isFollowDeviceReview}
        />
    ) : null;

    const header = (
        <ScreenHeader
            customContent={
                <Text variant="body-md-strong">
                    <Translation id="earn.unstakeTransactionDataReviewScreen.title" />
                </Text>
            }
            closeActionType="close"
            closeAction={closeReview}
        />
    );

    const unstakeNowButton = isReadyToUnstake && (
        <ScrollToEndOnMount>
            <Button
                isLoading={isPushing}
                isDisabled={isSolanaAccount && isPastDeadline}
                onPress={handleUnstakeNow}
                testID="@earn/unstake-now"
            >
                <Translation id="earn.unstakeTransactionDataReviewScreen.viewTransactionButton" />
            </Button>
        </ScrollToEndOnMount>
    );

    if (isFollowDeviceReview) {
        return (
            <Screen
                isScrollable={false}
                header={
                    <ScreenHeader
                        closeActionType="back"
                        closeAction={closeReview}
                        rightIcon={timer}
                    />
                }
            >
                <VStack flex={1} justifyContent="center" spacing="sp24">
                    <FollowDeviceScreenContent
                        titleTxKey="earn.unstakeTransactionDataReviewScreen.followDeviceInstructions"
                        isTxSigned={isTransactionAlreadySigned}
                    />

                    {unstakeNowButton}
                </VStack>
            </Screen>
        );
    }

    return (
        <ConfirmOnTrezorWrapper
            isManualControlEnabled
            controlRef={confirmOnTrezorRef}
            closeActionType="close"
            closeAction={closeReview}
            defaultHeader={header}
        >
            <VStack flex={1} justifyContent="space-between">
                <VStack justifyContent="center" spacing="sp24">
                    {timer}
                    {!isFollowDeviceReview && <UnstakeTransactionDataReviewStepList />}
                </VStack>

                {unstakeNowButton}
            </VStack>

            {isPending && !!pendingTxid && !!submittedAt && !!account && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={
                        <CryptoAmountFormatter
                            value={pendingAmountInBaseUnits}
                            symbol={account.symbol}
                            color="contentPrimary"
                            isBalance={false}
                            isDiscreetText={false}
                        />
                    }
                    amountLabel={
                        <Translation id="earn.unstakeTransactionDataReviewScreen.amountLabel" />
                    }
                    fee={precomposedTransaction?.fee}
                    isExploreDisabled={isExploreDisabled}
                    onExplorePress={openInBlockchain}
                    submittedAt={submittedAt}
                    title={
                        <Translation id="earn.unstakeTransactionDataReviewScreen.pendingTitle" />
                    }
                    txid={pendingTxid}
                />
            )}
        </ConfirmOnTrezorWrapper>
    );
};
