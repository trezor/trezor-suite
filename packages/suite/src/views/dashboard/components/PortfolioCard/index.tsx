import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
// import { SelectBar, Dropdown, DropdownMenuItemProps } from '@trezor/components';
import { Card, Translation } from '@suite-components';
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

const StyledCard = styled(Card)`
    flex-direction: column;
    min-height: 400px;
`;

const Body = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
`;

// const DropdownMenuItem = styled.div<DropdownMenuItemProps>`
//     display: flex;
//     padding: 6px 16px 16px 16px;
// `;

const PortfolioCard = React.memo(() => {
    const dispatch = useDispatch();
    const { fiat, localCurrency } = useFiatValue();
    const { discovery, getDiscoveryStatus } = useDiscovery();
    const accounts = useFastAccounts();

    // const { selectedView, setSelectedView } = useGraph();

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
    // const showGraphControls = !isWalletEmpty && !isWalletLoading && !isWalletError;

    return (
        <Section
            heading={<Translation id="TR_MY_PORTFOLIO" />}
            // TODO: enabled once logarithmic scale is implemented
            // actions={
            //     showGraphControls ? (
            //         <Dropdown
            //             alignMenu="right"
            //             components={{
            //                 DropdownMenuItem,
            //             }}
            //             items={[
            //                 {
            //                     key: 'group1',
            //                     label: 'Graph View',
            //                     options: [
            //                         {
            //                             key: 'graphView',
            //                             label: (
            //                                 <SelectBar
            //                                     onChange={option => {
            //                                         setSelectedView(option as 'linear' | 'log');
            //                                         return false;
            //                                     }}
            //                                     selectedOption={selectedView}
            //                                     options={[
            //                                         { label: 'Linear', value: 'linear' },
            //                                         { label: 'Logarithmic', value: 'log' },
            //                                     ]}
            //                                 />
            //                             ),
            //                             callback: () => false,
            //                         },
            //                     ],
            //                 },
            //             ]}
            //         />
            //     ) : undefined
            // }
        >
            <StyledCard>
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
