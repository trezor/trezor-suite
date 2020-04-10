import React from 'react';
import { H2, P } from '@trezor/components';
import { Account } from '@wallet-types';
import styled from 'styled-components';
import { Translation } from '@suite-components';

interface Props {
    account: Account;
}

const Content = styled.div`
    margin: 0 0 24px 0;
`;

export default ({ account }: Props) => {
    const title = (
        <Translation id="RECEIVE_TITLE" values={{ symbol: account.symbol.toUpperCase() }} />
    );
    if (account.networkType === 'bitcoin') {
        return (
            <Content>
                <H2>{title}</H2>
                {/* temp disable description to get consistent looks across tabs */}
                {/* <P size="tiny">
                    <Translation id="RECEIVE_DESC_BITCOIN" />
                </P> */}
            </Content>
        );
    }
    if (account.networkType === 'ethereum') {
        return (
            <Content>
                <H2>{title}</H2>
                <P size="tiny">
                    <Translation id="RECEIVE_DESC_ETHEREUM" />
                </P>
            </Content>
        );
    }
    return <H2>{title}</H2>;
};
