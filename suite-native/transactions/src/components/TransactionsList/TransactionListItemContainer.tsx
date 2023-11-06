import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { RequireExactlyOne } from 'type-fest';
import { useNavigation } from '@react-navigation/native';

import { AccountKey, TransactionType } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Badge, Box, HStack, Text } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import {
    selectIsTransactionPending,
    selectIsTransactionZeroValuePhishing,
    selectTransactionBlockTimeById,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { EthereumTokenTransfer } from '@suite-native/ethereum-tokens';
import { Color } from '@trezor/theme';
import { useTranslate } from '@suite-native/intl';

import { TransactionIcon } from './TransactionIcon';

type TransactionListItemContainerProps = RequireExactlyOne<
    {
        children: ReactNode;
        txid: string;
        accountKey: AccountKey;
        includedCoinsCount: number;
        isFirst?: boolean;
        isLast?: boolean;
        networkSymbol: NetworkSymbol;
        tokenTransfer: EthereumTokenTransfer;
        transactionType: TransactionType;
    },
    'networkSymbol' | 'tokenTransfer'
>;

type TransactionListItemStyleProps = {
    isFirst: boolean;
    isLast: boolean;
};

const transactionTitleMap = {
    recv: 'Received',
    sent: 'Sent',
    self: 'Self',
    joint: 'Joined',
    contract: 'Contract',
    failed: 'Failed',
    unknown: 'Unknown',
} as const satisfies Record<TransactionType, string>;

export const transactionListItemContainerStyle = prepareNativeStyle<TransactionListItemStyleProps>(
    (utils, { isFirst, isLast }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: utils.colors.backgroundSurfaceElevation1,
        marginHorizontal: utils.spacings.s,
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
                    marginBottom: utils.spacings.s,
                    borderBottomLeftRadius: utils.borders.radii.large / 2,
                    borderBottomRightRadius: utils.borders.radii.large / 2,
                },
            },
        ],
    }),
);

const titleStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    flex: 1,
    gap: utils.spacings.s,
}));

const descriptionBoxStyle = prepareNativeStyle(_ => ({
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
}));

export const valuesContainerStyle = prepareNativeStyle(utils => ({
    flexShrink: 0,
    alignItems: 'flex-end',
    marginLeft: utils.spacings.s,
    maxWidth: '40%',
}));

const getTransactionTitle = (transactionType: TransactionType, isPending: boolean) => {
    if (isPending) {
        switch (transactionType) {
            case 'recv':
                return 'Receiving';

            case 'sent':
                return 'Sending';

            default:
                return 'Pending';
        }
    }

    return transactionTitleMap[transactionType];
};

export const TransactionListItemContainer = ({
    children,
    txid,
    accountKey,
    isFirst = false,
    isLast = false,
    includedCoinsCount,
    transactionType,
    networkSymbol,
    tokenTransfer,
}: TransactionListItemContainerProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const { translate } = useTranslate();

    const handleNavigateToTransactionDetail = () => {
        navigation.navigate(RootStackRoutes.TransactionDetail, {
            txid,
            accountKey,
            tokenTransfer,
        });
    };

    const hasIncludedCoins = includedCoinsCount > 0;
    const includedCoinsLabel = `+${includedCoinsCount} coin${includedCoinsCount > 1 ? 's' : ''}`;

    const { DateTimeFormatter } = useFormatters();
    const transactionBlockTime = useSelector((state: TransactionsRootState) =>
        selectTransactionBlockTimeById(state, txid, accountKey),
    );

    const isTransactionPending = useSelector((state: TransactionsRootState) =>
        selectIsTransactionPending(state, txid, accountKey),
    );

    const isZeroValuePhishing = useSelector((state: TransactionsRootState) =>
        selectIsTransactionZeroValuePhishing(state, txid, accountKey),
    );

    const iconColor: Color = isTransactionPending ? 'backgroundAlertYellowBold' : 'iconSubdued';
    const coinSymbol = tokenTransfer?.contract ?? networkSymbol;
    const transactionTitle = getTransactionTitle(transactionType, isTransactionPending);

    return (
        <TouchableOpacity
            onPress={() => handleNavigateToTransactionDetail()}
            style={applyStyle(transactionListItemContainerStyle, { isFirst, isLast })}
        >
            <Box style={applyStyle(descriptionBoxStyle)}>
                {coinSymbol && (
                    <TransactionIcon
                        symbol={coinSymbol}
                        transactionType={transactionType}
                        isAnimated={isTransactionPending}
                        iconColor={iconColor}
                    />
                )}
                <Box marginLeft="medium" flex={1}>
                    <HStack flexDirection="row" alignItems="center" spacing="xs">
                        <Box style={applyStyle(titleStyle)}>
                            <Text variant="body">{transactionTitle}</Text>
                            {isZeroValuePhishing && (
                                <Badge
                                    label={translate('transactions.phishing.badge')}
                                    size="s"
                                    icon="warningTriangle"
                                    variant="red"
                                />
                            )}
                        </Box>
                        {hasIncludedCoins && <Badge label={includedCoinsLabel} size="s" />}
                    </HStack>
                    <Text variant="hint" color="textSubdued">
                        <DateTimeFormatter value={transactionBlockTime} />
                    </Text>
                </Box>
            </Box>
            <Box style={applyStyle(valuesContainerStyle)}>{children}</Box>
        </TouchableOpacity>
    );
};
