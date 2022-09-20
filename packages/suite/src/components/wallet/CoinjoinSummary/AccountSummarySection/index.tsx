import React from 'react';
import styled from 'styled-components';
import { AccountSummaryHeader } from './AccountSummaryHeader';
import { AnonymityChart } from './AnonymityChart';
import { BalanceSection } from './BalanceSection';

const Container = styled.div`
    width: 100%;
`;

interface AccountSummaryProps {
    onAnonymize: () => void;
}

export const AccountSummarySection = ({ onAnonymize }: AccountSummaryProps) => (
    <Container>
        <AccountSummaryHeader />

        <BalanceSection onAnonymize={onAnonymize} />

        <AnonymityChart />
    </Container>
);
