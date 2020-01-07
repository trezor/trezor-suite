import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import SuiteLayout from '@suite-components/SuiteLayout';
import AssetsCard from '@suite-components/AssetsCard';
import { Props } from './Container';
import * as accountUtils from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';
import PortfolioCard from '@suite-components/PortfolioCard';
import SecurityFeatures from '@suite-components/SecurityFeatures/Container';
import { DISCOVERY_STATUS } from '@wallet-reducers/discoveryReducer';
import NewsFeed from '@suite-components/NewsFeed';
import ConnectionStatusCard from '@suite-components/ConnectionStatusCard';

const Wrapper = styled.div`
    padding: 30px 50px;
`;

const Divider = styled.div`
    display: flex;
    margin-bottom: 20px;
`;

const Row = styled.div`
    display: flex;
`;

const StyledConnectionStatusCard = styled(ConnectionStatusCard)`
    margin-right: 20px;
`;

const Dashboard = (props: Props) => {
    const discovery = props.getDiscoveryForDevice();
    const { device } = props;
    const accounts = device
        ? accountUtils.sortByCoin(
              props.accounts.filter(a => a.deviceState === device.state && (!a.empty || a.visible)),
          )
        : [];
    const groupedAssets: { [key: string]: Account[] } = {};
    accounts.forEach(a => {
        if (!groupedAssets[a.symbol]) {
            groupedAssets[a.symbol] = [];
        }
        groupedAssets[a.symbol].push(a);
    });

    const deviceAccounts = device ? accountUtils.getDeviceAccounts(device, props.accounts) : [];
    const instanceBalance = accountUtils.getTotalBalance(
        deviceAccounts,
        props.localCurrency,
        props.fiat,
    );

    // @ts-ignore
    const isLoading = !discovery || (discovery && discovery.status === DISCOVERY_STATUS.RUNNING);

    return (
        <SuiteLayout>
            <Wrapper>
                <PortfolioCard
                    portfolioValue={instanceBalance}
                    localCurrency={props.localCurrency}
                    buyClickHandler={() => props.goto('wallet-account-receive')}
                    receiveClickHandler={() => props.goto('wallet-account-receive')}
                />
                <Divider />
                <AssetsCard
                    assets={groupedAssets}
                    localCurrency={props.localCurrency}
                    rates={props.fiat}
                    isLoading={isLoading}
                />
                <Divider />
                <SecurityFeatures />
                <Divider />
                <Row>
                    <StyledConnectionStatusCard />
                    <NewsFeed />
                </Row>
                <Divider />
            </Wrapper>
        </SuiteLayout>
    );
};

export default connect()(Dashboard);
