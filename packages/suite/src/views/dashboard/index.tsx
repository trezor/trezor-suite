import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import SuiteLayout from '@suite-components/SuiteLayout';
import AssetsCard from '@suite-components/AssetsCard';
import SecurityFeatures from '@suite-components/SecurityFeatures/Container';
import ConnectionStatusCard from '@suite-components/ConnectionStatusCard';
import PortfolioCard from '@suite-components/PortfolioCard';
import NewsFeed from '@suite-components/NewsFeed';
import AuthConfirm from '@suite-components/Notifications/components/AuthConfirm';
import * as accountUtils from '@wallet-utils/accountUtils';
import { DISCOVERY } from '@wallet-actions/constants';
import { Account } from '@wallet-types';
import { Props } from './Container';

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

    const deviceAccounts = device ? accountUtils.getAllAccounts(device.state, props.accounts) : [];
    const instanceBalance = accountUtils.getTotalBalance(
        deviceAccounts,
        props.localCurrency,
        props.fiat,
    );

    const isLoading = !discovery || (discovery && discovery.status < DISCOVERY.STATUS.STOPPING);

    return (
        <SuiteLayout>
            {device && device.authConfirm && <AuthConfirm />}
            <Wrapper data-test="@dashboard/index">
                <PortfolioCard
                    portfolioValue={instanceBalance}
                    localCurrency={props.localCurrency}
                    buyClickHandler={() => props.goto('wallet-receive')}
                    receiveClickHandler={() => props.goto('wallet-receive')}
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
