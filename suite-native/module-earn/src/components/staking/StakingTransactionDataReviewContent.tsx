import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type StakeRootState,
    isSupportedSolStakingNetworkSymbol,
    selectAccountByKey,
    selectClaimableAmountByAccountKey,
} from '@suite-common/wallet-core';
import { type AccountKey, type TransactionReviewStatefulOutput } from '@suite-common/wallet-types';
import { isDeviceReviewOnlyTransaction } from '@suite-common/wallet-utils';
import { Button, VStack } from '@suite-native/atoms';
import { useConfirmOnTrezorController } from '@suite-native/confirm-on-trezor';
import { FollowDeviceScreenContent } from '@suite-native/device';
import { ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { ScrollToEndOnMount } from '@suite-native/scrollview';
import {
    type TransactionReviewOutputsState,
    selectIsTransactionAlreadySigned,
    selectReviewSummaryOutput,
} from '@suite-native/transaction-management';
import { TransactionReviewScreen, TxValidityTimer } from '@suite-native/transaction-review';

import { useEarnAccountLabel } from '../../hooks/earn/useEarnAccountLabel';
import { useEarnPendingTransactionSheet } from '../../hooks/earn/useEarnPendingTransactionSheet';
import { useEarnReviewAutoStart } from '../../hooks/earn/useEarnReviewAutoStart';
import { useEarnSelectedPrecomposedTransaction } from '../../hooks/earn/useEarnSelectedPrecomposedTransaction';
import { useEarnTxValidityFlow } from '../../hooks/earn/useEarnTxValidityFlow';
import { useHandleOnEarnTransactionReview } from '../../hooks/earn/useHandleOnEarnTransactionReview';
import { useNavigateAfterPushedTransaction } from '../../hooks/staking/useNavigateAfterPushedTransaction';
import { useStakingTransactionReviewOutputs } from '../../hooks/staking/useStakingTransactionReviewOutputs';
import { type EarnFormDraftPrefix } from '../../types';
import { getEarnPendingAmountInBaseUnits } from '../../utils/earn/getEarnPendingAmountInBaseUnits';
import { getAmountInBaseUnits } from '../../utils/staking/getAmountInBaseUnits';
import { StakingTransactionReviewSummaryCard } from '../earn/StakingTransactionReviewSummaryCard';
import { YieldPendingTransactionModal } from '../yield/YieldPendingTransactionModal';

const screenHeaderTranslationId: Record<EarnFormDraftPrefix, TxKeyPath> = {
    stake: 'earn.earnTransactionDataReviewScreen.title',
    unstake: 'earn.unstakeTransactionDataReviewScreen.title',
    claim: 'earn.claimTransactionDataReviewScreen.title',
};

const actionButtonTranslationId: Record<EarnFormDraftPrefix, TxKeyPath> = {
    stake: 'earn.earnTransactionDataReviewScreen.viewTransactionButton',
    unstake: 'earn.unstakeTransactionDataReviewScreen.viewTransactionButton',
    claim: 'earn.claimTransactionDataReviewScreen.viewTransactionButton',
};

const actionButtonDataTestId: Record<EarnFormDraftPrefix, string> = {
    stake: '@earn/stake-now',
    unstake: '@earn/unstake-now',
    claim: '@earn/claim-now',
};

const pendingTxModalTitleTranslationId: Record<EarnFormDraftPrefix, TxKeyPath> = {
    stake: 'earn.earnTransactionDataReviewScreen.pendingTitle',
    unstake: 'earn.unstakeTransactionDataReviewScreen.pendingTitle',
    claim: 'earn.claimTransactionDataReviewScreen.pendingTitle',
};

const pendingTxModalAmountLabelTranslationId: Record<EarnFormDraftPrefix, TxKeyPath> = {
    stake: 'earn.earnTransactionDataReviewScreen.amountLabel',
    unstake: 'earn.unstakeTransactionDataReviewScreen.amountLabel',
    claim: 'earn.claimTransactionDataReviewScreen.amountLabel',
};

type StakingTransactionDataReviewContentProps = {
    accountKey: AccountKey;
    amount?: string;
    stakeType: EarnFormDraftPrefix;
};

export const StakingTransactionDataReviewContent = ({
    accountKey,
    amount,
    stakeType,
}: StakingTransactionDataReviewContentProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountLabel = useEarnAccountLabel(account);

    const stakingTransactionReviewOutputs = useStakingTransactionReviewOutputs({
        account,
        stakeType,
    });

    const [isPushing, setIsPushing] = useState(false);
    const [frozenClaimableAmount, setFrozenClaimableAmount] = useState<string | null>(null);

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);
    const precomposedTransaction = useEarnSelectedPrecomposedTransaction(stakeType, accountKey);

    const summaryOutput = useSelector((state: TransactionReviewOutputsState) =>
        selectReviewSummaryOutput(state, stakeType, accountKey),
    );

    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();

    const isSolanaStaking = !!account && isSupportedSolStakingNetworkSymbol(account.symbol);

    const isReadyToContinue = isTransactionAlreadySigned && !!account;

    const claimableAmount = useSelector((state: StakeRootState) =>
        stakeType === 'claim' ? selectClaimableAmountByAccountKey(state, accountKey) : undefined,
    );

    const pendingAmountInBaseUnits = useMemo(() => {
        if (!account) return '0';

        switch (stakeType) {
            case 'stake':
                return getEarnPendingAmountInBaseUnits({
                    fallbackAmountInBaseUnits: amount
                        ? getAmountInBaseUnits(amount, account.symbol)
                        : '0',
                    isSolanaStaking,
                    precomposedTransaction,
                });
            case 'unstake':
                return amount ? getAmountInBaseUnits(amount, account.symbol) : '0';
            case 'claim':
                return getEarnPendingAmountInBaseUnits({
                    fallbackAmountInBaseUnits: getAmountInBaseUnits(
                        frozenClaimableAmount ?? claimableAmount ?? '0',
                        account.symbol,
                    ),
                    isSolanaStaking,
                    precomposedTransaction,
                });
        }
    }, [
        account,
        amount,
        stakeType,
        isSolanaStaking,
        precomposedTransaction,
        frozenClaimableAmount,
        claimableAmount,
    ]);

    const { handleSign, handlePush, closeReview, markReviewNavigationSuccess } =
        useHandleOnEarnTransactionReview({ accountKey, stakeType });

    const { trackPushedTransaction, pendingTxid, isPending, submittedAt } =
        useNavigateAfterPushedTransaction({
            accountKey,
            amountInBaseUnits: pendingAmountInBaseUnits,
            markReviewNavigationSuccess,
            stakeType,
        });

    const { pendingBottomSheetRef, isExploreDisabled, openInBlockchain } =
        useEarnPendingTransactionSheet({ accountKey, isPending, pendingTxid });

    const txValidityFlow = useEarnTxValidityFlow({
        accountKey,
        stakeType,
        revealConfirmOnTrezorSheet,
        isPushing,
    });

    useEarnReviewAutoStart({
        handleSign,
        isSigned: isTransactionAlreadySigned,
        canStart: !!precomposedTransaction,
        onDeviceReviewReady: revealConfirmOnTrezorSheet,
        onSignFailed: closeSheet,
    });

    useEffect(() => {
        if (!isTransactionAlreadySigned) return;
        closeSheet();
    }, [closeSheet, isTransactionAlreadySigned]);

    const onSendTransaction = useCallback(async () => {
        setIsPushing(true);

        if (stakeType === 'claim') {
            setFrozenClaimableAmount(claimableAmount ?? null);
        }

        const pushedTxid = await handlePush();

        if (pushedTxid) {
            trackPushedTransaction(pushedTxid);

            return pushedTxid;
        }

        setIsPushing(false);

        return undefined;
    }, [stakeType, claimableAmount, handlePush, trackPushedTransaction]);

    const isFollowDeviceReview =
        stakeType === 'unstake' && isDeviceReviewOnlyTransaction(precomposedTransaction);

    // The Trezor reveals the staking step first, then the summary. The summary
    // card only unlocks once every device output has been confirmed, which is
    // exactly when selectReviewSummaryOutput exposes a state.
    const isSummaryActive = !!summaryOutput?.state;

    // The whole staking intent is confirmed as one step; the card describes the
    // transaction data the device is displaying.
    const reviewOutputs: TransactionReviewStatefulOutput[] = [
        {
            type: 'data',
            value: stakeType,
            state: isTransactionAlreadySigned || isSummaryActive ? 'success' : 'active',
        },
    ];

    const pendingTxModal = isPending && !!pendingTxid && !!submittedAt && !!account && (
        <YieldPendingTransactionModal
            ref={pendingBottomSheetRef}
            accountLabel={accountLabel}
            accountSymbol={account.symbol}
            amount={
                <ExactCryptoAmountFormatter
                    value={pendingAmountInBaseUnits}
                    symbol={account.symbol}
                    color="contentPrimary"
                    isBalance={false}
                    isDiscreetText={false}
                />
            }
            amountLabel={<Translation id={pendingTxModalAmountLabelTranslationId[stakeType]} />}
            fee={precomposedTransaction?.fee}
            isExploreDisabled={isExploreDisabled}
            onExplorePress={openInBlockchain}
            submittedAt={submittedAt}
            title={<Translation id={pendingTxModalTitleTranslationId[stakeType]} />}
            txid={pendingTxid}
        />
    );

    if (isFollowDeviceReview) {
        const timer = txValidityFlow.showTimer && (
            <TxValidityTimer
                secondsLeft={txValidityFlow.secondsLeft}
                isPastDeadline={txValidityFlow.isPastDeadline}
                isBroadcasting={txValidityFlow.isBroadcasting}
                onRetry={txValidityFlow.onRetry}
                isRetryDisabled={txValidityFlow.isRetryDisabled}
                retryTestID="@earn/follow-device-retry"
            />
        );

        return (
            <>
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

                        {isReadyToContinue && (
                            <ScrollToEndOnMount>
                                <Button
                                    isLoading={isPushing}
                                    isDisabled={txValidityFlow.isPastDeadline}
                                    onPress={onSendTransaction}
                                    testID={actionButtonDataTestId[stakeType]}
                                >
                                    <Translation id={actionButtonTranslationId[stakeType]} />
                                </Button>
                            </ScrollToEndOnMount>
                        )}
                    </VStack>
                </Screen>

                {pendingTxModal}
            </>
        );
    }

    const sheetController = { closeSheet, confirmOnTrezorRef, revealConfirmOnTrezorSheet };

    return (
        <TransactionReviewScreen
            accountKey={accountKey}
            reviewOutputs={reviewOutputs}
            titleTranslationId={screenHeaderTranslationId[stakeType]}
            summaryTranslationId="transactionManagement.review.outputs.summary.label"
            sendButtonTranslationId={actionButtonTranslationId[stakeType]}
            sendButtonTestId={actionButtonDataTestId[stakeType]}
            isTransactionAlreadySigned={isTransactionAlreadySigned}
            onSendTransaction={onSendTransaction}
            renderSummaryItem={({ onLayout }) => (
                <StakingTransactionReviewSummaryCard
                    accountKey={accountKey}
                    stakeType={stakeType}
                    amount={pendingAmountInBaseUnits}
                    fee={summaryOutput?.fee ?? precomposedTransaction?.fee ?? '0'}
                    outputState={summaryOutput?.state}
                    onLayout={onLayout}
                />
            )}
            txValidityFlow={txValidityFlow}
            sheetController={sheetController}
            isManualSheetControlEnabled
            isBackInterceptorEnabled={false}
            closeActionType="close"
            closeAction={closeReview}
            outputTitleOverride={stakingTransactionReviewOutputs.getOutputTitle}
            outputOverride={stakingTransactionReviewOutputs.getOutputValue}
        >
            {pendingTxModal}
        </TransactionReviewScreen>
    );
};
