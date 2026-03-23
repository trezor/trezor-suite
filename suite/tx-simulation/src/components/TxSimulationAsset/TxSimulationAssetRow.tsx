import { useFormatters } from '@suite-common/formatters';
import { type AssetDiff } from '@suite-common/tx-simulation';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Text, type TextProps } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { TxSimulationSummary } from './TxSimulationSummary';

interface TxSimulationAssetRowProps {
    intent: NonNullable<TextProps['intent']>;
    priority?: TextProps['priority'];
    amountPrefix?: '+' | '-';
    amount: AssetDiff['in'][number] | AssetDiff['out'][number];
    fiatAmount?: string;
    fiatCurrency?: string;
    assetDiff?: AssetDiff;
    dataTestId: string;
}

export function TxSimulationAssetRow({
    intent,
    priority,
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
            <Text intent={intent} priority={priority} data-testid={dataTestId} flex="1">
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
