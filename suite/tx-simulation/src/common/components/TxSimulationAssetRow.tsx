import { type ReactNode } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Text, type TextProps } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

interface TxSimulationAssetRowProps {
    intent: NonNullable<TextProps['intent']>;
    priority?: TextProps['priority'];
    fiatAmount?: {
        value: string;
        currency: string;
        prefix?: '+' | '-';
    };
    dataTestId: string;
    children: ReactNode;
}

export function TxSimulationAssetRow({
    intent,
    priority,
    fiatAmount,
    dataTestId,
    children,
}: TxSimulationAssetRowProps) {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    return (
        <>
            <Text intent={intent} priority={priority} data-testid={dataTestId} flex="1">
                {children}
            </Text>
            {fiatAmount && (
                <Text intent="neutral" priority="secondary">
                    {fiatAmount.prefix}
                    <BaseCurrencyAmountFormatter
                        value={asBaseCurrencyAmount(new BigNumber(fiatAmount.value))}
                        currency={fiatAmount.currency}
                    />
                </Text>
            )}
        </>
    );
}
