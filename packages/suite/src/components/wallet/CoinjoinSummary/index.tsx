import React from 'react';
import styled from 'styled-components';

import { H3 } from '@trezor/components';
import { Account } from '@suite-common/wallet-types';
import { Translation } from '@suite-components/Translation';
import { AnonymityIndicator } from '@wallet-components/PrivacyAccount/AnonymityIndicator';
import { AnonymityChart } from './AnonymityChart';
import { BalanceSection } from './BalanceSection';
import { CoinjoinLog } from './CoinjoinLog';
import { CoinjoinSessionCounter } from './CoinjoinSessionCounter';

const Container = styled.div`
    width: 100%;
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
`;

const StyledAnonymityIndicator = styled(AnonymityIndicator)`
    margin-left: auto;
`;

interface CoinjoinSummaryProps {
    account: Account;
}

export const CoinjoinSummary = ({ account }: CoinjoinSummaryProps) => (
    <Container>
        <Row>
            <H3>
                <Translation id="TR_MY_COINS" />
            </H3>
            <StyledAnonymityIndicator />
        </Row>

        <BalanceSection account={account} />

        <AnonymityChart />

        <CoinjoinSessionCounter />
        <CoinjoinLog />
    </Container>
);
