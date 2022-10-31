import React from 'react';
import styled from 'styled-components';

import { Account } from '@suite-common/wallet-types';
import { BalanceSection } from './BalanceSection';
import { SummaryHeader } from './SummaryHeader';
import { CoinjoinLog } from './CoinjoinLog';

const Container = styled.div`
    width: 100%;
`;

interface CoinjoinSummaryProps {
    account: Account;
}

export const CoinjoinSummary = ({ account }: CoinjoinSummaryProps) => (
    <Container>
        <SummaryHeader />

        <BalanceSection account={account} />

        <CoinjoinLog />
    </Container>
);
