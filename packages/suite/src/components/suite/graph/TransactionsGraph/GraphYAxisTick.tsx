import { useLayoutEffect, useRef } from 'react';

import { useTheme } from 'styled-components';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

interface CommonProps {
    payload?: {
        value: number;
    };
    setWidth: (n: number) => void;
    x?: number;
    y?: number;
}

type GraphYAxisTickProps =
    | ({ localCurrency: string; symbol?: never } & CommonProps)
    | ({ symbol: NetworkSymbol; localCurrency?: never } & CommonProps);

export const GraphYAxisTick = ({
    x = 0,
    y = 0,
    payload,
    setWidth,
    localCurrency,
    symbol,
}: GraphYAxisTickProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const theme = useTheme();
    const ref = useRef<SVGGElement>(null);

    useLayoutEffect(() => {
        if (ref.current) {
            setWidth(ref.current.getBoundingClientRect().width);
        }
    }, [setWidth]);

    if (!payload) return null;

    return (
        <g ref={ref} transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={2}
                textAnchor="start"
                fill={theme.contentSecondary}
                style={{ fontVariantNumeric: 'tabular-nums' }}
            >
                {localCurrency && (
                    <BaseCurrencyAmountFormatter
                        value={asBaseCurrencyAmount(new BigNumber(payload.value))}
                        currency={localCurrency}
                        minimumFractionDigits={0}
                    />
                )}

                {symbol && (
                    <FormattedCryptoAmount value={payload.value} symbol={symbol} isRawString />
                )}
            </text>
        </g>
    );
};
