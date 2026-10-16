import styled from 'styled-components';

import { type AccountKey } from '@suite-common/wallet-types';
import { Translation } from '@suite-lego/intl';
import { H3 } from '@trezor/components';

import { CoinjoinBalanceSection } from './CoinjoinBalanceSection';

const Container = styled.div`
    width: 100%;
`;

interface CoinjoinSummaryProps {
    accountKey: AccountKey;
}

export const CoinjoinSummary = ({ accountKey }: CoinjoinSummaryProps) => (
    <Container>
        <H3 margin={{ bottom: 24 }}>
            <Translation id="TR_MY_COINS" />
        </H3>

        <CoinjoinBalanceSection accountKey={accountKey} />
    </Container>
);
