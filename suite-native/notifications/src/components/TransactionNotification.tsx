import { useSelector, useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { TransactionType } from '@suite-common/wallet-types';
import { TransactionIcon } from '@suite-native/transactions';
import {
    TransactionsRootState,
    selectTransactionFirstTargetAddress,
    AccountsRootState,
    selectDeviceAccountKeyByDescriptorAndNetworkSymbol,
    selectTransactionByTxidAndAccountKey,
    DeviceRootState,
} from '@suite-common/wallet-core';
import {
    RootStackRoutes,
    StackNavigationProps,
    RootStackParamList,
} from '@suite-native/navigation';
import { Icon } from '@suite-common/icons';
import {
    notificationsActions,
    TransactionNotificationType,
    NotificationId,
    selectTransactionNotificationById,
    NotificationsRootState,
} from '@suite-common/toast-notifications';

import { Notification } from './Notification';
import { TransactionNotificationDescription } from './TransactionNotificationDescription';

type TransactionNotificationProps = {
    notificationId: NotificationId;
    isHiddenAutomatically?: boolean;
};

type TransactionTypeProperties = {
    title?: string;
    prefix?: string;
    transactionType: TransactionType;
    isIconAnimated: boolean;
};

const transactionTypeToContentMap = {
    'tx-received': {
        title: 'Incoming transaction',
        prefix: 'from',
        transactionType: 'recv',
        isIconAnimated: true,
    },
    'tx-confirmed': {
        title: 'Received transaction',
        prefix: 'from',
        transactionType: 'recv',
        isIconAnimated: false,
    },
    'tx-sent': {
        title: 'Sending transaction',
        prefix: 'to',
        transactionType: 'sent',
        isIconAnimated: true,
    },
} as const satisfies Record<TransactionNotificationType, TransactionTypeProperties>;

export const TransactionNotification = ({
    notificationId,
    isHiddenAutomatically = true,
}: TransactionNotificationProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>>();
    const dispatch = useDispatch();
    const notification = useSelector((state: NotificationsRootState) =>
        selectTransactionNotificationById(state, notificationId),
    );

    const accountKey = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountKeyByDescriptorAndNetworkSymbol(
            state,
            notification?.descriptor,
            notification?.symbol,
        ),
    );

    const txid = notification?.txid ?? '';

    const transaction = useSelector((state: TransactionsRootState) =>
        selectTransactionByTxidAndAccountKey(state, txid, accountKey ?? ''),
    );

    const transactionTargetAddress = useSelector((state: TransactionsRootState) =>
        selectTransactionFirstTargetAddress(state, txid, accountKey ?? ''),
    );

    const handleRemoveNotification = () => dispatch(notificationsActions.close(notificationId));

    if (!accountKey || !notification || !transactionTargetAddress) return null;

    const { title, prefix, transactionType, isIconAnimated } =
        transactionTypeToContentMap[notification.type];

    const navigateToTransactionDetail = () => {
        navigation.navigate(RootStackRoutes.TransactionDetail, {
            txid,
            accountKey,
        });
        handleRemoveNotification();
    };

    return (
        <Notification
            isHiddenAutomatically={isHiddenAutomatically}
            onHide={handleRemoveNotification}
            onPress={navigateToTransactionDetail}
            title={title}
            description={
                <TransactionNotificationDescription
                    amount={transaction?.amount ?? null}
                    prefix={prefix}
                    networkSymbol={notification.symbol}
                    targetAddress={transactionTargetAddress}
                />
            }
            iconLeft={
                <TransactionIcon
                    transactionType={transactionType}
                    symbol={notification.symbol}
                    isAnimated={isIconAnimated}
                    iconColor={isIconAnimated ? 'iconAlertYellow' : 'iconSubdued'}
                />
            }
            iconRight={<Icon name="circleRight" />}
        />
    );
};
