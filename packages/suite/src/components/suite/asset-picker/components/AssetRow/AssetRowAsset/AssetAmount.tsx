import { useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Column, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

import { AssetRowAssetDataProps } from '../../../constants';

export type AssetAmountProps = Pick<
    AssetRowAssetDataProps,
    'symbol' | 'fiatAmount' | 'contractAddress'
> & {
    amount: Required<AssetRowAssetDataProps['amount']>;
};

export function AssetAmount({ amount, symbol, fiatAmount, contractAddress }: AssetAmountProps) {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const fiatCurrency = useSelector(selectBaseCurrency);

    return (
        <Column alignItems="flex-end">
            <FormattedCryptoAmount
                value={amount}
                symbol={symbol}
                contractAddress={contractAddress}
            />
            {fiatAmount && (
                <Text variant="tertiary" typographyStyle="hint">
                    <BaseCurrencyAmountFormatter value={fiatAmount} currency={fiatCurrency} />
                </Text>
            )}
        </Column>
    );
}
