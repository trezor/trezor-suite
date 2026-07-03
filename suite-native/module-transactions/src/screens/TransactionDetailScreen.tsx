import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation, usePreventRemove } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { redactNumericalSubstring, useDiscreetMode } from '@suite-common/discreet-mode';
import { useFormatters } from '@suite-common/formatters';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { useInAppRating } from '@suite-native/in-app-rating';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    Screen,
    ScreenHeader,
    type StackProps,
    type StackToStackCompositeNavigationProps,
    type TransactionDetailStackParamList,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { type TypedTokenTransfer } from '@suite-native/tokens';
import { useTransactionDetails } from '@suite-native/transaction-management';
import {
    InstantStakeBanner,
    TransactionName,
    getUnstakeTxAmount,
} from '@suite-native/transactions';

import { TransactionDetailData } from '../components/TransactionDetailData';
import { TransactionDetailHeader } from '../components/TransactionDetailHeader';

type TransactionDetailNavigation = StackToStackCompositeNavigationProps<
    TransactionDetailStackParamList,
    TransactionDetailStackRoutes.TransactionDetail,
    RootStackParamList
>;

export const TransactionDetailScreen = ({
    route,
}: StackProps<TransactionDetailStackParamList, TransactionDetailStackRoutes.TransactionDetail>) => {
    const { askForRating } = useInAppRating();
    const navigation = useNavigation<TransactionDetailNavigation>();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const { CryptoAmountFormatter: cryptoAmountFormatter } = useFormatters();
    const { isDiscreetMode } = useDiscreetMode();
    const { txid, accountKey, tokenContract, closeActionType = 'back', source } = route.params;

    const { transaction, isPending, tokenTransfer, openInBlockchain } = useTransactionDetails({
        accountKey,
        txid,
        tokenContract,
    });

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    // A cancel is only possible for a still-pending EVM transaction that carries RBF params
    // (populated only for pending, replaceable, outgoing EVM txs).
    const canCancelTransaction =
        isPending &&
        transaction?.rbfParams?.type === 'ethereum' &&
        !!account &&
        hasNetworkFeatures(account, 'rbf');

    const handleCancelTransaction = () => {
        navigation.navigate(TransactionDetailStackRoutes.CancelTransactionReview, {
            accountKey,
            txid,
        });
    };

    usePreventRemove(source === 'send', ({ data }) => {
        navigation.dispatch(data.action);
        askForRating();
    });

    useEffect(() => {
        if (transaction) {
            analytics.report({
                type: events.transactionDetailEvent.name,
                payload: {
                    assetSymbol: transaction.symbol,
                    tokenSymbol: tokenTransfer?.symbol,
                    tokenAddress: tokenTransfer?.contract,
                },
            });
        }
    }, [transaction, tokenTransfer, analytics]);

    if (!transaction) return null;

    const unstakeAmount = getUnstakeTxAmount(transaction);
    const isUnstakeTransaction = unstakeAmount !== undefined;
    const formattedUnstakeAmount = isUnstakeTransaction
        ? cryptoAmountFormatter.format(unstakeAmount, {
              symbol: transaction.symbol,
              isBalance: false,
              isEllipsisAppended: false,
          })
        : '';
    const displayedUnstakeAmount = isDiscreetMode
        ? redactNumericalSubstring(formattedUnstakeAmount)
        : formattedUnstakeAmount;

    const handleOpenBlockchain = () => {
        analytics.report({
            type: events.transactionDetailExploreInBlockchainEvent.name,
        });
        openInBlockchain();
    };

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType={closeActionType}
                    customContent={
                        <HStack spacing="sp8" alignItems="center" justifyContent="center">
                            {!isUnstakeTransaction && (
                                <CryptoIconWithNetwork
                                    symbol={transaction.symbol}
                                    contractAddress={tokenTransfer?.contract}
                                />
                            )}
                            <Text variant="body-md-strong">
                                {isUnstakeTransaction ? (
                                    <Translation
                                        id="transactions.detail.unstakeHeader"
                                        values={{ amount: displayedUnstakeAmount }}
                                    />
                                ) : (
                                    <Translation
                                        id="transactions.detail.header"
                                        values={{
                                            transactionType: () => (
                                                <TransactionName
                                                    key={transaction.txid}
                                                    transaction={transaction}
                                                    isPending={isPending}
                                                    variant="body-md-strong"
                                                />
                                            ),
                                        }}
                                    />
                                )}
                            </Text>
                        </HStack>
                    }
                />
            }
        >
            <VStack spacing="sp24">
                <VStack spacing="sp24">
                    <TransactionDetailHeader
                        transaction={transaction}
                        tokenTransfer={tokenTransfer as TypedTokenTransfer}
                    />
                    {isUnstakeTransaction && (
                        <InstantStakeBanner accountKey={accountKey} transaction={transaction} />
                    )}
                    <TransactionDetailData
                        transaction={transaction}
                        accountKey={accountKey}
                        tokenTransfer={tokenTransfer as TypedTokenTransfer}
                    />
                </VStack>
                <VStack spacing="sp12">
                    {canCancelTransaction && (
                        <Button
                            intent="critical"
                            priority="secondary"
                            testID="@transactions/detail/cancel-transaction-button"
                            onPress={handleCancelTransaction}
                        >
                            <Translation id="transactions.cancel.button" />
                        </Button>
                    )}
                    <Button
                        iconRight="arrowUpRight"
                        onPress={handleOpenBlockchain}
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation id="transactions.detail.exploreButton" />
                    </Button>
                </VStack>
            </VStack>
        </Screen>
    );
};
