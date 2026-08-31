import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    isDeviceReviewOnlyTransaction,
    isSupportedSolStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { Button, Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { FollowDeviceScreenContent } from '@suite-native/device';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import {
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
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

import { StakingTransactionDataReviewStepList } from '../components/StakingTransactionDataReviewStepList';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { useEarnAccountLabel } from '../hooks/useEarnAccountLabel';
import { useEarnPendingTransactionSheet } from '../hooks/useEarnPendingTransactionSheet';
import { useEarnReviewAutoStart } from '../hooks/useEarnReviewAutoStart';
import { useEarnSelectedPrecomposedTransaction } from '../hooks/useEarnSelectedPrecomposedTransaction';
import { useEarnTxValidityFlow } from '../hooks/useEarnTxValidityFlow';
import { useHandleOnEarnTransactionReview } from '../hooks/useHandleOnEarnTransactionReview';
import { useNavigateAfterPushedTransaction } from '../hooks/useNavigateAfterPushedTransaction';
import { type EarnFormDraftPrefix } from '../types';
import { getAmountInBaseUnits } from '../utils/getAmountInBaseUnits';
import { getEarnPendingAmountInBaseUnits } from '../utils/getEarnPendingAmountInBaseUnits';

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

type StakingTransactionDataReviewScreenProps = StackProps<
    RootStackParamList,
    RootStackRoutes.StakingTransactionDataReview
>;

export const StakingTransactionDataReviewScreen = ({
    route,
}: StakingTransactionDataReviewScreenProps) => {
    const { accountKey, stakeType, amount } = route.params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountLabel = useEarnAccountLabel(account);

    const [isPushing, setIsPushing] = useState(false);
    const [frozenClaimableAmount, setFrozenClaimableAmount] = useState<string | null>(null);

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);
    const precomposedTransaction = useEarnSelectedPrecomposedTransaction(stakeType, accountKey);

    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();

    const isSolanaAccount = account?.networkType === 'solana';
    const isSolanaStaking = !!account && isSupportedSolStakingNetworkSymbol(account.symbol);

    const isReadyToContinue = isTransactionAlreadySigned && !!account;

    const claimableAmount = useNativeStakingSelector(state =>
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

    const { showTimer, secondsLeft, isPastDeadline, isBroadcasting, onRetry, isRetryDisabled } =
        useEarnTxValidityFlow({
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

    const onButtonPress = useCallback(async () => {
        setIsPushing(true);

        if (stakeType === 'claim') {
            setFrozenClaimableAmount(claimableAmount ?? null);
        }

        const pushedTxid = await handlePush();

        if (pushedTxid) {
            trackPushedTransaction(pushedTxid);

            return;
        }

        setIsPushing(false);
    }, [stakeType, claimableAmount, handlePush, trackPushedTransaction]);

    const isFollowDeviceReview =
        stakeType === 'unstake' && isDeviceReviewOnlyTransaction(precomposedTransaction);

    const timer = showTimer && (
        <TxValidityTimer
            secondsLeft={secondsLeft}
            isPastDeadline={isPastDeadline}
            isBroadcasting={isBroadcasting}
            onRetry={onRetry}
            isRetryDisabled={isRetryDisabled}
            retryTestID={isFollowDeviceReview ? '@earn/follow-device-retry' : undefined}
        />
    );

    const header = (
        <ScreenHeader
            customContent={
                <Text variant="body-md-strong">
                    <Translation id={screenHeaderTranslationId[stakeType]} />
                </Text>
            }
            closeActionType="close"
            closeAction={closeReview}
        />
    );

    const button = isReadyToContinue && (
        <ScrollToEndOnMount>
            <Button
                isLoading={isPushing}
                isDisabled={isSolanaAccount && isPastDeadline}
                onPress={onButtonPress}
                testID={actionButtonDataTestId[stakeType]}
            >
                <Translation id={actionButtonTranslationId[stakeType]} />
            </Button>
        </ScrollToEndOnMount>
    );

    const pendingTxModal = isPending && !!pendingTxid && !!submittedAt && !!account && (
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
            amountLabel={<Translation id={pendingTxModalTitleTranslationId[stakeType]} />}
            fee={precomposedTransaction?.fee}
            isExploreDisabled={isExploreDisabled}
            onExplorePress={openInBlockchain}
            submittedAt={submittedAt}
            title={<Translation id={pendingTxModalAmountLabelTranslationId[stakeType]} />}
            txid={pendingTxid}
        />
    );

    if (isFollowDeviceReview) {
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

                        {button}
                    </VStack>
                </Screen>

                {pendingTxModal}
            </>
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

                    {!isFollowDeviceReview && account && (
                        <StakingTransactionDataReviewStepList
                            account={account}
                            stakeType={stakeType}
                            amountInBaseUnits={pendingAmountInBaseUnits}
                        />
                    )}
                </VStack>

                {button}
            </VStack>

            {pendingTxModal}
        </ConfirmOnTrezorWrapper>
    );
};
