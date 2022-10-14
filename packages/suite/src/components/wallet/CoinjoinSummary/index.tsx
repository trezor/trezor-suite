import React from 'react';
import styled from 'styled-components';

import { H3 } from '@trezor/components';
import { Account } from '@suite-common/wallet-types';
import { Translation } from '@suite-components/Translation';
import { AnonymityLevelSetup } from '@wallet-components/PrivacyAccount/AnonymityLevelSetup';
import { AnonymityChart } from './AnonymityChart';
import { BalanceSection } from './BalanceSection';

const Container = styled.div`
    width: 100%;
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
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
            <AnonymityLevelSetup />
        </Row>

        <BalanceSection account={account} />

        <AnonymityChart />
    </Container>
);
