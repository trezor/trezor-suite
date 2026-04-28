import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { CommonActions, useFocusEffect } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
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
    selectIsReceiveAddressOutputConfirmed,
    selectIsTransactionAlreadySigned,
    selectIsTransactionReviewInProgress,
    sendArrowsLottie,
} from '@suite-native/transaction-management';

import { EarnTransactionDataReviewStepList } from '../components/EarnTransactionDataReviewStepList';
import { isMobileSupportedStakingNetwork } from '../constants';
import { useStakingDetailNavigation } from '../hooks/useStakingDetailNavigation';

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
            {
                name: isMobileSupportedStakingNetwork(symbol)
                    ? RootStackRoutes.StakingManagement
                    : RootStackRoutes.StakingDetail,
                params: { accountKey },
            },
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
    const { navigateToStakingDetail } = useStakingDetailNavigation();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const [txid, setTxid] = useState<string>('');

    const isAddressConfirmed = useSelector((state: TransactionReviewOutputsState) =>
        selectIsReceiveAddressOutputConfirmed(state, 'stake', accountKey),
    );

    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'stake', accountKey),
    );

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const isTransactionProcessedByBackend = !!useSelector((state: TransactionsRootState) =>
        selectTransactionByAccountKeyAndTxid(state, accountKey, txid),
    );

    const showSignSuccessMessage = isTransactionAlreadySigned && !!account;

    useFocusEffect(
        useCallback(() => {
            if (isAddressConfirmed && account) {
                navigateToStakingDetail({ accountKey, symbol: account.symbol });
            }
        }, [account, accountKey, isAddressConfirmed, navigateToStakingDetail]),
    );

    useEffect(() => {
        if (isTransactionReviewInProgress) {
            revealConfirmOnTrezorSheet();
        }
    }, [isTransactionReviewInProgress, revealConfirmOnTrezorSheet]);

    useEffect(() => {
        if (showSignSuccessMessage) {
            closeSheet();
        }
    }, [closeSheet, showSignSuccessMessage]);

    const handleViewTransaction = useCallback(() => {
        if (!account) return;
        navigation.dispatch(
            navigateToStakedTransactionAction({ accountKey, symbol: account.symbol, txid }),
        );
    }, [account, accountKey, navigation, txid]);

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
                            onTransactionSubmitted={setTxid}
                        />
                    )}
                </VStack>
                {txid && (
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
                            isLoading={!isTransactionProcessedByBackend}
                            onPress={handleViewTransaction}
                        >
                            <Translation id="earn.earnTransactionDataReviewScreen.viewTransactionButton" />
                        </Button>
                    </Card>
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};
