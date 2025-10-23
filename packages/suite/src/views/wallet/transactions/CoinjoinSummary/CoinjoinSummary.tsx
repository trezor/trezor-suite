import styled from 'styled-components';

import { H3 } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

import { CoinjoinBalanceSection } from './CoinjoinBalanceSection';

const Container = styled.div`
    width: 100%;
    margin-bottom: 32px;
`;

interface CoinjoinSummaryProps {
    accountKey: string;
}

export const CoinjoinSummary = ({ accountKey }: CoinjoinSummaryProps) => (
    <Container>
        <H3 margin={{ bottom: 24 }}>
            <Translation id="TR_MY_COINS" />
        </H3>

        <CoinjoinBalanceSection accountKey={accountKey} />
    </Container>
);
