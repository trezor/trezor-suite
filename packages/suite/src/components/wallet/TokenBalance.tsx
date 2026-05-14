import { useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Column, Text } from '@trezor/components';
import { type AssetProps } from '@trezor/product-components';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

export interface TokenBalanceProps {
    contractAddress: string;
    tokenBalance: NonNullable<AssetProps['tokenBalance']>;
}

export function TokenBalance({ contractAddress, tokenBalance }: TokenBalanceProps) {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const fiatCurrency = useSelector(selectBaseCurrency);

    return (
        <Column alignItems="flex-end">
            <FormattedCryptoAmount
                value={tokenBalance.baseAmount}
                symbol={tokenBalance.baseSymbol}
                contractAddress={contractAddress}
            />
            {tokenBalance.fiatAmount && (
                <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <BaseCurrencyAmountFormatter
                        value={tokenBalance.fiatAmount}
                        currency={fiatCurrency}
                    />
                </Text>
            )}
        </Column>
    );
}
