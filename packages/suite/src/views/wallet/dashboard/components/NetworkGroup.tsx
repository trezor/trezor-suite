import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { CoinLogo, colors, variables } from '@trezor/components';
import { Network, Account } from '@wallet-types';

const Card = styled.div`
    border: 1px solid ${colors.GRAY_LIGHT};
    border-radius: 4px;
`;

const StyledCoinLogo = styled(CoinLogo)`
    opacity: 0.7;
    transition: opacity 0.2s ease-in-out;
    cursor: pointer;

    &:hover {
        opacity: 1;
    }
`;

const Header = styled.div`
    display: flex;
    padding: 10px;
    flex-direction: row;
    align-items: center;
`;

const Details = styled.div`
    padding: 10px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
    padding-top: 4px;
    padding-left: 38px;
`;

const DetailItem = styled.div`
    display: flex;
    flex-direction: row;
`;

const Name = styled.div`
    padding-left: 12px;
    font-size: ${variables.FONT_SIZE.BIG};
    color: ${colors.TEXT_PRIMARY};
`;

interface NetworkGroup {
    accounts: Account[];
    network: Network;
}

const NetworkGroup = ({ accounts, network }: NetworkGroup) => {
    const totalBalance = accounts.reduce((prev, a) => {
        const bn = new BigNumber(prev).plus(a.formattedBalance);
        return bn.toString();
    }, '0');
    const totalTransactions = accounts.reduce((prev, a) => {
        const bn = new BigNumber(prev).plus(a.history.total);
        return bn.toString();
    }, '0');
    return (
        <Card>
            <Header>
                <StyledCoinLogo symbol={network.symbol} size={26} />
                <Name>{network.name}</Name>
            </Header>
            <Details>
                <DetailItem>Accounts used: {accounts.length}</DetailItem>
                <DetailItem>
                    Total balance: {totalBalance} {network.symbol.toUpperCase()}
                </DetailItem>
                {network.networkType !== 'ripple' && (
                    <DetailItem>Total transactions: {totalTransactions}</DetailItem>
                )}
            </Details>
        </Card>
    );
};

export default NetworkGroup;
