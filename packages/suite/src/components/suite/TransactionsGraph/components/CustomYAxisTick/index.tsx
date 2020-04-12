import React from 'react';
import BigNumber from 'bignumber.js';
import { FormattedNumber } from '@suite-components';

interface CommonProps {
    [k: string]: any;
}

type CustomProps =
    | ({ localCurrency: string; symbol?: never } & CommonProps)
    | ({ symbol: string; localCurrency?: never } & CommonProps);

const CustomYAxisTick = (props: CustomProps) => {
    const { x, y, payload } = props;

    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={2} textAnchor="start" fill="#666">
                {props.localCurrency && (
                    <FormattedNumber
                        currency={props.localCurrency}
                        value={payload.value}
                        minimumFractionDigits={0}
                        maximumFractionDigits={0}
                    />
                )}
                {props.symbol && new BigNumber(payload.value).toFixed(2)}
            </text>
        </g>
    );
};
export default CustomYAxisTick;
