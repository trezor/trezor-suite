import { memo, useMemo } from 'react';

import { selectFlags, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { networksCollection } from '@suite-common/wallet-config';
import {
    selectAllAccountsToList,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import { isAccountFailed } from '@suite-common/wallet-utils';
import { Box, Card, Column, Dropdown, Switch } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { DashboardSection } from 'src/components/dashboard';
import { GraphScaleDropdownItem, GraphSkeleton } from 'src/components/suite';
import { useDevice, useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { useTotalFiatBalance } from 'src/hooks/wallet/useTotalFiatBalance';
import { isNetworkWithGraphFeature } from 'src/utils/wallet/graph';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { DashboardGraph } from './DashboardGraph';
import { EmptyWallet } from './EmptyWallet';
import { PortfolioCardException } from './PortfolioCardException';
import { PortfolioCardHeader } from './PortfolioCardHeader';
import { UnsupportedAssetsMessage, useUnsupportedNetworkMessage } from './UnsupportedAssetsMessage';

const MarginContainer = ({ children }: { children: React.ReactNode }) => (
    <Box margin={{ horizontal: 24, vertical: 16 }}>{children}</Box>
);

export const PortfolioCard = memo(() => {
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const { discovery, isDiscoveryRunning } = useDiscovery();
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const enabledNetworks = useSelector(selectEnabledNetworks);

    const accounts = useSelector(selectAllAccountsToList);
    const { dashboardGraphHidden } = useSelector(selectFlags);
    const dispatch = useDispatch();
    const { device } = useDevice();
    const isDeviceEmpty = useMemo(() => accounts.every(a => a.empty), [accounts]);
    const failedAccounts = useMemo(() => accounts.filter(isAccountFailed), [accounts]);
    const walletBalance = useTotalFiatBalance(accounts, baseCurrencyCode, currentFiatRates);

    const passphraseEntryCanceled = accounts.length === 0 && discoveryStatus === undefined;

    const hasNetworkWithEnabledGraph = networksCollection.some(
        network =>
            isNetworkWithGraphFeature(network.symbol) && enabledNetworks.includes(network.symbol),
    );

    const isGraphHidden = dashboardGraphHidden || !hasNetworkWithEnabledGraph;

    // TODO: DashboardGraph will get mounted twice (thus triggering data processing twice)
    // 1. DashboardGraph gets mounted
    // 2. Discovery starts, DashboardGraph is unmounted, Loading mounts
    // 3. Discovery stops (no accounts added), Loading unmounted, new instance of DashboardGraph gets mounted

    let body = null;
    if (discoveryStatus && discoveryStatus.status === 'exception') {
        body = (
            <MarginContainer>
                <PortfolioCardException
                    exception={discoveryStatus}
                    discovery={discovery}
                    failed={failedAccounts}
                />
            </MarginContainer>
        );
    } else if (passphraseEntryCanceled) {
        body = (
            <MarginContainer>
                <PortfolioCardException
                    exception={{
                        status: 'exception',
                        type: 'discovery-failed',
                    }}
                    discovery={discovery}
                    failed={failedAccounts}
                />
            </MarginContainer>
        );
    } else if (discoveryStatus && discoveryStatus.status === 'loading') {
        body = isGraphHidden ? null : (
            <MarginContainer>
                <Column height={320}>
                    <GraphSkeleton data-testid="@dashboard/loading" />
                </Column>
            </MarginContainer>
        );
    } else if (isDeviceEmpty) {
        body = (
            <MarginContainer>
                <EmptyWallet />
            </MarginContainer>
        );
    } else if (!isGraphHidden) {
        body = <DashboardGraph accounts={accounts} />;
    }

    const isWalletEmpty = !discoveryStatus && isDeviceEmpty;
    const isWalletLoading = discoveryStatus?.status === 'loading';
    const isWalletError = discoveryStatus?.status === 'exception';
    const showGraphControls =
        !isWalletEmpty && !isWalletLoading && !isWalletError && !isGraphHidden;
    const { affectedNetworks, hasTokens, showMissingDataTooltip } = useUnsupportedNetworkMessage({
        showGraphControls,
        device,
        accounts,
        isGraphHidden,
    });

    const heading = <Translation id="TR_MY_PORTFOLIO" />;

    const header =
        discovery && discoveryStatus?.status === 'exception' ? null : (
            <PortfolioCardHeader
                discovery={discovery}
                showGraphControls={showGraphControls}
                fiatAmount={walletBalance}
                localCurrency={baseCurrencyCode}
                isWalletLoading={isWalletLoading}
                isWalletError={isWalletError}
                isDiscoveryRunning={isDiscoveryRunning}
                passphraseEntryCanceled={passphraseEntryCanceled}
            />
        );

    return (
        <DashboardSection
            heading={heading}
            subheading={
                showMissingDataTooltip ? (
                    <UnsupportedAssetsMessage
                        affectedNetworks={affectedNetworks}
                        hasTokens={hasTokens}
                    />
                ) : undefined
            }
            actions={
                !isWalletEmpty &&
                !isWalletLoading &&
                !isWalletError &&
                hasNetworkWithEnabledGraph ? (
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
                                            setFlag({
                                                key: 'dashboardGraphHidden',
                                                value: !dashboardGraphHidden,
                                            }),
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
            <Card header={body ? header : null} paddingType="none" overflow="visible">
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
