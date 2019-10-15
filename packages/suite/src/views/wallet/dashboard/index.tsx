import React from 'react';
import { connect } from 'react-redux';
import BigNumber from 'bignumber.js';
// import { bindActionCreators } from 'redux';
// import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { H4, CoinLogo, colors, variables, Loader } from '@trezor/components';
import WalletLayout from '@wallet-components/WalletLayout';
// import l10nCommonMessages from '@wallet-views/messages';
import { sortByCoin } from '@wallet-utils/accountUtils';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { NETWORKS } from '@wallet-config';
import { AppState, Dispatch } from '@suite-types';
import { Network, Account } from '@wallet-types';
// import l10nMessages from './index.messages';

const Content = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const CardsWrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
`;

const Card = styled.div`
    border: 1px solid ${colors.GRAY_LIGHT};
    flex: 1;
    border-radius: 4px;
    padding: 10px;
    min-width: 180px;
    margin: 4px;
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
    flex-direction: row;
    align-items: center;
`;

const Details = styled.div`
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

const mapStateToProps = (state: AppState) => ({
    accounts: state.wallet.accounts,
    discovery: state.wallet.discovery,
    settings: state.wallet.settings,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getDiscoveryForDevice: () => dispatch(discoveryActions.getDiscoveryForDevice()),
    // getDiscoveryForDevice: bindActionCreators(discoveryActions.getDiscoveryForDevice, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

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
                <DetailItem>Total transactions: {totalTransactions}</DetailItem>
            </Details>
        </Card>
    );
};

const Dashboard = (props: Props) => {
    const discovery = props.getDiscoveryForDevice();
    const accounts = discovery
        ? sortByCoin(
              props.accounts.filter(
                  a => a.deviceState === discovery.deviceState && (!a.empty || a.visible),
              ),
          )
        : [];
    const group: { [key: string]: Account[] } = {};
    accounts.forEach(a => {
        if (!group[a.symbol]) {
            group[a.symbol] = [];
        }
        group[a.symbol].push(a);
    });

    return (
        <WalletLayout title="Dashboard | Trezor Suite">
            <Content data-test="Dashboard__page__content">
                <H4>Dashboard</H4>
                <CardsWrapper>
                    {!discovery && <Loader size={32} />}
                    {Object.keys(group).map(symbol => {
                        const network = NETWORKS.find(
                            n => n.symbol === symbol && !n.accountType,
                        ) as Network;
                        return (
                            <NetworkGroup key={symbol} network={network} accounts={group[symbol]} />
                        );
                    })}
                </CardsWrapper>
            </Content>
        </WalletLayout>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Dashboard);
