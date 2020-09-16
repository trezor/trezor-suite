import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { Dropdown } from '@trezor/components';
import { Card, QuestionTooltip, Translation } from '@suite-components';
import { Section } from '@dashboard-components';
import * as accountUtils from '@wallet-utils/accountUtils';
import { useDiscovery } from '@suite-hooks';
import { useFastAccounts, useFiatValue } from '@wallet-hooks';
import { goto } from '@suite-actions/routerActions';

import Header from './components/Header';
import Loading from './components/Loading';
import Exception from './components/Exception';
import EmptyWallet from './components/EmptyWallet';
import DashboardGraph from './components/DashboardGraph/Container';
import GraphScaleDropdownItem from '@suite-components/TransactionsGraph/components/GraphScaleDropdownItem';

const StyledCard = styled(Card)`
    flex-direction: column;
    min-height: 400px;
`;

const Body = styled.div`
    display: flex;
    align-items: center;
    padding: 0px 20px;
    flex: 1;
`;

const TooltipWrapper = styled.div`
    margin-left: 8px;
    margin-bottom: 2px;
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

    // TODO: DashboardGraph will get mounted twice (thus triggering data processing twice)
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

    const isWalletEmpty = !discoveryStatus && isDeviceEmpty;
    const isWalletLoading = discoveryStatus?.status === 'loading' ?? false;
    const isWalletError = discoveryStatus?.status === 'exception' ?? false;
    const showGraphControls = !isWalletEmpty && !isWalletLoading && !isWalletError;

    const showMissingDataTooltip =
        showGraphControls &&
        !!accounts.find(a => a.networkType === 'ethereum' || a.networkType === 'ripple');

    return (
        <Section
            heading={
                <>
                    <Translation id="TR_MY_PORTFOLIO" />
                    {showMissingDataTooltip && (
                        <TooltipWrapper>
                            <QuestionTooltip size={18} messageId="TR_GRAPH_MISSING_DATA" />
                        </TooltipWrapper>
                    )}
                </>
            }
            actions={
                showGraphControls ? (
                    <Dropdown
                        alignMenu="right"
                        items={[
                            {
                                key: 'group1',
                                label: 'Graph View',
                                options: [
                                    {
                                        noHover: true,
                                        key: 'graphView',
                                        label: <GraphScaleDropdownItem />,
                                        callback: () => false,
                                    },
                                ],
                            },
                        ]}
                    />
                ) : undefined
            }
        >
            <StyledCard noPadding>
                <Header
                    portfolioValue={portfolioValue}
                    localCurrency={localCurrency}
                    isWalletEmpty={isWalletEmpty}
                    isWalletLoading={isWalletLoading}
                    isWalletError={isWalletError}
                    receiveClickHandler={() => dispatch(goto('wallet-receive'))}
                />
                <Body>{body}</Body>
            </StyledCard>
        </Section>
    );
});

export default PortfolioCard;
