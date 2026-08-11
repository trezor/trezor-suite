import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { getNetwork, getNetworkDecimals } from '@suite-common/wallet-config';
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
import {
    selectClaimableAmountByAccountKey,
    useSelector as useNativeStakingSelector,
} from '@suite-native/staking';
import { ScrollToEndOnMount } from '@suite-native/scrollview';
import {
    TxValidityTimer,
    selectIsTransactionAlreadySigned,
    useTransactionDetails,
} from '@suite-native/transaction-management';
import { BigNumber } from '@trezor/utils';

import { ClaimTransactionDataReviewStepList } from '../components/ClaimTransactionDataReviewStepList';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { useEarnReviewAutoStart } from '../hooks/useEarnReviewAutoStart';
import { useEarnSelectedPrecomposedTransaction } from '../hooks/useEarnSelectedPrecomposedTransaction';
import { useEarnTxValidityFlow } from '../hooks/useEarnTxValidityFlow';
import { useHandleOnEarnTransactionReview } from '../hooks/useHandleOnEarnTransactionReview';
import { useNavigateAfterPushedTransaction } from '../hooks/useNavigateAfterPushedTransaction';
import { getSolanaPrecomposedNetAmount } from '../utils/getSolanaPrecomposedNetAmount';

export const ClaimTransactionDataReviewScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.ClaimTransactionDataReview>) => {
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();
    const { accountKey } = route.params;
    const [isPushing, setIsPushing] = useState(false);
    const [frozenClaimableAmount, setFrozenClaimableAmount] = useState<string | null>(null);

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const customAccountLabel = useSelector((state: CombinedLabelingState) =>
        account
            ? selectAccountLabel(state, account.deviceState, account.descriptor, account.symbol)
            : null,
    );

    const claimableAmount = useNativeStakingSelector(state =>
        selectClaimableAmountByAccountKey(state, accountKey),
    );

    const precomposedTransaction = useEarnSelectedPrecomposedTransaction('claim', accountKey);

    const { handleSign, handlePush, closeReview, markReviewNavigationSuccess } =
        useHandleOnEarnTransactionReview({
            accountKey,
            stakeType: 'claim',
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
            stakeType: 'claim',
            revealConfirmOnTrezorSheet,
            isPushing,
        });

    const isSolanaAccount = account?.networkType === 'solana';

    // Once signed, the user reviews the summary and taps "Claim now" to broadcast the transaction.
    const isReadyToClaim = isTransactionAlreadySigned && !!account;

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

    const handleClaimNow = useCallback(async () => {
        setIsPushing(true);
        setFrozenClaimableAmount(claimableAmount ?? null);

        const pushedTxid = await handlePush();

        if (pushedTxid) {
            trackPushedTransaction(pushedTxid);

            return;
        }

        setIsPushing(false);
    }, [claimableAmount, handlePush, trackPushedTransaction]);

    const accountLabel = account ? (customAccountLabel ?? getNetwork(account.symbol).name) : '';

    const networkDecimals = account ? (getNetworkDecimals(account.symbol) ?? 18) : 18;
    const isSolanaClaim = !!account && isSupportedSolStakingNetworkSymbol(account.symbol);
    const pendingAmountInBaseUnits =
        isSolanaClaim && precomposedTransaction
            ? getSolanaPrecomposedNetAmount(precomposedTransaction)
            : new BigNumber(frozenClaimableAmount ?? claimableAmount ?? '0')
                  .times(new BigNumber(10).pow(networkDecimals))
                  .toFixed(0);

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
                            <Translation id="earn.claimTransactionDataReviewScreen.title" />
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
                    <ClaimTransactionDataReviewStepList />
                </VStack>
                {isReadyToClaim && (
                    <ScrollToEndOnMount>
                        <Button
                            isLoading={isPushing}
                            isDisabled={isSolanaAccount && isPastDeadline}
                            onPress={handleClaimNow}
                            testID="@earn/claim-now"
                        >
                            <Translation id="earn.claimTransactionDataReviewScreen.viewTransactionButton" />
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
                        <Translation id="earn.claimTransactionDataReviewScreen.amountLabel" />
                    }
                    fee={precomposedTransaction?.fee}
                    isExploreDisabled={!explorerUrl}
                    onExplorePress={openInBlockchain}
                    submittedAt={submittedAt}
                    title={<Translation id="earn.claimTransactionDataReviewScreen.pendingTitle" />}
                    txid={pendingTxid}
                />
            )}
        </ConfirmOnTrezorWrapper>
    );
};
