import React from 'react';
import { CoinLogo, colors, variables, Loader } from '@trezor/components';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { getRoute } from '@suite-utils/router';
import { Link } from '@suite-components';
import { AppState } from '@suite-types';
import { NETWORKS } from '@suite-config';

import ProgressBar from './ProgressBar';

const Wrapper = styled.div``;

const LoadingWrapper = styled.div`
    display: flex;
    padding-top: 10px;
    justify-content: flex-start;
    align-items: center;
    padding-left: 20px;
`;

const LoadingText = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
    padding-left: 10px;
`;

const CoinName = styled.div``;

const Row = styled.div`
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

interface Props {
    suite: AppState['suite'];
    wallet: AppState['wallet'];
    router: AppState['router'];
    discovery: AppState['wallet']['discovery'];
}

const getLoadingProgress = (discovery: AppState['wallet']['discovery']) => {
    const d = discovery[0];
    if (d && d.loaded && d.total) {
        return Math.round((d.loaded / d.total) * 100);
    }
    return 0;
};

const getCoinName = (networkType: string, accountType = 'normal') => {
    const result = NETWORKS.filter(
        network => network.symbol === networkType && network.accountType === accountType,
    );
    return result[0].name;
};

const getCoinLogo = (network: string) => (network === 'test' ? 'btc' : network); // TODO add icon for testnet

const Menu = (props: Props) => (
    <Wrapper>
        <ProgressBar progress={getLoadingProgress(props.discovery)} />
        {props.wallet.accounts.length === 0 && ( // TODO check discovery progress not accounts
            <LoadingWrapper>
                <Loader size={15} />
                <LoadingText>Loading accounts</LoadingText>
            </LoadingWrapper>
        )}
        {props.wallet.accounts
            // .filter(account => !account.empty)
            .map(account => (
                <StyledLink
                    key={`${getCoinName(account.network, account.type)}-${account.accountType}`}
                    href={getRoute('wallet-account', {
                        coin: account.network,
                        accountId: account.index,
                    })}
                >
                    <Row>
                        <Left>
                            <LogoWrapper>
                                <CoinLogo size={25} network={getCoinLogo(account.network)} />
                            </LogoWrapper>
                            <Name>
                                <CoinName>{getCoinName(account.network, account.type)}</CoinName>
                                <AccountIndex>
                                    <Label>account</Label>
                                    {`#${account.index + 1}`}
                                </AccountIndex>
                            </Name>
                        </Left>
                        <Right>
                            <Balance>
                                <BalanceValue>
                                    {account.balance} {account.network}
                                </BalanceValue>
                            </Balance>
                            {account.history.total !== -1 && (
                                <Transactions>
                                    <Label>transactions</Label>
                                    <TransactionsValue>{account.history.total}</TransactionsValue>
                                </Transactions>
                            )}
                        </Right>
                    </Row>
                </StyledLink>
            ))}
    </Wrapper>
);

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
    suite: state.suite,
    router: state.router,
    discovery: state.wallet.discovery,
});

export default connect(mapStateToProps)(Menu);
