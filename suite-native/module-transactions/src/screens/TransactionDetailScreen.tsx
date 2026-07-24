import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation, usePreventRemove } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import {
    type AccountsRootState,
    createTargets,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Button, HStack, VStack } from '@suite-native/atoms';
import { useInAppRating } from '@suite-native/in-app-rating';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type StackProps,
    type TransactionDetailStackParamList,
    type TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { useTransactionDetails } from '@suite-native/transaction-management';
import {
    InstantStakeBanner,
    getUnstakeTxAmount,
    useFetchMissingTransactionFiatRates,
} from '@suite-native/transactions';

import { TransactionDetailData } from '../components/TransactionDetailData';
import { TransactionDetailHeader } from '../components/TransactionDetailHeader';
import { TransactionDetailTitle } from '../components/TransactionDetailTitle';

export const TransactionDetailScreen = ({
    route,
}: StackProps<TransactionDetailStackParamList, TransactionDetailStackRoutes.TransactionDetail>) => {
    const { askForRating } = useInAppRating();
    const navigation = useNavigation();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const { txid, accountKey, tokenContract, closeActionType = 'back', source } = route.params;

    const { transaction, isPending, tokenTransfer, openInBlockchain } = useTransactionDetails({
        accountKey,
        txid,
        tokenContract,
    });

    usePreventRemove(source === 'send', ({ data }) => {
        navigation.dispatch(data.action);
        askForRating();
    });

    useFetchMissingTransactionFiatRates({ accountKey, isEnabled: !!transaction });
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

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

    const isUnstakeTransaction = getUnstakeTxAmount(transaction) !== undefined;

    const handleOpenBlockchain = () => {
        analytics.report({
            type: events.transactionDetailExploreInBlockchainEvent.name,
        });
        openInBlockchain();
    };

    const allOutputs = account !== null ? createTargets({ transaction, account }) : [];

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType={closeActionType}
                    customContent={
                        <HStack spacing="sp8" alignItems="center" justifyContent="center">
                            <TransactionDetailTitle
                                transaction={transaction}
                                isPending={isPending}
                                tokenTransfer={tokenTransfer}
                            />
                        </HStack>
                    }
                />
            }
        >
            <VStack spacing="sp24">
                <VStack spacing="sp24">
                    <TransactionDetailHeader
                        transaction={transaction}
                        tokenTransfer={tokenTransfer}
                        allOutputs={allOutputs}
                    />
                    {isUnstakeTransaction && (
                        <InstantStakeBanner accountKey={accountKey} transaction={transaction} />
                    )}
                    <TransactionDetailData
                        transaction={transaction}
                        accountKey={accountKey}
                        tokenTransfer={tokenTransfer}
                    />
                </VStack>
                <Button
                    iconRight="arrowUpRight"
                    onPress={handleOpenBlockchain}
                    intent="neutral"
                    priority="secondary"
                >
                    <Translation id="transactions.detail.exploreButton" />
                </Button>
            </VStack>
        </Screen>
    );
};
