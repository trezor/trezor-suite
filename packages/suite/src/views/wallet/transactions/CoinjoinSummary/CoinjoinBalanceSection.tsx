import { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

import { selectHasAccountTransactions } from '@suite-common/wallet-core';
import { Card, Column } from '@trezor/components';
import { useSelector } from 'src/hooks/suite';
import { selectHasAnonymitySetError } from 'src/reducers/wallet/coinjoinReducer';
import { BalancePrivacyBreakdown } from './BalancePrivacyBreakdown/BalancePrivacyBreakdown';
import { CoinjoinBalanceError, CoinjoinBalanceErrorProps } from './CoinjoinBalanceError';
import { CoinjoinStatusWheel } from './CoinjoinStatusWheel/CoinjoinStatusWheel';

export const Container = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    height: 160px;
    align-items: center;
`;

interface CoinjoinBalanceSectionProps {
    accountKey: string;
}

export const CoinjoinBalanceSection = ({ accountKey }: CoinjoinBalanceSectionProps) => {
    const hasAnonymitySetError = useSelector(selectHasAnonymitySetError);
    const hasTransactions = useSelector(state => selectHasAccountTransactions(state, accountKey));

    const theme = useTheme();

    const errorMessageConfig = useMemo<CoinjoinBalanceErrorProps | undefined>(() => {
        if (hasAnonymitySetError) {
            return {
                headingId: 'TR_ERROR',
                messageId: 'TR_ANONYMITY_SET_ERROR',
                headingColor: theme.legacy.TYPE_RED,
            };
        }

        if (!hasTransactions) {
            return {
                headingId: 'TR_EMPTY_ACCOUNT_TITLE',
                messageId: 'TR_EMPTY_COINJOIN_ACCOUNT_SUBTITLE',
            };
        }
    }, [theme, hasAnonymitySetError, hasTransactions]);

    return (
        <Container>
            <Card width="100%" height="100%">
                <Column justifyContent="center" flex="1">
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
