import { useFormatters } from '@suite-common/formatters';
import { AssetDiff } from '@suite-common/tx-simulation';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Text, TextProps } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { TxSimulationSummary } from './TxSimulationSummary';

interface TxSimulationAssetRowProps {
    variant: Required<TextProps['variant']>;
    amountPrefix?: '+' | '-';
    amount: AssetDiff['in'][number] | AssetDiff['out'][number];
    fiatAmount?: string;
    fiatCurrency?: string;
    assetDiff?: AssetDiff;
    dataTestId: string;
}

export function TxSimulationAssetRow({
    variant,
    amountPrefix,
    amount,
    fiatAmount,
    assetDiff,
    dataTestId,
    fiatCurrency,
}: TxSimulationAssetRowProps) {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    return (
        <>
            <Text variant={variant} data-testid={dataTestId} flex="1">
                <TxSimulationSummary amount={amount} assetDiff={assetDiff} />
            </Text>
            {fiatAmount && (
                <Text variant="tertiary">
                    {amountPrefix ? `${amountPrefix} ` : ''}
                    <BaseCurrencyAmountFormatter
                        value={asBaseCurrencyAmount(new BigNumber(fiatAmount))}
                        currency={fiatCurrency}
                    />
                </Text>
            )}
        </>
    );
}
