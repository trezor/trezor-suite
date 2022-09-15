import React from 'react';
import styled from 'styled-components';
import { AccountSummaryHeader } from './AccountSummaryHeader';
import { AnonymityChart } from './AnonymityChart';
import { BalanceSection } from './BalanceSection';

const Container = styled.div`
    width: 100%;
`;

interface AccountSummaryProps {
    onAnonimize: () => void;
}

export const AccountSummarySection = ({ onAnonimize }: AccountSummaryProps) => (
    <Container>
        <AccountSummaryHeader />

        <BalanceSection onAnonimize={onAnonimize} />

        <AnonymityChart />
    </Container>
);
