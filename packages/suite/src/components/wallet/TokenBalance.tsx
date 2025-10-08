import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbolExtended } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Column, Text } from '@trezor/components';
import { AssetProps } from '@trezor/product-components';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

export interface TokenBalanceProps {
    symbol: NetworkSymbolExtended;
    contractAddress: string;
    tokenBalance: NonNullable<AssetProps['tokenBalance']>;
}

export function TokenBalance({ symbol, contractAddress, tokenBalance }: TokenBalanceProps) {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const fiatCurrency = useSelector(selectBaseCurrency);

    return (
        <Column alignItems="flex-end">
            <FormattedCryptoAmount
                value={tokenBalance.baseAmount}
                symbol={symbol}
                contractAddress={contractAddress}
            />
            {tokenBalance.fiatAmount && (
                <Text variant="tertiary" typographyStyle="hint">
                    <BaseCurrencyAmountFormatter
                        value={tokenBalance.fiatAmount}
                        currency={fiatCurrency}
                    />
                </Text>
            )}
        </Column>
    );
}
