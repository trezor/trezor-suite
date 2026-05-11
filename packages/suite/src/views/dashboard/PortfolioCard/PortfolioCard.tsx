import { memo, useMemo } from 'react';

import { useDevice } from '@suite/device';
import { selectFlags, setFlag } from '@suite/flags';
import { networksCollection } from '@suite-common/wallet-config';
import {
    selectAllAccountsToList,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import { isAccountFailed } from '@suite-common/wallet-utils';
import {
    Card,
    Collapsible,
    Column,
    Divider,
    Icon,
    IconButton,
    Paragraph,
    Row,
} from '@trezor/components';

import { updateGraphData } from 'src/actions/wallet/graphActions';
import { DashboardSection } from 'src/components/dashboard';
import { GraphRangeSelector, GraphSkeleton } from 'src/components/suite';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { useTotalFiatBalance } from 'src/hooks/wallet/useTotalFiatBalance';
import { isNetworkWithGraphFeature } from 'src/utils/wallet/graph';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { DashboardGraph } from './DashboardGraph';
import { EmptyWallet } from './EmptyWallet';
import { EmptyWalletSkeleton } from './EmptyWalletSkeleton';
import { PortfolioCardException } from './PortfolioCardException';
import { PortfolioCardHeader } from './PortfolioCardHeader';
import { UnsupportedAssetsMessage, useUnsupportedNetworkMessage } from './UnsupportedAssetsMessage';

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

    const hasLoadedNonEmptyAccount = useMemo(
        () => accounts.some(a => !a.empty && !isAccountFailed(a)),
        [accounts],
    );
    const walletBalance = useTotalFiatBalance(accounts, baseCurrencyCode, currentFiatRates);

    const passphraseEntryCanceled =
        accounts.length === 0 && discoveryStatus === undefined && discovery?.status === 'cancelled';

    const hasNetworkWithEnabledGraph = networksCollection.some(
        network =>
            isNetworkWithGraphFeature(network.symbol) && enabledNetworks.includes(network.symbol),
    );

    // TODO: DashboardGraph will get mounted twice (thus triggering data processing twice)
    // 1. DashboardGraph gets mounted
    // 2. Discovery starts, DashboardGraph is unmounted, Loading mounts
    // 3. Discovery stops (no accounts added), Loading unmounted, new instance of DashboardGraph gets mounted

    let body = null;
    if (discoveryStatus && discoveryStatus.status === 'exception') {
        body = (
            <PortfolioCardException
                exception={discoveryStatus}
                discovery={discovery}
                failed={failedAccounts}
            />
        );
    } else if (passphraseEntryCanceled) {
        body = (
            <PortfolioCardException
                exception={{
                    status: 'exception',
                    type: 'discovery-failed',
                }}
                discovery={discovery}
                failed={failedAccounts}
            />
        );
    } else if (discoveryStatus && discoveryStatus.status === 'loading') {
        if (isDeviceEmpty) {
            body = <EmptyWalletSkeleton />;
        } else if (hasLoadedNonEmptyAccount && hasNetworkWithEnabledGraph) {
            body = <DashboardGraph accounts={accounts} />;
        } else if (hasNetworkWithEnabledGraph) {
            body = (
                <Column height={320}>
                    <GraphSkeleton data-testid="@dashboard/loading" />
                </Column>
            );
        }
    } else if (isDeviceEmpty) {
        body = <EmptyWallet />;
    } else if (hasNetworkWithEnabledGraph) {
        body = <DashboardGraph accounts={accounts} />;
    }

    const isWalletEmpty = !discoveryStatus && isDeviceEmpty;
    const isWalletLoading = discoveryStatus?.status === 'loading';
    const isWalletError = discoveryStatus?.status === 'exception';
    const showGraphControls =
        !isWalletEmpty && !isWalletLoading && !isWalletError && hasNetworkWithEnabledGraph;
    const canToggleGraph = !isWalletEmpty && !isWalletError && hasNetworkWithEnabledGraph;
    const { affectedNetworks, hasTokens, showMissingDataTooltip } = useUnsupportedNetworkMessage({
        showGraphControls,
        device,
        accounts,
    });

    const onSelectedRange = () =>
        dispatch(
            updateGraphData({
                accounts,
            }),
        );

    const headerRightContent = canToggleGraph ? (
        <IconButton
            size="small"
            intent="neutral"
            priority="secondary"
            icon={dashboardGraphHidden ? 'caretDown' : 'caretUp'}
            onClick={() =>
                dispatch(
                    setFlag({
                        key: 'dashboardGraphHidden',
                        value: !dashboardGraphHidden,
                    }),
                )
            }
        />
    ) : null;

    const header =
        (discovery && discoveryStatus?.status === 'exception') ||
        isWalletEmpty ||
        isDeviceEmpty ? null : (
            <PortfolioCardHeader
                discovery={discovery}
                fiatAmount={walletBalance}
                localCurrency={baseCurrencyCode}
                isDiscoveryRunning={isDiscoveryRunning}
                rightContent={headerRightContent}
            />
        );

    return (
        <DashboardSection>
            <Collapsible isOpen={canToggleGraph ? !dashboardGraphHidden : true}>
                <Card paddingType="none">
                    {header}
                    {body && (
                        <Collapsible.Content overflow="unset">
                            {header && <Divider margin={{}} />}
                            <Column gap={16} padding={24}>
                                <Column justifyContent="center" minHeight={329}>
                                    {body}
                                </Column>
                                {showGraphControls && (
                                    <Row gap={16} justifyContent="space-between">
                                        <GraphRangeSelector onSelectedRange={onSelectedRange} />
                                        {showMissingDataTooltip && (
                                            <Row gap={12}>
                                                <Paragraph
                                                    typographyStyle="body-xs"
                                                    intent="neutral"
                                                    priority="secondary"
                                                    align="end"
                                                    textWrap="balance"
                                                    maxWidth={400}
                                                >
                                                    <UnsupportedAssetsMessage
                                                        affectedNetworks={affectedNetworks}
                                                        hasTokens={hasTokens}
                                                    />
                                                </Paragraph>
                                                <Icon
                                                    name="info"
                                                    size={24}
                                                    intent="neutral"
                                                    priority="secondary"
                                                />
                                            </Row>
                                        )}
                                    </Row>
                                )}
                            </Column>
                        </Collapsible.Content>
                    )}
                </Card>
            </Collapsible>
        </DashboardSection>
    );
});
