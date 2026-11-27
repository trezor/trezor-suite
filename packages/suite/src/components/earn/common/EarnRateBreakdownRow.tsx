import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Column, Text } from '@trezor/components';
import { belowBreakpoint, breakpoints } from '@trezor/theme';

const RateRow = styled.div`
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;

    @media ${belowBreakpoint(breakpoints.mobile)} {
        grid-template-columns: auto minmax(0, 1fr);
        align-items: start;
    }
`;

const RateValue = styled.div`
    white-space: nowrap;

    @media ${belowBreakpoint(breakpoints.mobile)} {
        grid-column: 2;
    }
`;

type EarnRateBreakdownRowProps = {
    icon: ReactNode;
    symbol: ReactNode;
    description?: ReactNode;
    value: ReactNode;
    hasRate: boolean;
};

export const EarnRateBreakdownRow = ({
    icon,
    symbol,
    description,
    value,
    hasRate,
}: EarnRateBreakdownRowProps) => (
    <RateRow>
        {icon}
        <Column flex="1">
            <Text data-testid="@earn/dashboard/apy-breakdown/symbol" typographyStyle="body-sm">
                {symbol}
            </Text>
            {description && (
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    data-testid="@earn/dashboard/apy-breakdown/description"
                >
                    {description}
                </Text>
            )}
        </Column>
        <RateValue>
            <Text
                typographyStyle="body-sm"
                intent={hasRate ? 'brand' : 'neutral'}
                priority={hasRate ? 'primary' : 'secondary'}
                data-testid="@earn/dashboard/apy-breakdown/rate-percent"
            >
                {value}
            </Text>
        </RateValue>
    </RateRow>
);
