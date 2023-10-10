import { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

import { selectHasAccountTransactions } from '@suite-common/wallet-core';
import { Card } from '@trezor/components';
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
    height: 150px;
    align-items: center;
`;

const LeftSideContainer = styled(Card)`
    width: 100%;
    height: 100%;
    justify-content: center;
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
                headingColor: theme.TYPE_RED,
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
            <LeftSideContainer>
                {errorMessageConfig ? (
                    <CoinjoinBalanceError {...errorMessageConfig} />
                ) : (
                    <BalancePrivacyBreakdown />
                )}
            </LeftSideContainer>

            <CoinjoinStatusWheel accountKey={accountKey} />
        </Container>
    );
};
