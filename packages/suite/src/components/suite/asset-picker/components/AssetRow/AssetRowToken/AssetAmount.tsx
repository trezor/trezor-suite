import { useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

export type AssetAmountProps = {
    symbol: string;
    amount: string;
    contractAddress: string;
    fiatAmount?: BaseCurrencyAmount;
};

export function AssetAmount({ amount, symbol, fiatAmount, contractAddress }: AssetAmountProps) {
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
        </Column>
    );
}
