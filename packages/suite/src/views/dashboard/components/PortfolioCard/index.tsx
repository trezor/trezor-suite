import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { Dropdown } from '@trezor/components';
import { Card, QuestionTooltip, Translation } from '@suite-components';
import { Section } from '@dashboard-components';
import * as accountUtils from '@wallet-utils/accountUtils';
import { useDiscovery, useSelector, useActions } from '@suite-hooks';
import { useFastAccounts, useFiatValue } from '@wallet-hooks';
import { goto } from '@suite-actions/routerActions';
import { SkeletonTransactionsGraph } from '@suite-components/TransactionsGraph';
import * as suiteActions from '@suite-actions/suiteActions';

import Header from './components/Header';
import Exception from './components/Exception';
import EmptyWallet from './components/EmptyWallet';
import DashboardGraph from './components/DashboardGraph';
import GraphScaleDropdownItem from '@suite-components/TransactionsGraph/components/GraphScaleDropdownItem';

const StyledCard = styled(Card)`
    flex-direction: column;
`;

const Body = styled.div`
    display: flex;
    align-items: center;
    padding: 0px 20px;
    min-height: 329px;
    flex: 1;
`;

const PortfolioCard = React.memo(() => {
    const dispatch = useDispatch();
    const { fiat, localCurrency } = useFiatValue();
    const { discovery, getDiscoveryStatus } = useDiscovery();
    const accounts = useFastAccounts();
    const { dashboardGraphHidden } = useSelector(s => s.suite.flags);
    const { setFlag } = useActions({ setFlag: suiteActions.setFlag });

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
        body = dashboardGraphHidden ? null : (
            <SkeletonTransactionsGraph data-test="@dashboard/loading" />
        );
    } else if (isDeviceEmpty) {
        body = <EmptyWallet />;
    } else if (!dashboardGraphHidden) {
        body = <DashboardGraph accounts={accounts} />;
    }

    const isWalletEmpty = !discoveryStatus && isDeviceEmpty;
    const isWalletLoading = discoveryStatus?.status === 'loading' ?? false;
    const isWalletError = discoveryStatus?.status === 'exception' ?? false;
    const showGraphControls =
        !isWalletEmpty && !isWalletLoading && !isWalletError && !dashboardGraphHidden;

    const showMissingDataTooltip =
        showGraphControls &&
        !!accounts.find(a => a.networkType === 'ethereum' || a.networkType === 'ripple');

    return (
        <Section
            heading={
                <QuestionTooltip
                    size={18}
                    label="TR_MY_PORTFOLIO"
                    tooltip={showMissingDataTooltip ? 'TR_GRAPH_MISSING_DATA' : undefined}
                    iconStyle={{ marginBottom: 2, marginLeft: 4 }}
                />
            }
            actions={
                !isWalletEmpty && !isWalletLoading && !isWalletError ? (
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
                                    {
                                        key: 'hide',
                                        icon: dashboardGraphHidden ? 'SHOW' : 'HIDE',
                                        label: dashboardGraphHidden ? (
                                            <Translation id="TR_SHOW_GRAPH" />
                                        ) : (
                                            <Translation id="TR_HIDE_GRAPH" />
                                        ),
                                        callback: () => {
                                            setFlag('dashboardGraphHidden', !dashboardGraphHidden);
                                            return true;
                                        },
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
                    showGraphControls={showGraphControls}
                    hideBorder={!body}
                    portfolioValue={portfolioValue}
                    localCurrency={localCurrency}
                    isWalletEmpty={isWalletEmpty}
                    isWalletLoading={isWalletLoading}
                    isWalletError={isWalletError}
                    receiveClickHandler={() => dispatch(goto('wallet-receive'))}
                />

                {body && <Body>{body}</Body>}
            </StyledCard>
        </Section>
    );
});

export default PortfolioCard;
