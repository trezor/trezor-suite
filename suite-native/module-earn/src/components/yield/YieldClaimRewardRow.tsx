import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type BaseCurrencyAmount,
    asBaseCurrencyAmount,
    toTokenSymbol,
} from '@suite-common/wallet-types';
import { Box, HStack, Text } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    ExactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { BigNumber } from '@trezor/utils';

// Capped so that the reward amount keeps enough of the row to wrap its full precision to two
// lines — the fiat approximation is the one allowed to ellipsize.
const fiatAmountStyle = prepareNativeStyle(() => ({
    maxWidth: '32%',
}));

type YieldClaimRewardRowProps = {
    amount: string;
    fiatAmount: BaseCurrencyAmount | null;
    isFiatLoading?: boolean;
    networkSymbol: NetworkSymbol;
    tokenContractAddress?: string;
    tokenDecimals: number;
    tokenSymbol: string;
};

export const getYieldClaimRewardFiatAmount = (
    fiatValue?: string | null,
): BaseCurrencyAmount | null =>
    fiatValue != null ? asBaseCurrencyAmount(new BigNumber(fiatValue)) : null;

export const YieldClaimRewardRow = ({
    amount,
    fiatAmount,
    isFiatLoading = false,
    networkSymbol,
    tokenContractAddress,
    tokenDecimals,
    tokenSymbol,
}: YieldClaimRewardRowProps) => {
    const { applyStyle } = useNativeStyles();

    const isFiatAmountVisible = fiatAmount !== null || isFiatLoading;

    return (
        <HStack spacing="sp16" justifyContent="space-between" alignItems="center">
            <HStack spacing="sp4" alignItems="center" flex={1}>
                <TokenIcon
                    symbol={networkSymbol}
                    contractAddress={tokenContractAddress}
                    size={20}
                />
                <Box flexShrink={1}>
                    <ExactTokenAmountFormatter
                        value={asDecimalTokenAmount(amount)}
                        tokenSymbol={toTokenSymbol(tokenSymbol)}
                        maxDisplayedDecimals={tokenDecimals}
                        variant="body-sm-strong"
                        color="contentPrimary"
                        isDiscreetText={false}
                        numberOfLines={2}
                    />
                </Box>
            </HStack>
            {isFiatAmountVisible && (
                <HStack
                    spacing="sp2"
                    alignItems="center"
                    justifyContent="flex-end"
                    flexShrink={1}
                    style={applyStyle(fiatAmountStyle)}
                >
                    {!isFiatLoading && (
                        <Text variant="body-sm" color="contentSecondary">
                            ≈
                        </Text>
                    )}
                    <BaseCurrencyAmountFormatter
                        value={fiatAmount}
                        variant="body-sm"
                        color="contentSecondary"
                        isDiscreetText={false}
                        isLoading={isFiatLoading}
                        numberOfLines={1}
                    />
                </HStack>
            )}
        </HStack>
    );
};
