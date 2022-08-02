import React from 'react';
import styled from 'styled-components';
import { useSelector } from '@suite-hooks';
import { Account } from '@suite-common/wallet-types';
import { CoinjoinSetup } from './CoinjoinSetup';
import { CoinjoinSessionStatus } from './CoinjoinSessionStatus';

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    width: 100%;
    margin-bottom: 24px;
`;

interface CoinjoinSummaryProps {
    account: Account;
}

export const CoinjoinSummary = ({ account }: CoinjoinSummaryProps) => {
    const { coinjoin } = useSelector(state => ({
        coinjoin: state.wallet.coinjoin,
    }));
    const session = coinjoin.accounts.find(a => a.key === account.key)?.session;

    return (
        <Wrapper>
            {session ? (
                <CoinjoinSessionStatus account={account} session={session} />
            ) : (
                <CoinjoinSetup account={account} />
            )}
        </Wrapper>
    );
};
