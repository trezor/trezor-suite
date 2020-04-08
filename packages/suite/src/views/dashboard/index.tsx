import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { LayoutContext } from '@suite-components';
// ConnectionStatusCard
import { AssetsCard, PortfolioCard, SecurityFeatures, NewsFeed } from '@dashboard-components';
import AuthConfirmFailed from '@wallet-components/AccountMode/AuthConfirmFailed';
import * as accountUtils from '@wallet-utils/accountUtils';
import { DISCOVERY } from '@wallet-actions/constants';
import { Account } from '@wallet-types';
import { Props } from './Container';

const Wrapper = styled.div`
    padding: 0px 32px 32px 32px;
    padding-top: 16px;
`;

const Divider = styled.div`
    display: flex;
    margin-bottom: 20px;
`;

const Row = styled.div`
    display: flex;
`;

// const StyledConnectionStatusCard = styled(ConnectionStatusCard)`
//     margin-right: 20px;
// `;

// similar to @wallet-actions/selectedAccountActions
const getDashboardMode = (props: Props, isLoading: boolean) => {
    const { device } = props;
    if (!device) {
        return {
            status: 'loading',
            type: 'waiting-for-device',
        } as const;
    }
    if (device.authFailed) {
        return {
            status: 'exception',
            type: 'auth-failed',
        } as const;
    }
    if (device.authConfirm) {
        return {
            status: 'exception',
            type: 'auth-confirm-failed',
        } as const;
    }
    if (!device.state) {
        return {
            status: 'loading',
            type: 'auth',
        } as const;
    }
    if (isLoading) {
        return {
            status: 'loading',
            type: 'discovery',
        } as const;
    }

    // if (discovery.networks.length === 0) {
    //     return {
    //         status: 'exception',
    //         loader: 'discovery-empty',
    //     };
    // }
};

const Dashboard = (props: Props) => {
    const { setLayout } = React.useContext(LayoutContext);
    React.useMemo(() => {
        if (setLayout) setLayout(undefined, undefined);
    }, [setLayout]);

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
    const isDeviceEmpty = device ? deviceAccounts.every(a => a.empty) : null;
    const instanceBalance = accountUtils.getTotalFiatBalance(
        deviceAccounts,
        props.localCurrency,
        props.fiat,
    );

    const isLoading = !discovery || (discovery && discovery.status < DISCOVERY.STATUS.STOPPING);
    const dashboardMode = getDashboardMode(props, isLoading);
    const isDisabled = isLoading || !!dashboardMode;

    return (
        <>
            {device && device.authConfirm && <AuthConfirmFailed />}
            <Wrapper data-test="@dashboard/index">
                <PortfolioCard
                    mode={dashboardMode}
                    isDeviceEmpty={isDeviceEmpty}
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
                <SecurityFeatures isDisabled={isDisabled} />
                <Divider />
                <Row>
                    {/* <StyledConnectionStatusCard /> */}
                    <NewsFeed />
                </Row>
                <Divider />
            </Wrapper>
        </>
    );
};

export default connect()(Dashboard);
