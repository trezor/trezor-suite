import styled from 'styled-components';
import { H3 } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';

import { BalanceSection } from './BalanceSection';

const Container = styled.div`
    width: 100%;
    margin-bottom: 32px;
`;

const Heading = styled(H3)`
    margin-bottom: 28px;
`;

interface CoinjoinSummaryProps {
    accountKey: string;
}

export const CoinjoinSummary = ({ accountKey }: CoinjoinSummaryProps) => (
    <Container>
        <Heading>
            <Translation id="TR_MY_COINS" />
        </Heading>

        <BalanceSection accountKey={accountKey} />
    </Container>
);
