import React from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Text } from '@suite-native/atoms';
import { AccountKey, TransactionType } from '@suite-common/wallet-types';
import { TransactionIcon } from '@suite-native/transactions';
import { CryptoAmountFormatter, AccountAddressFormatter } from '@suite-native/formatters';
import {
    TransactionsRootState,
    selectTransactionByTxidAndAccountKey,
    selectTransactionFirstTargetAddress,
} from '@suite-common/wallet-core';
import {
    RootStackRoutes,
    StackNavigationProps,
    RootStackParamList,
} from '@suite-native/navigation';
import { Icon } from '@trezor/icons';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';

import { Notification } from './Notification';

type TransactionNotificationProps = {
    txid: string;
    accountKey: AccountKey;
    isHiddenAutomatically?: boolean;
};

type TransactionNotificationDescriptionProps = {
    amount: string | number;
    transactionType: TransactionType;
    networkSymbol: NetworkSymbol;
    targetAddress?: string;
};

type TransactionTypeProperties = {
    title?: string;
    prefix?: string;
};

const addressContainerStyle = prepareNativeStyle(_ => ({
    maxWidth: '35%',
}));

const transactionTypeToContentMap = {
    recv: { title: 'Incoming transaction', prefix: 'from' },
    sent: { title: 'Sending transaction', prefix: 'to' },
    self: { title: 'Sending transaction', prefix: 'to' },
    joint: { title: 'Sending transaction', prefix: 'to' },
    failed: { title: 'Sending transaction', prefix: 'to' },
    unknown: { title: 'Sending transaction', prefix: 'to' },
} as const satisfies Record<TransactionType, TransactionTypeProperties>;

export const TransactionNotificationDescription = ({
    amount,
    targetAddress,
    transactionType,
    networkSymbol,
}: TransactionNotificationDescriptionProps) => {
    const { applyStyle } = useNativeStyles();
    const { prefix } = transactionTypeToContentMap[transactionType];

    return (
        <Box flexDirection="row">
            <CryptoAmountFormatter
                value={amount}
                network={networkSymbol}
                isBalance={false}
                color="gray500"
                variant="label"
            />
            <Text color="gray600" variant="label">
                {` ${prefix} `}
            </Text>
            {targetAddress && (
                <Box style={applyStyle(addressContainerStyle)}>
                    <AccountAddressFormatter
                        value={targetAddress}
                        variant="label"
                        color="gray500"
                    />
                </Box>
            )}
        </Box>
    );
};

export const TransactionNotification = ({
    txid,
    accountKey,
    isHiddenAutomatically = true,
}: TransactionNotificationProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>>();

    const transaction = useSelector((state: TransactionsRootState) =>
        selectTransactionByTxidAndAccountKey(state, txid, accountKey),
    );

    const transactionTargetAddress = useSelector((state: TransactionsRootState) =>
        selectTransactionFirstTargetAddress(state, txid, accountKey),
    );

    if (!transaction) return null;

    const { title } =
        transactionTypeToContentMap[transaction.type] ?? transactionTypeToContentMap.recv;

    const navigateToTransactionDetail = () => {
        navigation.navigate(RootStackRoutes.TransactionDetail, {
            txid: transaction.txid,
            accountKey,
        });
    };

    return (
        <Notification
            isHiddenAutomatically={isHiddenAutomatically}
            onPress={navigateToTransactionDetail}
            title={title}
            description={
                <TransactionNotificationDescription
                    transactionType={transaction.type}
                    networkSymbol={transaction.symbol}
                    amount={transaction.amount}
                    targetAddress={transactionTargetAddress}
                />
            }
            iconLeft={
                <TransactionIcon
                    transactionType={transaction.type}
                    cryptoIconName={transaction.symbol}
                    isAnimated
                />
            }
            iconRight={<Icon name="circleRight" color="gray0" />}
        />
    );
};
