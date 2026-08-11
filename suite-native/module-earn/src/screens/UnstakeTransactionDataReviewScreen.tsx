import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { getNetwork } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
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

import { UnstakeTransactionDataReviewStepList } from '../components/UnstakeTransactionDataReviewStepList';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
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

    const customAccountLabel = useSelector((state: CombinedLabelingState) =>
        account
            ? selectAccountLabel(state, account.deviceState, account.descriptor, account.symbol)
            : null,
    );

    const precomposedTransaction = useEarnSelectedPrecomposedTransaction('unstake', accountKey);

    const { handleSign, handlePush, closeReview, markReviewNavigationSuccess } =
        useHandleOnEarnTransactionReview({
            accountKey,
            stakeType: 'unstake',
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

    const accountLabel = account ? (customAccountLabel ?? getNetwork(account.symbol).name) : '';

    const pendingAmountInBaseUnits = account ? getAmountInBaseUnits(amount, account.symbol) : '0';

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
                        <Translation id="earn.unstakeTransactionDataReviewScreen.amountLabel" />
                    }
                    fee={precomposedTransaction?.fee}
                    isExploreDisabled={!explorerUrl}
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
