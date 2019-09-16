import React from 'react';
import { CoinLogo, colors, variables } from '@trezor/components';
import styled from 'styled-components';
import { getRoute } from '@suite-utils/router';
import { Link } from '@suite-components';
import { NETWORKS } from '@suite-config';
import { Account } from '@wallet-types';

const Wrapper = styled.div`
    padding: 0 15px;
    display: flex;
    height: 55px;
    cursor: pointer;
    transition: background-color 0.3s, color 0.3s;
    justify-content: space-between;

    &:hover {
        background-color: ${colors.GRAY_LIGHT};
    }

    &:first-child {
        padding-top: 0;
    }
`;

const CoinName = styled.div``;

const LogoWrapper = styled.div`
    min-width: 40px;
    display: flex;
    align-items: center;
`;

const AccountIndex = styled.div`
    display: flex;
    align-items: center;
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const BalanceValue = styled.div`
    text-transform: uppercase;
    font-size: ${variables.FONT_SIZE.BIG};
`;

const Left = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;

const Name = styled.div`
    display: flex;
    flex-direction: column;
    font-size: ${variables.FONT_SIZE.BIG};
    color: ${colors.TEXT_PRIMARY};
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    align-items: flex-end;
    justify-content: center;
    flex-direction: column;
`;

const Label = styled.span`
    display: flex;
    justify-content: center;
    text-transform: uppercase;
    padding-right: 3px;
    font-size: ${variables.FONT_SIZE.COUNTER};
    color: ${colors.TEXT_SECONDARY};
`;

const Balance = styled.div`
    display: flex;
    align-items: center;
`;

const Transactions = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.COUNTER};
    align-items: center;
`;

const TransactionsValue = styled.div`
    display: flex;
    padding-right: 2px;
    align-items: center;
`;

// todo make no style link component
const StyledLink = styled(Link)`
    display: flex;
    flex-direction: column;
    color: ${colors.TEXT_PRIMARY};

    &:focus,
    &:hover,
    &:visited,
    &:link,
    &:active {
        color: ${colors.TEXT_PRIMARY};
        text-decoration: none;
    }
`;

const getCoinName = (symbol: string, accountType: string) => {
    const result = NETWORKS.filter(
        network => network.symbol === symbol && (network.accountType || 'normal') === accountType,
    );
    return result[0].name;
};

interface Props {
    account: Account;
}

const Row = React.memo(({ account }: Props) => (
    <StyledLink
        href={getRoute('wallet-account', {
            accountId: account.index,
            symbol: account.symbol,
            accountType: account.accountType,
        })}
    >
        <Wrapper>
            <Left>
                <LogoWrapper>
                    <CoinLogo size={25} symbol={account.symbol} />
                </LogoWrapper>
                <Name>
                    <CoinName>{getCoinName(account.symbol, account.accountType)}</CoinName>
                    <AccountIndex>
                        <Label>account</Label>
                        {`#${account.index + 1}`}
                    </AccountIndex>
                </Name>
            </Left>
            <Right>
                <Balance>
                    <BalanceValue>
                        {account.balance} {account.symbol}
                    </BalanceValue>
                </Balance>
                {account.history.total !== -1 && (
                    <Transactions>
                        <Label>transactions</Label>
                        <TransactionsValue>{account.history.total}</TransactionsValue>
                    </Transactions>
                )}
            </Right>
        </Wrapper>
    </StyledLink>
));

export default Row;
