import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { getNetworkDecimals } from '@suite-common/wallet-config';
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
    selectClaimableAmountByAccountKey,
    useSelector as useNativeStakingSelector,
} from '@suite-native/staking';
import {
    TxValidityTimer,
    selectIsTransactionAlreadySigned,
} from '@suite-native/transaction-management';
import { BigNumber } from '@trezor/utils';

import { ClaimTransactionDataReviewStepList } from '../components/ClaimTransactionDataReviewStepList';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { useEarnAccountLabel } from '../hooks/useEarnAccountLabel';
import { useEarnPendingTransactionSheet } from '../hooks/useEarnPendingTransactionSheet';
import { useEarnReviewAutoStart } from '../hooks/useEarnReviewAutoStart';
import { useEarnSelectedPrecomposedTransaction } from '../hooks/useEarnSelectedPrecomposedTransaction';
import { useEarnTxValidityFlow } from '../hooks/useEarnTxValidityFlow';
import { useHandleOnEarnTransactionReview } from '../hooks/useHandleOnEarnTransactionReview';
import { useNavigateAfterPushedTransaction } from '../hooks/useNavigateAfterPushedTransaction';
import { getEarnPendingAmountInBaseUnits } from '../utils/getEarnPendingAmountInBaseUnits';

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

    const accountLabel = useEarnAccountLabel(account);

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

    const { pendingBottomSheetRef, isExploreDisabled, openInBlockchain } =
        useEarnPendingTransactionSheet({ accountKey, isPending, pendingTxid });

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

    const networkDecimals = account ? (getNetworkDecimals(account.symbol) ?? 18) : 18;
    const isSolanaClaim = !!account && isSupportedSolStakingNetworkSymbol(account.symbol);

    const pendingAmountInBaseUnits = getEarnPendingAmountInBaseUnits({
        fallbackAmountInBaseUnits: new BigNumber(frozenClaimableAmount ?? claimableAmount ?? '0')
            .times(new BigNumber(10).pow(networkDecimals))
            .toFixed(0),
        isSolanaStaking: isSolanaClaim,
        precomposedTransaction,
    });

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
                        <Translation id="earn.claimTransactionDataReviewScreen.amountLabel" />
                    }
                    fee={precomposedTransaction?.fee}
                    isExploreDisabled={isExploreDisabled}
                    onExplorePress={openInBlockchain}
                    submittedAt={submittedAt}
                    title={<Translation id="earn.claimTransactionDataReviewScreen.pendingTitle" />}
                    txid={pendingTxid}
                />
            )}
        </ConfirmOnTrezorWrapper>
    );
};
