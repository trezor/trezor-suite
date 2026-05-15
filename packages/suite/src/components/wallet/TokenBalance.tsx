import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Column, Text } from '@trezor/components';
import { type AssetProps } from '@trezor/product-components';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

export interface TokenBalanceProps {
    contractAddress: string;
    networkSymbol?: NetworkSymbol;
    tokenBalance: NonNullable<AssetProps['tokenBalance']>;
}

export function TokenBalance({ contractAddress, networkSymbol, tokenBalance }: TokenBalanceProps) {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const fiatCurrency = useSelector(selectBaseCurrency);

    return (
        <Column alignItems="flex-end">
            <FormattedCryptoAmount
                value={tokenBalance.baseAmount}
                symbol={tokenBalance.baseSymbol}
                networkSymbol={networkSymbol}
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
