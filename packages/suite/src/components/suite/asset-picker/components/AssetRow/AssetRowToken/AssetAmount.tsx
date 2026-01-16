import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useSelector } from 'src/hooks/suite';

export type AssetAmountProps = {
    symbol: string;
    amount: string;
    contractAddress: string;
    fiatAmount?: BaseCurrencyAmount;
    fiatFallackText?: boolean;
};

export function AssetAmount({
    amount,
    symbol,
    fiatAmount,
    contractAddress,
    fiatFallackText = false,
}: AssetAmountProps) {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const fiatCurrency = useSelector(selectBaseCurrency);

    return (
        <Column alignItems="flex-end">
            <Text variant="default" typographyStyle="body">
                <FormattedCryptoAmount
                    value={amount}
                    symbol={symbol}
                    contractAddress={contractAddress}
                    isBalance
                />
            </Text>

            {fiatAmount && (
                <Text variant="tertiary" typographyStyle="hint">
                    <BaseCurrencyAmountFormatter value={fiatAmount} currency={fiatCurrency} />
                </Text>
            )}
            {!fiatAmount && fiatFallackText && (
                <Text variant="tertiary" typographyStyle="hint">
                    <Translation id="TR_HIDDEN_TOKEN_WITHOUT_FIAT" />
                </Text>
            )}
        </Column>
    );
}
