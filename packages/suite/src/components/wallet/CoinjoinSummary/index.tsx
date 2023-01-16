import React from 'react';
import styled from 'styled-components';
import { H3 } from '@trezor/components';
import { Translation } from '@suite-components/Translation';

import { BalanceSection } from './BalanceSection';
import { EmptyBalanceSection } from './EmptyBalanceSection';

const Container = styled.div`
    width: 100%;
    margin-bottom: 32px;
`;

const Heading = styled(H3)`
    margin-bottom: 28px;
`;

interface CoinjoinSummaryProps {
    accountKey: string;
    isEmpty: boolean;
}

export const CoinjoinSummary = ({ accountKey, isEmpty }: CoinjoinSummaryProps) => (
    <Container>
        <Heading>
            <Translation id="TR_MY_COINS" />
        </Heading>

        {isEmpty ? (
            <EmptyBalanceSection accountKey={accountKey} />
        ) : (
            <BalanceSection accountKey={accountKey} />
        )}
    </Container>
);
