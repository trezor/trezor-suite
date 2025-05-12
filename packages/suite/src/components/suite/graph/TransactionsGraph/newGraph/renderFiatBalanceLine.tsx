import { Area } from 'recharts';
import { RawDataItem } from './types';
import { DefaultTheme } from 'styled-components';

type RenderFiatBalanceJumpsProps = {
    segments: RawDataItem[][];
    theme: DefaultTheme;
};

export const renderFiatBalanceLine = ({ segments, theme }: RenderFiatBalanceJumpsProps) => {
    return (
        <>
            {segments.map((segment, index) => (
                <Area
                    key={`main-${index}`}
                    data={segment}
                    type="linear"
                    dataKey="fiatValue"
                    stroke={theme.backgroundPrimaryDefault}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                    legendType={index ? 'none' : undefined}
                    fill="url(#gradient-area)"
                    name={`main-line-${index}`}
                />
            ))}
        </>
    );
};
