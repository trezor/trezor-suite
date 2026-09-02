import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useSelector } from 'src/hooks/suite';

export type AssetAmountProps = {
    symbol: string;
    amount: string;
    contractAddress?: string | null;
    /** The token's decimals, so a stablecoin balance is shown the way money is. */
    decimals?: number;
    fiatAmount?: BaseCurrencyAmount;
    showNoTradingPairText?: boolean;
    isFiatPrimary?: boolean;
    isDisabled?: boolean;
};

export function AssetAmount({
    amount,
    symbol,
    fiatAmount,
    contractAddress,
    decimals,
    showNoTradingPairText = false,
    isFiatPrimary = false,
    isDisabled = false,
}: AssetAmountProps) {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const fiatCurrency = useSelector(selectBaseCurrency);

    const cryptoAmount = (
        <Text
            intent="neutral"
            priority={isFiatPrimary ? 'secondary' : undefined}
            typographyStyle={isFiatPrimary ? 'body-sm' : 'body-md'}
            isDisabled={isDisabled}
        >
            <FormattedCryptoAmount
                value={amount}
                symbol={symbol}
                contractAddress={contractAddress}
                isCompact
                tokenDecimals={decimals}
            />
        </Text>
    );

    const fiat = (
        <>
            {fiatAmount && (
                <Text
                    intent="neutral"
                    priority={isFiatPrimary ? undefined : 'secondary'}
                    typographyStyle={isFiatPrimary ? 'body-md' : 'body-sm'}
                    isDisabled={isDisabled}
                >
                    <BaseCurrencyAmountFormatter value={fiatAmount} currency={fiatCurrency} />
                </Text>
            )}
            {!fiatAmount && showNoTradingPairText && (
                <Text
                    intent="neutral"
                    priority="secondary"
                    typographyStyle="body-sm"
                    isDisabled={isDisabled}
                >
                    <Translation id="TR_HIDDEN_TOKEN_WITHOUT_FIAT" />
                </Text>
            )}
        </>
    );

    return (
        <Column alignItems="flex-end">
            {isFiatPrimary ? fiat : cryptoAmount}
            {isFiatPrimary ? cryptoAmount : fiat}
        </Column>
    );
}
