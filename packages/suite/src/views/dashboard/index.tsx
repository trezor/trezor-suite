import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import SuiteLayout from '@suite-components/SuiteLayout';
import AssetsCard from '@suite/components/suite/AssetsCard';
import { Props } from './Container';
import * as accountUtils from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';
import Card from '@suite-components/Card';
import PortfolioCard from '@suite-components/PortfolioCard';
import { DISCOVERY_STATUS } from '@wallet-reducers/discoveryReducer';

const Wrapper = styled.div`
    padding: 30px 50px;
`;

const Divider = styled.div`
    margin-bottom: 20px;
`;

const PlaceholderCard = styled(Card)`
    min-height: 100px;
    align-content: center;
    justify-content: center;
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
    const isLoading = !discovery || discovery && discovery.status === DISCOVERY_STATUS.RUNNING;

    return (
        <SuiteLayout>
            <Wrapper>
                <Divider>
                    <PortfolioCard
                        portfolioValue={instanceBalance.toString()}
                        localCurrency={props.localCurrency}
                        buyClickHandler={() => props.goto('wallet-account-receive')}
                        receiveClickHandler={() => props.goto('wallet-account-receive')}
                    />
                </Divider>
                <Divider>
                    <AssetsCard
                        assets={groupedAssets}
                        localCurrency={props.localCurrency}
                        rates={props.fiat}
                        isLoading={isLoading}
                    />
                </Divider>
                <Divider>
                    <PlaceholderCard>placeholder</PlaceholderCard>
                </Divider>
                <Divider>
                    <PlaceholderCard>placeholder</PlaceholderCard>{' '}
                </Divider>
            </Wrapper>
        </SuiteLayout>
    );
};

export default connect()(Dashboard);
