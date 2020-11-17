import React, { useRef, useLayoutEffect } from 'react';
import { useTheme } from '@trezor/components';
import { FormattedNumber } from '@suite-components';
import { formatCoinBalance } from '@wallet-utils/balanceUtils';
import BigNumber from 'bignumber.js';

interface CommonProps {
    setWidth: (n: number) => void;
    [k: string]: any;
}

type CustomProps =
    | ({ localCurrency: string; symbol?: never } & CommonProps)
    | ({ symbol: string; localCurrency?: never } & CommonProps);

const CustomYAxisTick = (props: CustomProps) => {
    const { x, y, payload, setWidth } = props;
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
                {props.localCurrency && (
                    <FormattedNumber
                        currency={props.localCurrency}
                        value={payload.value}
                        minimumFractionDigits={bValue.lt(1) ? 2 : 0}
                        maximumFractionDigits={bValue.lt(1) ? 2 : 0}
                    />
                )}
                {props.symbol && `${cryptoValue} ${props.symbol.toUpperCase()}`}
            </text>
        </g>
    );
};
export default CustomYAxisTick;
