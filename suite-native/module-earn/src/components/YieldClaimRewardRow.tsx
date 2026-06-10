import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type BaseCurrencyAmount,
    asBaseCurrencyAmount,
    toTokenSymbol,
} from '@suite-common/wallet-types';
import { HStack, Text } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon } from '@suite-native/icons';
import { BigNumber } from '@trezor/utils';

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
    const isFiatAmountVisible = fiatAmount !== null || isFiatLoading;

    return (
        <HStack spacing="sp16" justifyContent="space-between" alignItems="center">
            <HStack spacing="sp4" alignItems="center" flex={1}>
                <CryptoIcon
                    symbol={networkSymbol}
                    contractAddress={tokenContractAddress}
                    size={20}
                />
                <CryptoAmountFormatter
                    value={amount}
                    symbol={toTokenSymbol(tokenSymbol)}
                    decimals={tokenDecimals}
                    variant="body-sm-strong"
                    color="contentPrimary"
                    isDiscreetText={false}
                    numberOfLines={1}
                />
            </HStack>
            {isFiatAmountVisible && (
                <HStack spacing="sp2" alignItems="center" justifyContent="flex-end">
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
