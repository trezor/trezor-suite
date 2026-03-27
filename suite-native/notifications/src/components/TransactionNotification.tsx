import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type DeviceRootState } from '@suite-common/device';
import {
    type NotificationId,
    type NotificationsRootState,
    type TransactionNotificationType,
    notificationsActions,
    selectTransactionNotificationById,
} from '@suite-common/toast-notifications';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectDeviceAccountKeyByDescriptorAndNetworkSymbol,
    selectTransactionByAccountKeyAndTxid,
    selectTransactionFirstTargetAddress,
} from '@suite-common/wallet-core';
import { type TransactionType } from '@suite-common/wallet-types';
import { Icon } from '@suite-native/icons';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { TransactionIcon } from '@suite-native/transactions';

import { Notification } from './Notification';
import { TransactionNotificationDescription } from './TransactionNotificationDescription';

type TransactionNotificationProps = {
    notificationId: NotificationId;
    isHiddenAutomatically?: boolean;
};

type TransactionTypeProperties = {
    titleTxKey?: TxKeyPath;
    prefix?: string;
    transactionType: TransactionType;
    isIconAnimated: boolean;
};

const transactionTypeToContentMap = {
    'tx-received': {
        titleTxKey: 'notifications.transaction.incoming',
        prefix: 'from',
        transactionType: 'recv',
        isIconAnimated: true,
    },
    'tx-confirmed': {
        titleTxKey: 'notifications.transaction.confirmed',
        prefix: 'from',
        transactionType: 'recv',
        isIconAnimated: false,
    },
    'tx-sent': {
        titleTxKey: 'notifications.transaction.sending',
        prefix: 'to',
        transactionType: 'sent',
        isIconAnimated: true,
    },
} as const satisfies Record<TransactionNotificationType, TransactionTypeProperties>;

export const TransactionNotification = ({
    notificationId,
    isHiddenAutomatically = true,
}: TransactionNotificationProps) => {
    const { translate } = useTranslate();
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
        selectTransactionByAccountKeyAndTxid(state, accountKey, txid),
    );

    const transactionTargetAddress = useSelector((state: TransactionsRootState) =>
        selectTransactionFirstTargetAddress(state, accountKey, txid),
    );

    const handleRemoveNotification = () => dispatch(notificationsActions.close(notificationId));

    if (!accountKey || !notification || !transactionTargetAddress) return null;

    const { titleTxKey, prefix, transactionType, isIconAnimated } =
        transactionTypeToContentMap[notification.type];

    const navigateToTransactionDetail = () => {
        navigation.navigate(RootStackRoutes.TransactionDetailStack, {
            screen: TransactionDetailStackRoutes.TransactionDetail,
            params: {
                txid,
                accountKey,
            },
        });
        handleRemoveNotification();
    };

    return (
        <Notification
            isHiddenAutomatically={isHiddenAutomatically}
            onHide={handleRemoveNotification}
            onPress={navigateToTransactionDetail}
            title={translate(titleTxKey)}
            description={
                <TransactionNotificationDescription
                    amount={transaction?.amount ?? null}
                    prefix={prefix}
                    symbol={notification.symbol}
                    targetAddress={transactionTargetAddress}
                />
            }
            iconLeft={
                <TransactionIcon
                    transactionType={transactionType}
                    symbol={notification.symbol}
                    isAnimated={isIconAnimated}
                />
            }
            iconRight={<Icon name="caretCircleRight" />}
        />
    );
};
