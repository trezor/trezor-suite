import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { TransactionType } from '@suite-common/wallet-types';
import { TransactionIcon } from '@suite-native/transactions';
import {
    TransactionsRootState,
    selectTransactionFirstTargetAddress,
    AccountsRootState,
    selectAccountKeyByDescriptorAndNetworkSymbol,
} from '@suite-common/wallet-core';
import {
    RootStackRoutes,
    StackNavigationProps,
    RootStackParamList,
} from '@suite-native/navigation';
import { Icon } from '@trezor/icons';
import {
    EventNotification,
    notificationsActions,
    TransactionEventNotification,
} from '@suite-common/toast-notifications';

import { Notification } from './Notification';
import { TransactionNotificationDescription } from './TransactionNotificationDescription';

type TransactionNotificationProps = {
    notification: TransactionEventNotification;
    isHiddenAutomatically?: boolean;
};

type TransactionTypeProperties = {
    title?: string;
    prefix?: string;
    transactionType: TransactionType;
};

const transactionTypeToContentMap = {
    'tx-received': { title: 'Incoming transaction', prefix: 'from', transactionType: 'recv' },
    'tx-sent': { title: 'Sending transaction', prefix: 'to', transactionType: 'sent' },
} as const satisfies Record<TransactionEventNotification['type'], TransactionTypeProperties>;

export const TransactionNotification = ({
    notification,
    isHiddenAutomatically = true,
}: TransactionNotificationProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>>();
    const dispatch = useDispatch();
    const accountKey =
        useSelector((state: AccountsRootState) =>
            selectAccountKeyByDescriptorAndNetworkSymbol(
                state,
                notification.descriptor,
                notification.symbol,
            ),
        ) ?? '';

    const transactionTargetAddress = useSelector((state: TransactionsRootState) =>
        selectTransactionFirstTargetAddress(state, notification.txid, accountKey),
    );

    const removeNotification = useCallback(
        () => dispatch(notificationsActions.remove(notification as EventNotification)),
        [dispatch, notification],
    );

    if (!accountKey || !transactionTargetAddress) return null;

    const { title, prefix, transactionType } = transactionTypeToContentMap[notification.type];

    const navigateToTransactionDetail = () => {
        navigation.navigate(RootStackRoutes.TransactionDetail, {
            txid: notification.txid,
            accountKey,
        });
        removeNotification();
    };

    return (
        <Notification
            isHiddenAutomatically={isHiddenAutomatically}
            onHide={removeNotification}
            onPress={navigateToTransactionDetail}
            title={title}
            description={
                <TransactionNotificationDescription
                    formattedAmount={notification.formattedAmount}
                    prefix={prefix}
                    targetAddress={transactionTargetAddress}
                />
            }
            iconLeft={
                <TransactionIcon
                    transactionType={transactionType}
                    cryptoIconName={notification.symbol}
                    isAnimated
                    iconColor="iconAlertYellow"
                    backgroundColor="backgroundSurfaceElevation1"
                />
            }
            iconRight={<Icon name="circleRight" />}
        />
    );
};
