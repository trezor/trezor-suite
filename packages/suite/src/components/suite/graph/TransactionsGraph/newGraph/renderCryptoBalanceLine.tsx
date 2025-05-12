import { Line, YAxis } from 'recharts';
import { DefaultTheme } from 'styled-components';

export type RenderCryptoBalanceLine = {
    theme: DefaultTheme;
};
export const renderCryptoBalanceLine = ({ theme }: RenderCryptoBalanceLine) => (
    <>
        <YAxis yAxisId="renderCryptoBalanceLine" domain={['auto', 'auto']} hide />
        <Line
            yAxisId="renderCryptoBalanceLine"
            type="linear"
            dataKey="value"
            stroke={theme.baseBorderWarning}
            dot={false}
            strokeWidth={1}
            strokeLinejoin="round"
            strokeLinecap="round"
            isAnimationActive={false}
            legendType="none"
        />
    </>
);
