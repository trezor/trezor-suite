import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { getNetwork } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { isSupportedSolStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { selectAccountLabel } from '@suite-native/accounts';
import { Button, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { type CombinedLabelingState } from '@suite-native/labeling';
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
    useTransactionDetails,
} from '@suite-native/transaction-management';

import { EarnTransactionDataReviewStepList } from '../components/EarnTransactionDataReviewStepList';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { useEarnReviewAutoStart } from '../hooks/useEarnReviewAutoStart';
import { useEarnSelectedPrecomposedTransaction } from '../hooks/useEarnSelectedPrecomposedTransaction';
import { useEarnTxValidityFlow } from '../hooks/useEarnTxValidityFlow';
import { useHandleOnEarnTransactionReview } from '../hooks/useHandleOnEarnTransactionReview';
import { useNavigateAfterPushedTransaction } from '../hooks/useNavigateAfterPushedTransaction';
import { getAmountInBaseUnits } from '../utils/getAmountInBaseUnits';
import { getSolanaPrecomposedNetAmount } from '../utils/getSolanaPrecomposedNetAmount';

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

    const customAccountLabel = useSelector((state: CombinedLabelingState) =>
        account
            ? selectAccountLabel(state, account.deviceState, account.descriptor, account.symbol)
            : null,
    );

    const precomposedTransaction = useEarnSelectedPrecomposedTransaction('stake', accountKey);

    const { handleSign, handlePush, closeReview, markReviewNavigationSuccess } =
        useHandleOnEarnTransactionReview({
            accountKey,
            stakeType: 'stake',
        });

    const { trackPushedTransaction, pendingTxid, isPending, submittedAt } =
        useNavigateAfterPushedTransaction({
            accountKey,
            markReviewNavigationSuccess,
        });

    const { bottomSheetRef: pendingBottomSheetRef, openModal: openPendingBottomSheet } =
        useBottomSheetModal();

    useEffect(() => {
        if (isPending) {
            openPendingBottomSheet();
        }
    }, [isPending, openPendingBottomSheet]);

    const { explorerUrl, openInBlockchain } = useTransactionDetails({
        accountKey,
        txid: pendingTxid ?? null,
    });

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

    const accountLabel = account ? (customAccountLabel ?? getNetwork(account.symbol).name) : '';

    const isSolanaStake = !!account && isSupportedSolStakingNetworkSymbol(account.symbol);

    let pendingAmountInBaseUnits = '0';

    if (isSolanaStake && precomposedTransaction) {
        pendingAmountInBaseUnits = getSolanaPrecomposedNetAmount(precomposedTransaction);
    } else if (account) {
        pendingAmountInBaseUnits = getAmountInBaseUnits(amount, account.symbol);
    }

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

            {isPending && pendingTxid && submittedAt && account && (
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
                    isExploreDisabled={!explorerUrl}
                    onExplorePress={openInBlockchain}
                    submittedAt={submittedAt}
                    title={<Translation id="earn.earnTransactionDataReviewScreen.pendingTitle" />}
                    txid={pendingTxid}
                />
            )}
        </ConfirmOnTrezorWrapper>
    );
};
