import styled from 'styled-components';

import { selectLanguage } from '@suite/settings';
import { localizePercentage } from '@suite-common/wallet-utils';
import { Icon, type IconComponent } from '@trezor/components';
import { TrendDownIcon, TrendUpIcon } from '@trezor/icons';
import { type Color, typography } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

const PercentageWrapper = styled.div<{ $color: Color }>`
    ${typography['body-sm-strong']}
    gap: 4px;
    display: flex;
    align-items: center;
    color: ${({ theme, $color }) => theme[$color]};
`;

type Trend = 'up' | 'down' | 'stable';

const trendStyles: Record<Trend, { icon?: IconComponent; color: Color }> = {
    up: { icon: TrendUpIcon, color: 'contentBrand' },
    down: { icon: TrendDownIcon, color: 'contentCritical' },
    stable: { color: 'contentSecondary' },
};

export const calculatePercentageDifference = (a: number, b: number) => (a - b) / b;

// localizePercentage renders 1 decimal place, so a change below this rounds to ±0.0% and should
// be shown as neutral rather than as a tiny up/down move.
const NEUTRAL_TREND_THRESHOLD = 0.0005;

const getTrend = (percentageChange: number): Trend => {
    if (Math.abs(percentageChange) < NEUTRAL_TREND_THRESHOLD) return 'stable';
    if (percentageChange > 0) return 'up';
    if (percentageChange < 0) return 'down';

    return 'stable';
};

type TrendBadgeProps = {
    valueInFraction: number;
};

export const TrendBadge = ({ valueInFraction }: TrendBadgeProps) => {
    const locale = useSelector(selectLanguage);
    const trend = getTrend(valueInFraction);
    const { icon, color } = trendStyles[trend];
    // A change that rounds to ±0.0% is shown as a neutral "≈0%" instead of e.g. "-0.0%".
    const formattedChange =
        trend === 'stable' ? '≈0%' : localizePercentage({ valueInFraction, locale });

    return (
        <PercentageWrapper $color={color}>
            {icon !== undefined && <Icon as={icon} color={color} size={16} />}
            {formattedChange}
        </PercentageWrapper>
    );
};
