import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { isSupportedSolStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { Button, Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    type RootStackRoutes,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';
import { ScrollToEndOnMount } from '@suite-native/scrollview';
import {
    TxValidityTimer,
    selectIsTransactionAlreadySigned,
} from '@suite-native/transaction-management';

import { EarnTransactionDataReviewStepList } from '../components/EarnTransactionDataReviewStepList';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { useEarnAccountLabel } from '../hooks/useEarnAccountLabel';
import { useEarnPendingTransactionSheet } from '../hooks/useEarnPendingTransactionSheet';
import { useEarnReviewAutoStart } from '../hooks/useEarnReviewAutoStart';
import { useEarnSelectedPrecomposedTransaction } from '../hooks/useEarnSelectedPrecomposedTransaction';
import { useEarnTxValidityFlow } from '../hooks/useEarnTxValidityFlow';
import { useHandleOnEarnTransactionReview } from '../hooks/useHandleOnEarnTransactionReview';
import { useNavigateAfterPushedTransaction } from '../hooks/useNavigateAfterPushedTransaction';
import { getAmountInBaseUnits } from '../utils/getAmountInBaseUnits';
import { getEarnPendingAmountInBaseUnits } from '../utils/getEarnPendingAmountInBaseUnits';

export const EarnTransactionDataReviewScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.EarnTransactionDataReview>) => {
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();
    const { accountKey, amount } = route.params;
    const [isPushing, setIsPushing] = useState(false);

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const accountLabel = useEarnAccountLabel(account);

    const precomposedTransaction = useEarnSelectedPrecomposedTransaction('stake', accountKey);

    const isSolanaStake = !!account && isSupportedSolStakingNetworkSymbol(account.symbol);

    const pendingAmountInBaseUnits = getEarnPendingAmountInBaseUnits({
        fallbackAmountInBaseUnits: account ? getAmountInBaseUnits(amount, account.symbol) : '0',
        isSolanaStaking: isSolanaStake,
        precomposedTransaction,
    });

    const { handleSign, handlePush, closeReview, markReviewNavigationSuccess } =
        useHandleOnEarnTransactionReview({
            accountKey,
            stakeType: 'stake',
        });

    const { trackPushedTransaction, pendingTxid, isPending, submittedAt } =
        useNavigateAfterPushedTransaction({
            accountKey,
            amountInBaseUnits: pendingAmountInBaseUnits,
            markReviewNavigationSuccess,
            stakeType: 'stake',
        });

    const { pendingBottomSheetRef, isExploreDisabled, openInBlockchain } =
        useEarnPendingTransactionSheet({ accountKey, isPending, pendingTxid });

    const { showTimer, secondsLeft, isPastDeadline, isBroadcasting, onRetry, isRetryDisabled } =
        useEarnTxValidityFlow({
            accountKey,
            stakeType: 'stake',
            revealConfirmOnTrezorSheet,
            isPushing,
        });

    const isSolanaAccount = account?.networkType === 'solana';

    const isReadyToStake = isTransactionAlreadySigned && !!account;

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

    const handleStakeNow = useCallback(async () => {
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
                            <Translation id="earn.earnTransactionDataReviewScreen.title" />
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
                    {account && (
                        <EarnTransactionDataReviewStepList
                            accountKey={accountKey}
                            amount={amount}
                            accountSymbol={account.symbol}
                        />
                    )}
                </VStack>
                {isReadyToStake && (
                    <ScrollToEndOnMount>
                        <Button
                            isLoading={isPushing}
                            isDisabled={isSolanaAccount && isPastDeadline}
                            onPress={handleStakeNow}
                            testID="@earn/stake-now"
                        >
                            <Translation id="earn.earnTransactionDataReviewScreen.viewTransactionButton" />
                        </Button>
                    </ScrollToEndOnMount>
                )}
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
                        <Translation id="earn.earnTransactionDataReviewScreen.amountLabel" />
                    }
                    fee={precomposedTransaction?.fee}
                    isExploreDisabled={isExploreDisabled}
                    onExplorePress={openInBlockchain}
                    submittedAt={submittedAt}
                    title={<Translation id="earn.earnTransactionDataReviewScreen.pendingTitle" />}
                    txid={pendingTxid}
                />
            )}
        </ConfirmOnTrezorWrapper>
    );
};
