import React, { memo } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Color } from '@trezor/theme';
import { Box, Text } from '@suite-native/atoms';
import { AccountKey, TransactionType, WalletAccountTransaction } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    AccountsStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useFormatters } from '@suite-common/formatters';
import {
    AccountAddressFormatter,
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
} from '@suite-native/formatters';
import {
    selectTransactionBlockTimeById,
    selectTransactionFirstTargetAddress,
    TransactionsRootState,
} from '@suite-common/wallet-core';

import { TransactionIcon } from './TransactionIcon';

type TransactionListItemProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    isFirst?: boolean;
    isLast?: boolean;
};

type TransactionTypeProperties = {
    prefix: string;
    sign?: string;
    signColor?: Color;
};
const transactionTypePropertiesMap = {
    recv: { prefix: 'From', sign: '+', signColor: 'textSecondaryHighlight' },
    sent: { prefix: 'To', sign: '-', signColor: 'textAlertRed' },
    self: { prefix: 'Self', sign: undefined, signColor: undefined },
    joint: { prefix: 'Joint', sign: undefined, signColor: undefined },
    failed: { prefix: 'Failed', sign: undefined, signColor: undefined },
    unknown: { prefix: 'Unknown', sign: undefined, signColor: undefined },
} as const satisfies Record<TransactionType, TransactionTypeProperties>;

type TransactionListItemStyleProps = {
    isFirst: boolean;
    isLast: boolean;
};
const transactionListItemStyle = prepareNativeStyle<TransactionListItemStyleProps>(
    (utils, { isFirst, isLast }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: utils.colors.backgroundSurfaceElevation1,
        marginHorizontal: utils.spacings.small,
        paddingHorizontal: utils.spacings.medium,
        paddingTop: 12,
        paddingBottom: 12,
        extend: [
            {
                condition: isFirst,
                style: {
                    paddingTop: utils.spacings.medium,
                    borderTopLeftRadius: utils.borders.radii.large / 2,
                    borderTopRightRadius: utils.borders.radii.large / 2,
                },
            },
            {
                condition: isLast,
                style: {
                    paddingBottom: utils.spacings.medium,
                    marginBottom: utils.spacings.small,
                    borderBottomLeftRadius: utils.borders.radii.large / 2,
                    borderBottomRightRadius: utils.borders.radii.large / 2,
                },
            },
        ],
    }),
);

const descriptionBoxStyle = prepareNativeStyle(_ => ({
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '60%',
}));
const addressStyle = prepareNativeStyle(utils => ({
    flex: 1,
    alignItems: 'center',
    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation1,
    marginLeft: utils.spacings.small,
    paddingHorizontal: utils.spacings.small,
    paddingVertical: 2,
    borderRadius: 10,
}));

export const TransactionListItem = memo(
    ({ transaction, accountKey, isFirst = false, isLast = false }: TransactionListItemProps) => {
        const { applyStyle } = useNativeStyles();
        const navigation =
            useNavigation<
                StackNavigationProps<RootStackParamList, AccountsStackRoutes.AccountDetail>
            >();
        const { DateTimeFormatter } = useFormatters();
        const transactionBlockTime = useSelector((state: TransactionsRootState) =>
            selectTransactionBlockTimeById(state, transaction.txid, accountKey),
        );
        const transactionTargetAddress = useSelector((state: TransactionsRootState) =>
            selectTransactionFirstTargetAddress(state, transaction.txid, accountKey),
        );

        const handleNavigateToTransactionDetail = () => {
            navigation.navigate(RootStackRoutes.TransactionDetail, {
                txid: transaction.txid,
                accountKey,
            });
        };

        const transactionTypeProperties = transactionTypePropertiesMap[transaction.type];

        return (
            <TouchableOpacity
                onPress={() => handleNavigateToTransactionDetail()}
                style={applyStyle(transactionListItemStyle, { isFirst, isLast })}
            >
                <Box style={applyStyle(descriptionBoxStyle)}>
                    <TransactionIcon
                        cryptoIconName={transaction.symbol}
                        transactionType={transaction.type}
                    />
                    <Box marginLeft="medium" flex={1}>
                        <Box flexDirection="row">
                            <Text>{transactionTypeProperties.prefix}</Text>
                            {transactionTargetAddress && (
                                <Box style={applyStyle(addressStyle)}>
                                    <AccountAddressFormatter
                                        value={transactionTargetAddress}
                                        variant="label"
                                        color="textSubdued"
                                    />
                                </Box>
                            )}
                        </Box>
                        <Text variant="hint" color="textSubdued">
                            <DateTimeFormatter value={transactionBlockTime} />
                        </Text>
                    </Box>
                </Box>

                <Box alignItems="flex-end">
                    <CryptoToFiatAmountFormatter
                        value={transaction.amount}
                        network={transaction.symbol}
                        customRates={transaction.rates}
                    />
                    <CryptoAmountFormatter
                        value={transaction.amount}
                        network={transaction.symbol}
                        isBalance={false}
                    />
                </Box>
            </TouchableOpacity>
        );
    },
);
