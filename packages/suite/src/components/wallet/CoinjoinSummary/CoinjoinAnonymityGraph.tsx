import React from 'react';
import styled from 'styled-components';
import { Card, variables } from '@trezor/components';
import { CoinBalance } from '@wallet-components';
import { Account } from '@suite-common/wallet-types';

const AnonymityCard = styled(Card)`
    width: 250px;
    flex: 1;
`;

const Graph = styled(Card)`
    width: 100%;
    height: 150px;
    background: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const Balance = styled.div`
    padding-top: 12px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

interface AnonymityGraphProps {
    account: Account;
}

export const CoinjoinAnonymityGraph = ({ account }: AnonymityGraphProps) => (
    <AnonymityCard>
        <Graph />
        <Balance>
            <Row>
                Not private:
                <CoinBalance value={account.formattedBalance} symbol={account.symbol} />
            </Row>
            <Row>
                Private: <CoinBalance value="0" symbol={account.symbol} />
            </Row>
        </Balance>
    </AnonymityCard>
);
