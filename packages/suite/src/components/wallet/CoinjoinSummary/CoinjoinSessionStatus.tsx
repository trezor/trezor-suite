import React from 'react';
import styled from 'styled-components';
import { Card, H3, Button } from '@trezor/components';
import { CoinBalance } from '@wallet-components';
import { stopCoinjoinSession } from '@wallet-actions/coinjoinAccountActions';
import { useActions } from '@suite-hooks';
import { CoinjoinSessionCounter } from './CoinjoinSessionCounter';
import { CoinjoinSessionDetail } from './CoinjoinSessionDetail';
import { Account, CoinjoinSession } from '@suite-common/wallet-types';

const Wrapper = styled(Card)`
    width: 100%;
    display: flex;
    flex-direction: row;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
    padding-right: 24px;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

interface CoinjoinSessionStatusProps {
    account: Account;
    session: CoinjoinSession;
}

export const CoinjoinSessionStatus = ({ account, session }: CoinjoinSessionStatusProps) => {
    const actions = useActions({
        stopCoinjoinSession,
    });
    return (
        <Wrapper>
            <Left>
                <H3>Running coinjoin</H3>
                <Row>
                    <CoinBalance value={account.formattedBalance} symbol={account.symbol} /> left
                </Row>
                <Row>
                    {session.signedRounds.length} of {session.maxRounds} rounds done
                </Row>
                <CoinjoinSessionCounter session={session} />
                <Row>
                    <Button onClick={() => actions.stopCoinjoinSession(account)}>
                        Stop coinjoin
                    </Button>
                </Row>
            </Left>
            <CoinjoinSessionDetail account={account} {...session} />
        </Wrapper>
    );
};
