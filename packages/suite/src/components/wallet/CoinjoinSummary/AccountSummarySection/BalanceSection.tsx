import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Card, Translation } from '@suite-components';
import { FundsPrivacyBreakdown } from './FundsPrivacyBreakdown';

const Container = styled(Card)`
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    align-items: center;
    margin-bottom: 10px;
`;

const AnonymizeButton = styled(Button)`
    justify-content: space-between;
    width: 154px;
    height: 46px;
    padding: 9px 18px;
`;

interface BalanceSectionProps {
    onAnonimize: () => void; // TEMPORARY
}

export const BalanceSection = ({ onAnonimize }: BalanceSectionProps) => {
    const isSessionActive = false;

    return (
        <Container>
            <FundsPrivacyBreakdown />

            {isSessionActive ? (
                <Translation id="TR_ANONYMIZING" />
            ) : (
                <AnonymizeButton onClick={onAnonimize} icon="ARROW_RIGHT_LONG" alignIcon="right">
                    <Translation id="TR_ANONYMIZE" />
                </AnonymizeButton>
            )}
        </Container>
    );
};
