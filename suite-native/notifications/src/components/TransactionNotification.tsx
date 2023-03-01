import React from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { AccountKey, TransactionType } from '@suite-common/wallet-types';
import { TransactionIcon } from '@suite-native/transactions';
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

import { Notification } from './Notification';
import { TransactionNotificationDescription } from './TransactionNotificationDescription';

type TransactionNotificationProps = {
    txid: string;
    accountKey: AccountKey;
    isHiddenAutomatically?: boolean;
};

type TransactionTypeProperties = {
    title?: string;
    prefix?: string;
};

const transactionTypeToContentMap = {
    recv: { title: 'Incoming transaction', prefix: 'from' },
    sent: { title: 'Sending transaction', prefix: 'to' },
    self: { title: 'Sending transaction', prefix: 'to' },
    joint: { title: 'Sending transaction', prefix: 'to' },
    failed: { title: 'Sending transaction', prefix: 'to' },
    unknown: { title: 'Sending transaction', prefix: 'to' },
} as const satisfies Record<TransactionType, TransactionTypeProperties>;

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

    const { title, prefix } = transactionTypeToContentMap[transaction.type];

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
                    networkSymbol={transaction.symbol}
                    amount={transaction.amount}
                    prefix={prefix}
                    targetAddress={transactionTargetAddress}
                />
            }
            iconLeft={
                <TransactionIcon
                    transactionType={transaction.type}
                    cryptoIconName={transaction.symbol}
                    isAnimated
                    iconColor="iconAlertYellow"
                    backgroundColor="backgroundSurfaceElevation1"
                />
            }
            iconRight={<Icon name="circleRight" />}
        />
    );
};
