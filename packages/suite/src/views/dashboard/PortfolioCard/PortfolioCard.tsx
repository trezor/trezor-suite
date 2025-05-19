import { memo, useMemo } from 'react';

import { selectCurrentFiatRates, selectLocalCurrency } from '@suite-common/wallet-core';
import { Card, Column, Dropdown, Switch, Tooltip } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { setFlag } from 'src/actions/suite/suiteActions';
import { DashboardSection } from 'src/components/dashboard';
import { GraphScaleDropdownItem, GraphSkeleton, Translation } from 'src/components/suite';
import { useDevice, useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { useFastAccounts } from 'src/hooks/wallet';
import { useTotalFiatBalance } from 'src/hooks/wallet/useTotalFiatBalance';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { DashboardGraph } from './DashboardGraph';
import { EmptyWallet } from './EmptyWallet';
import { PortfolioCardException } from './PortfolioCardException';
import { PortfolioCardHeader } from './PortfolioCardHeader';

export const PortfolioCard = memo(() => {
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const localCurrency = useSelector(selectLocalCurrency);
    const { discovery, isDiscoveryRunning } = useDiscovery();
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const accounts = useFastAccounts();
    const { dashboardGraphHidden } = useSelector(s => s.suite.flags);
    const dispatch = useDispatch();
    const { device } = useDevice();

    const isDeviceEmpty = useMemo(() => accounts.every(a => a.empty), [accounts]);
    const walletBalance = useTotalFiatBalance(accounts, localCurrency, currentFiatRates);

    // TODO: DashboardGraph will get mounted twice (thus triggering data processing twice)
    // 1. DashboardGraph gets mounted
    // 2. Discovery starts, DashboardGraph is unmounted, Loading mounts
    // 3. Discovery stops (no accounts added), Loading unmounted, new instance of DashboardGraph gets mounted

    let body = null;
    if (discoveryStatus && discoveryStatus.status === 'exception') {
        body = <PortfolioCardException exception={discoveryStatus} discovery={discovery} />;
    } else if (discoveryStatus && discoveryStatus.status === 'loading') {
        body = dashboardGraphHidden ? null : (
            <Column height={320}>
                <GraphSkeleton data-testid="@dashboard/loading" />
            </Column>
        );
    } else if (isDeviceEmpty) {
        body = <EmptyWallet />;
    } else if (!dashboardGraphHidden) {
        body = <DashboardGraph accounts={accounts} />;
    }

    const isWalletEmpty = !discoveryStatus && isDeviceEmpty;
    const isWalletLoading = discoveryStatus?.status === 'loading';
    const isWalletError = discoveryStatus?.status === 'exception';
    const showGraphControls =
        !isWalletEmpty && !isWalletLoading && !isWalletError && !dashboardGraphHidden;

    const showMissingDataTooltip =
        showGraphControls &&
        !hasBitcoinOnlyFirmware(device) &&
        !!accounts.some(
            account =>
                account.history &&
                (account.tokens?.length ||
                    ['ripple', 'solana', 'stellar'].includes(account.networkType)),
        );

    const goToReceive = () => dispatch(goto('wallet-receive'));
    const heading = <Translation id="TR_MY_PORTFOLIO" />;
    const header =
        discovery && discoveryStatus?.status === 'exception' ? null : (
            <PortfolioCardHeader
                discovery={discovery}
                showGraphControls={showGraphControls}
                fiatAmount={walletBalance}
                localCurrency={localCurrency}
                isWalletEmpty={isWalletEmpty}
                isWalletLoading={isWalletLoading}
                isWalletError={isWalletError}
                isDiscoveryRunning={isDiscoveryRunning}
                receiveClickHandler={goToReceive}
            />
        );

    return (
        <DashboardSection
            heading={
                showMissingDataTooltip ? (
                    <Tooltip hasIcon content={<Translation id="TR_GRAPH_MISSING_DATA" />}>
                        {heading}
                    </Tooltip>
                ) : (
                    heading
                )
            }
            actions={
                !isWalletEmpty && !isWalletLoading && !isWalletError ? (
                    <Dropdown
                        placement={{ position: 'bottom', alignment: 'start' }}
                        content={
                            <Column
                                alignItems="flex-start"
                                gap={spacings.lg}
                                padding={spacings.xxs}
                            >
                                <GraphScaleDropdownItem />
                                <Switch
                                    isChecked={!dashboardGraphHidden}
                                    size="small"
                                    onChange={() =>
                                        dispatch(
                                            setFlag('dashboardGraphHidden', !dashboardGraphHidden),
                                        )
                                    }
                                    label={<Translation id="TR_SHOW_GRAPH" />}
                                    labelPosition="start"
                                />
                            </Column>
                        }
                    />
                ) : undefined
            }
        >
            <Card heading={body ? header : null} paddingType="large">
                {body ? (
                    <Column justifyContent="center" minHeight={329}>
                        {body}
                    </Column>
                ) : (
                    header
                )}
            </Card>
        </DashboardSection>
    );
});
