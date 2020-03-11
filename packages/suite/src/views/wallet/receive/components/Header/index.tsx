import React from 'react';
import { H2, P } from '@trezor/components';
import { Account } from '@wallet-types';
import styled from 'styled-components';

interface Props {
    account: Account;
}

const Content = styled.div`
    margin: 0 0 24px 0;
`;

export default ({ account }: Props) => {
    if (account.networkType === 'bitcoin') {
        return (
            <Content>
                <H2>Receive {account.symbol.toUpperCase()}</H2>
                <P size="tiny">
                    To receive any funds you need to get a fresh receive address. It is advised to
                    always use a fresh one as this prevents anyone else to track your transactions.
                    You can reuse an address but we recommend not doing it unless it is necessary.
                </P>
            </Content>
        );
    }
    if (account.networkType === 'ethereum') {
        return (
            <Content>
                <H2>Receive {account.symbol.toUpperCase()}</H2>
                <P size="tiny">Use this address to receive tokens as well.</P>
            </Content>
        );
    }
    return <H2>Receive {account.symbol.toUpperCase()}</H2>;
};
