import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Column, Divider, Icon, Row, Text } from '@trezor/components';
import { ChartLineIcon } from '@trezor/icons';
import { belowBreakpoint, breakpoints } from '@trezor/theme';

const RateList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;

    @media ${belowBreakpoint(breakpoints.mobile)} {
        gap: 0;

        & > *:not(:first-child) {
            border-top: 1px solid ${({ theme }) => theme.borderNeutral};
            padding-top: 16px;
        }

        & > *:not(:last-child) {
            padding-bottom: 16px;
        }
    }
`;

type EarnRateBreakdownProps = {
    children: ReactNode;
    footer: ReactNode;
};

export const EarnRateBreakdown = ({ children, footer }: EarnRateBreakdownProps) => (
    <Column gap={16} padding={{ vertical: 10, horizontal: 8 }}>
        <RateList>{children}</RateList>
        <Divider margin={0} />
        <Row gap={4} alignItems="center">
            <Icon as={ChartLineIcon} size={14} intent="neutral" priority="secondary" />
            <Text
                data-testid="@earn/dashboard/apy-breakdown/footer"
                typographyStyle="body-sm"
                intent="neutral"
                priority="secondary"
            >
                {footer}
            </Text>
        </Row>
    </Column>
);
