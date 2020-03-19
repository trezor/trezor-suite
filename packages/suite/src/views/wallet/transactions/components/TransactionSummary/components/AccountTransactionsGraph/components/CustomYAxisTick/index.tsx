import React from 'react';
import BigNumber from 'bignumber.js';


const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;

    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={2} textAnchor="start" fill="#666">
                {new BigNumber(payload.value).toFixed(2)}
            </text>
        </g>
    );
};
export default CustomYAxisTick;
