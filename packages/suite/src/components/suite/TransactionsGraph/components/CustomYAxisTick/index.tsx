import React, { useRef, useLayoutEffect } from 'react';
import BigNumber from 'bignumber.js';
import { FormattedNumber } from '@suite-components';

interface CommonProps {
    setWidth: (n: number) => void;
    [k: string]: any;
}

type CustomProps =
    | ({ localCurrency: string; symbol?: never } & CommonProps)
    | ({ symbol: string; localCurrency?: never } & CommonProps);

const CustomYAxisTick = (props: CustomProps) => {
    const { x, y, payload, setWidth } = props;
    const ref = useRef<SVGGElement>(null);

    useLayoutEffect(() => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setWidth(rect.width);
        }
    }, [ref, setWidth]);

    return (
        <g ref={ref} transform={`translate(${x},${y})`}>
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
