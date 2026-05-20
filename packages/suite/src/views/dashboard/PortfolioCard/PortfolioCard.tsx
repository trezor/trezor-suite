import { memo, useEffect, useMemo, useState } from 'react';

import { useDevice } from '@suite/device';
import { selectFlags, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { selectHasExperimentalFeature } from '@suite/settings';
import { getCoingeckoId, getNetwork } from '@suite-common/wallet-config';
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

import { markInitialDashboardGraphDeferCompleted } from 'src/actions/suite/suiteActions';
import { updateGraphData } from 'src/actions/wallet/graphActions';
import { DashboardSection } from 'src/components/dashboard';
import { GraphRangeSelector, GraphSkeleton } from 'src/components/suite';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { useTotalFiatBalance } from 'src/hooks/wallet/useTotalFiatBalance';
import { type AppState } from 'src/types/suite';
import { type GraphRange } from 'src/types/wallet/graph';
import { isNetworkWithGraphFeature, isNetworkWithLegacyGraphFeature } from 'src/utils/wallet/graph';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { DashboardGraph } from './DashboardGraph';
import { EmptyWallet } from './EmptyWallet';
import { EmptyWalletSkeleton } from './EmptyWalletSkeleton';
import { hasCoinbaseLiveSupport } from './LiveFiatGraph';
import { PortfolioCardException } from './PortfolioCardException';
import { PortfolioCardHeader } from './PortfolioCardHeader';
import { UnsupportedAssetsMessage, useUnsupportedNetworkMessage } from './UnsupportedAssetsMessage';

const selectGraphIsLoading = (state: AppState) => state.wallet.graph.isLoading;
const INITIAL_NEW_DASHBOARD_GRAPH_DEFER_MS = 400;
const renderDashboardGraphSkeleton = () => (
    <Column height={320}>
        <GraphSkeleton data-testid="@dashboard/loading" />
    </Column>
);

export const PortfolioCard = memo(() => {
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isGraphLoading = useSelector(selectGraphIsLoading);
    const suiteLifecycleStatus = useSelector(state => state.suite.lifecycle.status);
    const hasCompletedInitialDashboardGraphDefer = useSelector(
        state => state.suite.hasCompletedInitialDashboardGraphDefer,
    );
    const isRouterLoaded = useSelector(state => state.router.loaded);
    const { discovery, isDiscoveryRunning } = useDiscovery();
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const enabledNetworks = useSelector(selectEnabledNetworks);

    const accounts = useSelector(selectAllAccountsToList);
    const { dashboardGraphHidden } = useSelector(selectFlags);
    const isNewBalanceGraphEnabled = useSelector(selectHasExperimentalFeature('new-balance-graph'));
    const dispatch = useDispatch();
    const { device } = useDevice();
    const [isLive, setIsLive] = useState(false);
    const isDeviceEmpty = useMemo(() => accounts.every(a => a.empty), [accounts]);
    const failedAccounts = useMemo(() => accounts.filter(isAccountFailed), [accounts]);
    const hasLoadedNonEmptyAccount = useMemo(
        () => accounts.some(a => !a.empty && !isAccountFailed(a)),
        [accounts],
    );
    const walletBalance = useTotalFiatBalance(accounts, baseCurrencyCode, currentFiatRates);

    const passphraseEntryCanceled =
        accounts.length === 0 && discoveryStatus === undefined && discovery?.status === 'cancelled';

    const graphEligibleAccounts = useMemo(
        () =>
            accounts.filter(
                account =>
                    account.visible &&
                    enabledNetworks.includes(account.symbol) &&
                    !!getCoingeckoId(account.symbol) &&
                    (isNewBalanceGraphEnabled
                        ? isNetworkWithGraphFeature(account.symbol, account.backendType)
                        : isNetworkWithLegacyGraphFeature(account.symbol, account.backendType)),
            ),
        [accounts, enabledNetworks, isNewBalanceGraphEnabled],
    );
    const hasNetworkWithEnabledGraph = graphEligibleAccounts.length > 0;
    const hasAnyDashboardLiveSupport = graphEligibleAccounts.some(account =>
        hasCoinbaseLiveSupport(account.symbol),
    );
    const hasPartialDashboardLiveSupport =
        hasAnyDashboardLiveSupport &&
        graphEligibleAccounts.some(account => !hasCoinbaseLiveSupport(account.symbol));
    const unsupportedLiveNetworksLabel = useMemo(
        () =>
            Array.from(
                new Set(
                    graphEligibleAccounts
                        .filter(account => !hasCoinbaseLiveSupport(account.symbol))
                        .map(account => getNetwork(account.symbol).name),
                ),
            ).join(', '),
        [graphEligibleAccounts],
    );

    const isGraphAvailable = hasNetworkWithEnabledGraph;
    const isNewDashboardGraphDeferred =
        isNewBalanceGraphEnabled &&
        isGraphAvailable &&
        !hasCompletedInitialDashboardGraphDefer &&
        suiteLifecycleStatus === 'ready' &&
        isRouterLoaded &&
        discoveryStatus?.status !== 'loading';
    const onSelectedRange = (range: GraphRange) =>
        dispatch(
            updateGraphData({
                accounts: graphEligibleAccounts,
                selectedRange: range,
            }),
        );

    useEffect(() => {
        if ((!hasAnyDashboardLiveSupport || !isNewBalanceGraphEnabled) && isLive) {
            setIsLive(false);
        }
    }, [hasAnyDashboardLiveSupport, isLive, isNewBalanceGraphEnabled]);

    useEffect(() => {
        if (
            !isNewBalanceGraphEnabled ||
            hasCompletedInitialDashboardGraphDefer ||
            !isGraphAvailable ||
            suiteLifecycleStatus !== 'ready' ||
            !isRouterLoaded ||
            discoveryStatus?.status === 'loading'
        ) {
            return;
        }

        let isCancelled = false;
        let firstFrameId: number | undefined;

        const deferTimeoutId = window.setTimeout(() => {
            firstFrameId = window.requestAnimationFrame(() => {
                if (!isCancelled) {
                    dispatch(markInitialDashboardGraphDeferCompleted());
                }
            });
        }, INITIAL_NEW_DASHBOARD_GRAPH_DEFER_MS);

        return () => {
            isCancelled = true;

            if (firstFrameId !== undefined) {
                window.cancelAnimationFrame(firstFrameId);
            }

            clearTimeout(deferTimeoutId);
        };
    }, [
        discoveryStatus?.status,
        dispatch,
        hasCompletedInitialDashboardGraphDefer,
        isGraphAvailable,
        isNewBalanceGraphEnabled,
        isRouterLoaded,
        suiteLifecycleStatus,
    ]);

    // TODO: DashboardGraph will get mounted twice (thus triggering data processing twice)
    // 1. DashboardGraph gets mounted
    // 2. Discovery starts, DashboardGraph is unmounted, Loading mounts
    // 3. Discovery stops (no accounts added), Loading unmounted, new instance of DashboardGraph gets mounted

    const renderBody = () => {
        if (discoveryStatus && discoveryStatus.status === 'exception') {
            return (
                <PortfolioCardException
                    exception={discoveryStatus}
                    discovery={discovery}
                    failed={failedAccounts}
                />
            );
        }

        if (passphraseEntryCanceled) {
            return (
                <PortfolioCardException
                    exception={{
                        status: 'exception',
                        type: 'discovery-failed',
                    }}
                    discovery={discovery}
                    failed={failedAccounts}
                />
            );
        }

        if (discoveryStatus && discoveryStatus.status === 'loading') {
            if (isDeviceEmpty) {
                return <EmptyWalletSkeleton />;
            }

            if (hasLoadedNonEmptyAccount && isGraphAvailable) {
                return (
                    <DashboardGraph
                        accounts={graphEligibleAccounts}
                        isLive={isLive}
                        isNewBalanceGraphEnabled={isNewBalanceGraphEnabled}
                    />
                );
            }

            return isGraphAvailable ? renderDashboardGraphSkeleton() : null;
        }

        if (isDeviceEmpty) {
            return <EmptyWallet />;
        }

        if (isGraphAvailable) {
            return isNewDashboardGraphDeferred ? (
                renderDashboardGraphSkeleton()
            ) : (
                <DashboardGraph
                    accounts={graphEligibleAccounts}
                    isLive={isLive}
                    isNewBalanceGraphEnabled={isNewBalanceGraphEnabled}
                />
            );
        }

        return null;
    };

    const body = renderBody();

    const isWalletEmpty = !discoveryStatus && isDeviceEmpty;
    const isWalletLoading = discoveryStatus?.status === 'loading';
    const isWalletError = discoveryStatus?.status === 'exception';
    const showGraphControls =
        !isWalletEmpty && !isWalletLoading && !isWalletError && isGraphAvailable;
    const canToggleGraph = !isWalletEmpty && !isWalletError && isGraphAvailable;
    const { affectedNetworks, hasTokens, showMissingDataTooltip } = useUnsupportedNetworkMessage({
        showGraphControls,
        device,
        accounts,
        isNewBalanceGraphEnabled,
    });

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
                                    <Row gap={32} justifyContent="space-between">
                                        <GraphRangeSelector
                                            onSelectedRange={onSelectedRange}
                                            isLive={isLive}
                                            isLoading={isNewBalanceGraphEnabled && isGraphLoading}
                                            isDisabled={isNewDashboardGraphDeferred}
                                            onLiveChange={setIsLive}
                                            showLiveOption={
                                                isNewBalanceGraphEnabled &&
                                                hasAnyDashboardLiveSupport
                                            }
                                            showCustomRangeOption={!isNewBalanceGraphEnabled}
                                            liveTooltipContent={
                                                isNewBalanceGraphEnabled &&
                                                hasPartialDashboardLiveSupport ? (
                                                    <Translation
                                                        id="TR_GRAPH_LIVE_UNAVAILABLE_FOR_NETWORKS"
                                                        values={{
                                                            networks: unsupportedLiveNetworksLabel,
                                                        }}
                                                    />
                                                ) : undefined
                                            }
                                            accounts={graphEligibleAccounts}
                                        />
                                        {showMissingDataTooltip && (
                                            <Row gap={12} flex="1 1">
                                                <Paragraph
                                                    typographyStyle="body-xs"
                                                    intent="neutral"
                                                    priority="secondary"
                                                    align="end"
                                                    textWrap="balance"
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
