import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Row, Text } from '@trezor/components';
import { belowBreakpoint, breakpoints } from '@trezor/theme';

const HeaderLayout = styled.div`
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr) auto;
    gap: 2px 12px;
    align-items: center;
    width: 100%;
    min-width: 0;

    @media ${belowBreakpoint(breakpoints.mobile)} {
        row-gap: 8px;
    }
`;

const Navigation = styled.div`
    grid-column: 1;
    grid-row: 1 / span 2;
    margin-right: 4px;

    @media ${belowBreakpoint(breakpoints.mobile)} {
        grid-row: 1;
    }
`;

const IdentityIcon = styled.div`
    grid-column: 2;
    grid-row: 1 / span 2;

    @media ${belowBreakpoint(breakpoints.mobile)} {
        grid-row: 1;
    }
`;

const IdentityTitle = styled.div`
    grid-column: 3;
    grid-row: 1;
    min-width: 0;
`;

const IdentityMeta = styled.div`
    grid-column: 3;
    grid-row: 2;
    min-width: 0;
    overflow: hidden;

    @media ${belowBreakpoint(breakpoints.mobile)} {
        grid-column: 1 / -1;
    }
`;

const MetaValue = styled.div`
    min-width: 0;
    overflow: hidden;
`;

const BalanceValue = styled.div`
    flex-shrink: 0;
    white-space: nowrap;
`;

const Actions = styled.div`
    grid-column: 4;
    grid-row: 1 / span 2;
    margin-left: auto;

    @media ${belowBreakpoint(breakpoints.mobile)} {
        grid-row: 1;
    }
`;

type EarnAccountPageHeaderGridProps = {
    title: ReactNode;
    backButton: ReactNode;
    tokenIcon?: ReactNode;
    accountLabel?: ReactNode;
    balance?: ReactNode;
    actions?: ReactNode;
    isBelowMobile: boolean;
};

export const EarnAccountPageHeaderGrid = ({
    title,
    backButton,
    tokenIcon,
    accountLabel,
    balance,
    actions,
    isBelowMobile,
}: EarnAccountPageHeaderGridProps) => (
    <HeaderLayout>
        <Navigation>{backButton}</Navigation>

        {tokenIcon != null && <IdentityIcon>{tokenIcon}</IdentityIcon>}

        <IdentityTitle>
            <Text
                as="div"
                typographyStyle="body-md-strong"
                ellipsisLineCount={isBelowMobile ? 2 : 1}
            >
                {title}
            </Text>
        </IdentityTitle>

        {accountLabel != null && (
            <IdentityMeta>
                <Row alignItems="center" gap={isBelowMobile ? 8 : 24} overflow="hidden">
                    <MetaValue>{accountLabel}</MetaValue>
                    {isBelowMobile && balance != null && (
                        <Text intent="neutral" priority="secondary">
                            •
                        </Text>
                    )}
                    {balance != null && <BalanceValue>{balance}</BalanceValue>}
                </Row>
            </IdentityMeta>
        )}

        {actions != null && <Actions>{actions}</Actions>}
    </HeaderLayout>
);
