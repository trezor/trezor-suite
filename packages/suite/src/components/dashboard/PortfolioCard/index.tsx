import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { Card } from '@suite-components';
import * as accountUtils from '@wallet-utils/accountUtils';
import { useDiscovery } from '@suite-hooks';
import { useAccounts, useFiatValue } from '@wallet-hooks';
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
`;

const PortfolioCard = () => {
    const dispatch = useDispatch();
    const { fiat, localCurrency } = useFiatValue();
    const { discovery, getDiscoveryStatus } = useDiscovery();
    const { accounts } = useAccounts(discovery);

    const isDeviceEmpty = accounts.every(a => a.empty);
    const portfolioValue = accountUtils
        .getTotalFiatBalance(accounts, localCurrency, fiat)
        .toString();

    const discoveryStatus = getDiscoveryStatus();

    const getBody = () => {
        if (!discoveryStatus) return;
        if (discoveryStatus.status === 'loading') {
            return <Loading />;
        }
        return <Exception exception={discoveryStatus} discovery={discovery} />;
    };

    let body = getBody();
    if (!body) {
        body = isDeviceEmpty ? (
            <EmptyWallet />
        ) : (
            <DashboardGraph discoveryInProgress={!!discoveryStatus} accounts={accounts} />
        );
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
};

export default PortfolioCard;
