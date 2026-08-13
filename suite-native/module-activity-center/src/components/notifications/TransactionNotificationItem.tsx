import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type DeviceRootState } from '@suite-common/device';
import { useFormatters } from '@suite-common/formatters';
import {
    type TransactionEntry,
    type TransactionNotificationType,
} from '@suite-common/toast-notifications';
import {
    type AccountsRootState,
    selectDeviceAccountByDescriptorAndNetworkSymbol,
} from '@suite-common/wallet-core';
import { Divider, HStack, IconButton, Text, VStack } from '@suite-native/atoms';
import { Icon, type IconName, TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { getTxNotificationFields } from './utils';

type Props = {
    notification: TransactionEntry;
    seen: boolean;
    index: number;
};

const txTypeIconMap = {
    'tx-received': 'arrowDown',
    'tx-sent': 'arrowUp',
    'raw-tx-sent': 'arrowUp',
    'tx-confirmed': 'checkCircle',
    'tx-staked': 'arrowUp',
    'tx-yield-deposit': 'arrowUp',
    'tx-unstaked': 'arrowUp',
    'tx-yield-withdraw': 'arrowUp',
    'tx-claimed': 'arrowUp',
    'tx-yield-claim': 'arrowUp',
    'tx-revoked': 'arrowUp',
    'tx-approved': 'arrowUp',
    'tx-wrap': 'arrowUp',
    'tx-unwrap': 'arrowDown',
} as const satisfies Record<TransactionNotificationType, IconName>;

const translationIdMap = {
    'tx-sent': 'moduleActivityCenter.notifications.txSent',
    'raw-tx-sent': 'moduleActivityCenter.notifications.rawTxSent',
    'tx-received': 'moduleActivityCenter.notifications.txReceived',
    'tx-confirmed': 'moduleActivityCenter.notifications.txConfirmed',
    'tx-staked': 'moduleActivityCenter.notifications.txStaked',
    'tx-unstaked': 'moduleActivityCenter.notifications.txUnstaked',
    'tx-claimed': 'moduleActivityCenter.notifications.txClaimed',
    'tx-yield-deposit': 'moduleActivityCenter.notifications.txYieldDeposit',
    'tx-yield-withdraw': 'moduleActivityCenter.notifications.txYieldWithdraw',
    'tx-yield-claim': 'moduleActivityCenter.notifications.txYieldClaim',
    'tx-revoked': 'moduleActivityCenter.notifications.txRevoked',
    'tx-approved': 'moduleActivityCenter.notifications.txApproved',
    'tx-wrap': 'moduleActivityCenter.notifications.txWrap',
    'tx-unwrap': 'moduleActivityCenter.notifications.txUnwrap',
} as const satisfies Record<TransactionNotificationType, string>;

const fullWidthDividerStyle = prepareNativeStyle(utils => ({
    marginHorizontal: -utils.spacings.sp12,
}));

export const TransactionNotificationItem = ({ notification, seen, index }: Props) => {
    const { applyStyle } = useNativeStyles();
    const { DateFormatter, TimeFormatter } = useFormatters();
    const navigation =
        useNavigation<
            StackNavigationProps<RootStackParamList, RootStackRoutes.ActivityCenterStack>
        >();

    const { type, descriptor, symbol, txid, formattedAmount, tokenContract } =
        getTxNotificationFields(notification);

    const account = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountByDescriptorAndNetworkSymbol(state, descriptor, symbol),
    );

    const accountKey = account?.key;
    const accountLabel = account?.accountLabel ?? `${descriptor.slice(0, 10)}…`;

    const iconName = txTypeIconMap[type];
    const contentColor = seen ? 'contentSecondary' : ('contentPrimary' as const);

    const canNavigate = txid !== undefined && accountKey !== undefined;

    const handleNavigate = useCallback(() => {
        if (!canNavigate) return;
        navigation.navigate(RootStackRoutes.TransactionDetailStack, {
            screen: TransactionDetailStackRoutes.TransactionDetail,
            params: { txid, accountKey },
        });
    }, [navigation, canNavigate, txid, accountKey]);

    return (
        <VStack spacing="sp4">
            {index > 0 && <Divider style={applyStyle(fullWidthDividerStyle)} />}
            <HStack spacing="sp12" alignItems="center" paddingVertical="sp8">
                <Icon name={iconName} size="mediumLarge" color={contentColor} />
                <VStack flex={1} spacing="sp2">
                    <Text
                        variant={seen ? 'body-sm' : 'body-sm-strong'}
                        color={contentColor}
                        numberOfLines={1}
                    >
                        <Translation
                            id={translationIdMap[type]}
                            values={accountLabel ? { account: accountLabel } : undefined}
                        />
                    </Text>
                    {formattedAmount !== undefined && symbol !== undefined && (
                        <HStack spacing="sp8" alignItems="center">
                            <TokenIcon
                                symbol={symbol}
                                contractAddress={tokenContract}
                                size="tiny"
                            />
                            <Text variant="body-xs" color={contentColor}>
                                {formattedAmount}
                            </Text>
                        </HStack>
                    )}
                    <Text variant="body-xs" color={contentColor}>
                        <DateFormatter value={notification.id} /> •{' '}
                        <TimeFormatter value={notification.id} />
                    </Text>
                </VStack>
                {canNavigate && (
                    <IconButton
                        iconName="arrowRight"
                        intent="neutral"
                        priority="secondary"
                        size="medium"
                        onPress={handleNavigate}
                    />
                )}
            </HStack>
        </VStack>
    );
};
