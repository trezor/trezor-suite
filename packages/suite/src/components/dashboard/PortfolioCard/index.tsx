import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { Card } from '@suite-components';
import * as accountUtils from '@wallet-utils/accountUtils';
import { useDiscovery } from '@suite-hooks';
import { useFastAccounts, useFiatValue } from '@wallet-hooks';
import { goto } from '@suite-actions/routerActions';

import Header from './components/Header';
import Loading from './components/Loading';
import Exception from './components/Exception';
import EmptyWallet from './components/EmptyWallet';
import DashboardGraph from './components/DashboardGraph/Container';

const StyledCard = styled(Card)`
    flex-direction: column;
    min-height: 400px;
`;

const Body = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
`;

const PortfolioCard = React.memo(() => {
    const dispatch = useDispatch();
    const { fiat, localCurrency } = useFiatValue();
    const { discovery, getDiscoveryStatus } = useDiscovery();
    const accounts = useFastAccounts();

    const isDeviceEmpty = useMemo(() => accounts.every(a => a.empty), [accounts]);
    const portfolioValue = accountUtils
        .getTotalFiatBalance(accounts, localCurrency, fiat.coins)
        .toString();

    const discoveryStatus = getDiscoveryStatus();

    // TODO: DashboardGraph will get mounted twice (thus triggering data proccessing twice)
    // 1. DashboardGraph gets mounted
    // 2. Discovery starts, DashboardGraph is unmounted, Loading mounts
    // 3. Discovery stops (no accounts added), Loading unmounted, new instance of DashboardGraph gets mounted

    let body = null;
    if (discoveryStatus && discoveryStatus.status === 'exception') {
        body = <Exception exception={discoveryStatus} discovery={discovery} />;
    } else if (discoveryStatus && discoveryStatus.status === 'loading') {
        body = <Loading />;
    } else {
        body = isDeviceEmpty ? <EmptyWallet /> : <DashboardGraph accounts={accounts} />;
    }

    const isActionEnabled = !discoveryStatus && isDeviceEmpty;

    return (
        <StyledCard>
            <Header
                portfolioValue={portfolioValue}
                localCurrency={localCurrency}
                actionsEnabled={!!isActionEnabled}
                receiveClickHandler={() => dispatch(goto('wallet-receive'))}
            />
            <Body>{body}</Body>
        </StyledCard>
    );
});

export default PortfolioCard;
