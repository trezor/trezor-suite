import { useSelector } from 'react-redux';

import { getCompactAmount, useFormatters } from '@suite-common/formatters';
import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountLabel } from '@suite-native/accounts';
import { Box, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Icon, TokenIcon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type YieldClaimSummary } from '../../types';

const COMPACT_REWARD_AMOUNT_OPTIONS = {
    maximumSignificantDigits: 4,
    minimumDisplayedValue: '0.0001',
} as const;

const rowStyle = prepareNativeStyle(utils => ({
    minHeight: 80,
    paddingLeft: utils.spacings.sp16,
    paddingRight: utils.spacings.sp12,
    paddingVertical: utils.spacings.sp12,
    flexDirection: 'row',
    alignItems: 'center',
}));

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
    overflow: 'hidden',
}));

const tabularNumbersStyle = prepareNativeStyle(() => ({
    fontVariant: ['tabular-nums'],
}));

const tokenAmountsStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
    fontVariant: ['tabular-nums'],
}));

interface YieldClaimAccountCardProps {
    summary: YieldClaimSummary;
    onPress: () => void;
}

export const YieldClaimAccountCard = ({ summary, onPress }: YieldClaimAccountCardProps) => {
    const { applyStyle } = useNativeStyles();
    const { CryptoAmountFormatter } = useFormatters();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, summary.accountKey),
    );

    const formattedRewardTokenAmounts = summary.tokens
        .map(({ claimableAmount, decimals, symbol }) => {
            const compactAmount = getCompactAmount({
                value: claimableAmount,
                ...COMPACT_REWARD_AMOUNT_OPTIONS,
            });
            const formattedAmount = CryptoAmountFormatter.format(compactAmount.value, {
                symbol,
                isBalance: true,
                maxDisplayedDecimals: decimals,
                isEllipsisAppended: false,
            });

            return compactAmount.isLessThanMinimum ? `<${formattedAmount}` : formattedAmount;
        })
        .join('\n');

    return (
        <PressableOpacity onPress={onPress} style={applyStyle(rowStyle)}>
            <Box marginRight="sp12">
                <TokenIcon symbol={summary.networkSymbol} size="small" />
            </Box>

            <VStack spacing="sp4" style={applyStyle(contentStyle)}>
                {account ? (
                    <AccountLabel
                        account={account}
                        showAccountTypeBadge
                        variant="body-md-strong"
                        numberOfLines={1}
                    />
                ) : (
                    <Text variant="body-md-strong" numberOfLines={1}>
                        {getNetworkDisplaySymbolName(summary.networkSymbol)}
                    </Text>
                )}
                <Text
                    variant="body-xs"
                    color="contentSecondary"
                    style={applyStyle(tokenAmountsStyle)}
                >
                    {formattedRewardTokenAmounts}
                </Text>
            </VStack>

            <HStack spacing="sp8" alignItems="center" marginLeft="sp8">
                <BaseCurrencyAmountFormatter
                    value={summary.fiatClaimableAmount}
                    variant="body-md-strong"
                    isDiscreetText={false}
                    numberOfLines={1}
                    style={applyStyle(tabularNumbersStyle)}
                />
                <Icon name="caretRight" size="mediumLarge" color="contentSecondary" />
            </HStack>
        </PressableOpacity>
    );
};
