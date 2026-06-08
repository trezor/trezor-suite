import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { CommonActions } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button, Card, LottieAnimation, Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    type StackProps,
    TransactionDetailStackRoutes,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import {
    type TransactionReviewOutputsState,
    selectIsTransactionAlreadySigned,
    selectIsTransactionReviewInProgress,
    sendArrowsLottie,
} from '@suite-native/transaction-management';

import { EarnTransactionDataReviewStepList } from '../components/EarnTransactionDataReviewStepList';
import { useHandleOnEarnTransactionReview } from '../hooks/useHandleOnEarnTransactionReview';
import { getEarnPostSignParentRoute } from '../utils';

const navigateToStakedTransactionAction = ({
    accountKey,
    symbol,
    txid,
}: {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    txid: string;
}) =>
    CommonActions.reset({
        index: 2,
        routes: [
            {
                name: RootStackRoutes.AppTabs,
                params: { screen: AppTabsRoutes.EarnStack },
            },
            getEarnPostSignParentRoute(symbol, accountKey),
            {
                name: RootStackRoutes.TransactionDetailStack,
                params: {
                    screen: TransactionDetailStackRoutes.TransactionDetail,
                    params: {
                        accountKey,
                        txid,
                        closeActionType: 'close',
                    },
                },
            },
        ],
    });

export const EarnTransactionDataReviewScreen = ({
    route,
    navigation,
}: StackProps<RootStackParamList, RootStackRoutes.EarnTransactionDataReview>) => {
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();
    const { accountKey, amount } = route.params;
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const [isPushing, setIsPushing] = useState(false);

    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'stake', accountKey),
    );

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const { handleSign, handlePush } = useHandleOnEarnTransactionReview({
        accountKey,
        stakeType: 'stake',
    });

    const isReadyToStake = isTransactionAlreadySigned && !!account;

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

    const handleStakeNow = useCallback(async () => {
        setIsPushing(true);

        const txid = await handlePush();

        if (txid && account) {
            navigation.dispatch(
                navigateToStakedTransactionAction({ accountKey, symbol: account.symbol, txid }),
            );

            return;
        }

        setIsPushing(false);
    }, [handlePush, account, accountKey, navigation]);

    return (
        <ConfirmOnTrezorWrapper
            isManualControlEnabled
            controlRef={confirmOnTrezorRef}
            closeActionType="close"
            defaultHeader={
                <ScreenHeader
                    customContent={
                        <Text variant="body-md-strong">
                            <Translation id="earn.earnTransactionDataReviewScreen.title" />
                        </Text>
                    }
                    closeActionType="close"
                    closeAction={navigateToInitialScreen}
                />
            }
        >
            <VStack flex={1} justifyContent="space-between">
                <VStack justifyContent="center" spacing="sp24">
                    {account && (
                        <EarnTransactionDataReviewStepList
                            accountKey={accountKey}
                            amount={amount}
                            accountSymbol={account.symbol}
                            onSign={handleSign}
                        />
                    )}
                </VStack>
                {isReadyToStake && (
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
                                <Translation id="earn.earnTransactionDataReviewScreen.successMessage" />
                            </Text>
                        </VStack>
                        <Button
                            isLoading={isPushing}
                            onPress={handleStakeNow}
                            testID="@earn/stake-now"
                        >
                            <Translation id="earn.earnTransactionDataReviewScreen.viewTransactionButton" />
                        </Button>
                    </Card>
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};
