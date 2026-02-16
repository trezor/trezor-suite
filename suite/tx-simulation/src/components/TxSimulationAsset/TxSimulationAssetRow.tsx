import { useFormatters } from '@suite-common/formatters';
import { AssetDiff } from '@suite-common/tx-simulation';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Text, TextProps } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { TxSimulationSummary } from './TxSimulationSummary';

interface TxSimulationAssetRowProps {
    variant: 'default' | 'primary' | 'tertiary' | 'destructive';
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
    let textProps: Pick<TextProps, 'intent' | 'priority'> = { intent: 'neutral' };
    if (variant === 'primary') {
        textProps = { intent: 'brand' };
    } else if (variant === 'tertiary') {
        textProps = { intent: 'neutral', priority: 'secondary' };
    } else if (variant === 'destructive') {
        textProps = { intent: 'critical' };
    }

    return (
        <>
            <Text {...textProps} data-testid={dataTestId} flex="1">
                <TxSimulationSummary amount={amount} assetDiff={assetDiff} />
            </Text>
            {fiatAmount && (
                <Text intent="neutral" priority="secondary">
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
