import { Line } from 'recharts';
import { DefaultTheme } from 'styled-components';

import { PlusMinusDot } from './PlusMinusDot';
import { RawDataItem } from './types';

type RenderFiatBalanceJumpsProps = {
    verticalSegments: RawDataItem[][];
    theme: DefaultTheme;
};

export const renderFiatBalanceJumps = ({
    verticalSegments,
    theme,
}: RenderFiatBalanceJumpsProps) => (
    <>
        {verticalSegments.map((pair, index) => {
            const firstPoint = pair[0];
            const lastPoint = pair[pair.length - 1];
            const isPositive = firstPoint.value <= lastPoint.value;

            return (
                <Line
                    key={`v-${index}`}
                    data={pair}
                    type="linear"
                    dataKey="fiatValue"
                    stroke={
                        isPositive ? theme.backgroundSecondaryDefault : theme.backgroundAlertRedBold
                    }
                    strokeWidth={1.5}
                    strokeDasharray="3 6"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    isAnimationActive={false}
                    legendType="none"
                    dot={<PlusMinusDot />}
                    name={`jump-${index}`}
                />
            );
        })}
    </>
);
