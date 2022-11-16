import React from 'react';
import styled from 'styled-components';

import { BalanceSection } from './BalanceSection';
import { SummaryHeader } from './SummaryHeader';
import { CoinjoinLog } from './CoinjoinLog';

const Container = styled.div`
    width: 100%;
    margin-bottom: 24px;
`;

interface CoinjoinSummaryProps {
    accountKey: string;
}

export const CoinjoinSummary = ({ accountKey }: CoinjoinSummaryProps) => (
    <Container>
        <SummaryHeader />

        <BalanceSection accountKey={accountKey} />

        <CoinjoinLog />
    </Container>
);
