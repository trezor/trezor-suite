import React, { useRef, useLayoutEffect } from 'react';
import { useTheme } from '@trezor/components';
import { FormattedFiatAmount, FormattedCryptoAmount } from '@suite-components';
import { formatCoinBalance } from '@suite-common/wallet-utils';
import BigNumber from 'bignumber.js';
import { NetworkSymbol } from '@wallet-types';

interface CommonProps {
    setWidth: (n: number) => void;
    [k: string]: any;
}

type CustomYAxisTickProps =
    | ({ localCurrency: string; symbol?: never } & CommonProps)
    | ({ symbol: NetworkSymbol; localCurrency?: never } & CommonProps);

export const CustomYAxisTick = ({
    x,
    y,
    payload,
    setWidth,
    localCurrency,
    symbol,
}: CustomYAxisTickProps) => {
    const theme = useTheme();
    const ref = useRef<SVGGElement>(null);

    useLayoutEffect(() => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setWidth(rect.width);
        }
    }, [ref, setWidth]);

    const bValue = new BigNumber(payload.value);
    const cryptoValue = bValue.abs().lt(0.01)
        ? formatCoinBalance(bValue.toFixed())
        : bValue.toFixed(2);

    return (
        <g ref={ref} transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={2}
                textAnchor="start"
                fill={theme.TYPE_LIGHT_GREY}
                style={{ fontVariantNumeric: 'tabular-nums' }}
            >
                {localCurrency && (
                    <FormattedFiatAmount
                        currency={localCurrency}
                        value={payload.value}
                        minimumFractionDigits={bValue.lt(1) ? 2 : 0}
                        maximumFractionDigits={bValue.lt(1) ? 2 : 0}
                    />
                )}

                {symbol && (
                    <FormattedCryptoAmount value={cryptoValue} symbol={symbol} isRawString />
                )}
            </text>
        </g>
    );
};
