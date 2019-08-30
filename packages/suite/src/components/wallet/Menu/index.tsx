import React from 'react';
import { CoinLogo, colors, variables, Loader } from '@trezor/components';
import styled from 'styled-components';
import { AppState } from '@suite/types/suite';
import { connect } from 'react-redux';
import { networks } from '@suite-config';

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
    padding: 7px 15px;
    display: flex;
    height: 55px;
    cursor: pointer;
    transition: background-color 0.3s, color 0.3s;
    justify-content: space-between;

    &:hover {
        background-color: ${colors.GRAY_LIGHT};
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
    align-items: flex-end;
    justify-content: center;
    flex-direction: column;
    flex: 1;
`;

const Label = styled.span`
    display: flex;
    justify-content: center;
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

const getCoinName = (networkType: string, accountType: string) => {
    const result = networks.find(
        network => network.symbol === networkType && network.accountType === accountType,
    );
    return result ? result.name : 'unknown';
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
                <Row>
                    <Left>
                        <LogoWrapper>
                            <CoinLogo size={25} network={getCoinLogo(account.network)} />
                        </LogoWrapper>
                        <Name>
                            <CoinName>
                                {getCoinName(account.network, account.type || 'normal')}
                            </CoinName>
                            <AccountIndex>
                                <Label>ACCOUNT</Label>
                                {`#${account.index}`}
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
                                <TransactionsValue>{account.history.total}</TransactionsValue>
                                <Label>TRANSACTIONS</Label>
                            </Transactions>
                        )}
                    </Right>
                </Row>
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
