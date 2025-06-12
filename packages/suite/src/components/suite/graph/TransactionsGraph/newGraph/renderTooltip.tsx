import { Tooltip } from 'recharts';
import { GraphTooltip } from './GraphTooltip';
import { DefaultTheme } from 'styled-components';

export type RenderTooltipProps = {
    theme: DefaultTheme;
    localCurrency: string;
};

export const renderTooltip = ({ theme, localCurrency }: RenderTooltipProps) => {
    return (
        <Tooltip
            animationDuration={50}
            cursor={{
                stroke: theme.backgroundNeutralBold,
                strokeWidth: 2,
                strokeDasharray: '3 6',

                strokeLinejoin: 'round',
                strokeLinecap: 'round',
            }}
            content={<GraphTooltip localCurrency={localCurrency} />}
        />
    );
};
