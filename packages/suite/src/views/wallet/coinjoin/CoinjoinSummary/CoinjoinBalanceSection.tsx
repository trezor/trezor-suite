import { useMemo } from 'react';

import styled, { css, useTheme } from 'styled-components';

import { selectHasAnonymitySetError } from '@suite/coinjoin';
import { selectHasAccountTransactionHistory } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Card, Column } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { BalancePrivacyBreakdown } from './BalancePrivacyBreakdown/BalancePrivacyBreakdown';
import { CoinjoinBalanceError, type CoinjoinBalanceErrorProps } from './CoinjoinBalanceError';
import { CoinjoinStatusWheel } from './CoinjoinStatusWheel/CoinjoinStatusWheel';

export const Container = styled.div<{ $isStacked: boolean }>`
    display: flex;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    height: 200px;
    align-items: center;

    & > :last-child {
        width: initial;
        height: 100%;
        flex-shrink: 0;
    }

    ${({ $isStacked }) =>
        $isStacked &&
        css`
            flex-direction: column;
            align-items: stretch;
            height: auto;

            & > :last-child {
                height: 200px;
            }
        `}
`;

interface CoinjoinBalanceSectionProps {
    accountKey: AccountKey;
}

export const CoinjoinBalanceSection = ({ accountKey }: CoinjoinBalanceSectionProps) => {
    const hasAnonymitySetError = useSelector(selectHasAnonymitySetError);
    const hasAccountTransactionHistory = useSelector(state =>
        selectHasAccountTransactionHistory(state, accountKey),
    );

    const theme = useTheme();
    const isStacked = useIsContentBelowBreakpoint(breakpoints.tablet);

    const errorMessageConfig = useMemo<CoinjoinBalanceErrorProps | undefined>(() => {
        if (hasAnonymitySetError) {
            return {
                headingId: 'TR_ERROR',
                messageId: 'TR_ANONYMITY_SET_ERROR',
                headingColor: theme.contentCritical,
            };
        }

        if (!hasAccountTransactionHistory) {
            return {
                headingId: 'TR_EMPTY_ACCOUNT_TITLE',
                messageId: 'TR_EMPTY_COINJOIN_ACCOUNT_SUBTITLE',
            };
        }
    }, [theme, hasAnonymitySetError, hasAccountTransactionHistory]);

    return (
        <Container $isStacked={isStacked}>
            <Card width="100%" height="100%">
                <Column justifyContent="center" alignItems="center" height="100%">
                    {errorMessageConfig ? (
                        <CoinjoinBalanceError {...errorMessageConfig} />
                    ) : (
                        <BalancePrivacyBreakdown />
                    )}
                </Column>
            </Card>

            <CoinjoinStatusWheel accountKey={accountKey} />
        </Container>
    );
};
