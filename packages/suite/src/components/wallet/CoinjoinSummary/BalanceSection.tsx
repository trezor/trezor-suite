import React, { useMemo } from 'react';
import styled from 'styled-components';

import { selectHasAccountTransactions } from '@suite-common/wallet-core';
import { Card, useTheme } from '@trezor/components';
import { useSelector } from 'src/hooks/suite';
import { selectHasAnonymitySetError } from 'src/reducers/wallet/coinjoinReducer';
import { BalancePrivacyBreakdown } from './BalancePrivacyBreakdown';
import { BalanceError, BalanceErrorProps } from './BalanceError';
import { CoinjoinStatusWheel } from './CoinjoinStatusWheel';

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

interface BalanceSectionProps {
    accountKey: string;
}

export const BalanceSection = ({ accountKey }: BalanceSectionProps) => {
    const hasAnonymitySetError = useSelector(selectHasAnonymitySetError);
    const hasTransactions = useSelector(state => selectHasAccountTransactions(state, accountKey));

    const theme = useTheme();

    const errorMessageConfig = useMemo<BalanceErrorProps | undefined>(() => {
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
                    <BalanceError {...errorMessageConfig} />
                ) : (
                    <BalancePrivacyBreakdown />
                )}
            </LeftSideContainer>

            <CoinjoinStatusWheel accountKey={accountKey} />
        </Container>
    );
};
