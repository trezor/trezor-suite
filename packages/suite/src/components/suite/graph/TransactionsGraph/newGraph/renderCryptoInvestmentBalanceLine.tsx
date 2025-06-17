import { Line, YAxis } from 'recharts';
import { DefaultTheme } from 'styled-components';

export type RenderCryptoInvestmentBalanceLine = {
    theme: DefaultTheme;
};
export const renderCryptoInvestmentBalanceLine = ({ theme }: RenderCryptoInvestmentBalanceLine) => (
    <>
        <Line
            type="linear"
            dataKey="fiatValueInvestment"
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
