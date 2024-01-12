import styled, { useTheme } from 'styled-components';
import BigNumber from 'bignumber.js';

import { Icon, Button, LoadingContent, Card } from '@trezor/components';
import { selectDeviceSupportedNetworks, selectCoinsLegacy } from '@suite-common/wallet-core';

import { NETWORKS } from 'src/config/wallet';
import { DashboardSection } from 'src/components/dashboard';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { useAccounts } from 'src/hooks/wallet';
import { setFlag } from 'src/actions/suite/suiteActions';
import { goto } from 'src/actions/suite/routerActions';
import { useEnabledNetworks } from 'src/hooks/settings/useEnabledNetworks';

import { AssetCard, AssetCardSkeleton } from './components/AssetCard';
import { spacingsPx, typography } from '@trezor/theme';
import { AssetFiatBalance } from '@suite-common/assets';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { AssetTable, AssetTableRowType } from './components/AssetTable';

const StyledCard = styled(Card)`
    flex-direction: column;
    padding: 0;
`;

const InfoMessage = styled.div`
    padding: ${spacingsPx.md} ${spacingsPx.xl};
    display: flex;
    color: ${({ theme }) => theme.textAlertRed};
    ${typography.label}
`;

const ActionsWrapper = styled.div`
    display: flex;
    justify-content: space-around;
    align-items: center;
`;

const GridWrapper = styled.div`
    display: grid;
    grid-gap: 10px;
    grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
`;

const StyledAddAccountButton = styled(Button)`
    margin-right: ${spacingsPx.sm};
`;

const StyledIcon = styled(Icon)`
    margin-right: ${spacingsPx.xxs};
`;

const useAssetsFiatBalances = (
    assetsData: AssetTableRowType[],
    accounts: { [key: string]: Account[] },
) => {
    const localCurrency = useSelector(selectLocalCurrency);
    const coins = useSelector(selectCoinsLegacy);

    return assetsData.reduce<AssetFiatBalance[]>((acc, asset) => {
        if (!asset) return acc;
        const fiatRates = coins.find(item => item.symbol === asset.symbol);
        const fiatBalance =
            toFiatCurrency(
                accounts[asset.symbol]
                    .reduce((balance, account) => balance + Number(account.formattedBalance), 0)
                    .toString() ?? '0',
                localCurrency,
                fiatRates?.current?.rates,
            ) ?? '0';

        return [...acc, { fiatBalance, symbol: asset.symbol }];
    }, []);
};

export const AssetsView = () => {
    const { dashboardAssetsGridMode } = useSelector(s => s.suite.flags);
    const deviceSupportedNetworks = useSelector(selectDeviceSupportedNetworks);

    const theme = useTheme();
    const dispatch = useDispatch();
    const { discovery, getDiscoveryStatus, isDiscoveryRunning } = useDiscovery();
    const { accounts } = useAccounts(discovery);
    const { mainnets, enabledNetworks } = useEnabledNetworks();

    const mainnetSymbols = mainnets.map(mainnet => mainnet.symbol);
    const supportedMainnetNetworks = deviceSupportedNetworks.filter(network =>
        mainnetSymbols.includes(network),
    );
    const hasMainnetNetworksToEnable = supportedMainnetNetworks.some(
        network => !enabledNetworks.includes(network),
    );

    const assets: { [key: string]: Account[] } = {};
    accounts.forEach(a => {
        if (!assets[a.symbol]) {
            assets[a.symbol] = [];
        }
        assets[a.symbol].push(a);
    });

    const networks = Object.keys(assets);

    const assetsData: AssetTableRowType[] = networks
        .map(symbol => {
            const network = NETWORKS.find(n => n.symbol === symbol && !n.accountType);
            if (!network) {
                console.error('unknown network');
                return null;
            }

            const assetBalance = assets[symbol].reduce(
                (prev, a) => prev.plus(a.formattedBalance),
                new BigNumber(0),
            );

            const assetFailed = accounts.find(f => f.symbol === network.symbol && f.failed);
            return { symbol, network, assetFailed: !!assetFailed, assetBalance };
        })
        .filter(data => data !== null) as AssetTableRowType[];

    const assetsFiatBalances = useAssetsFiatBalances(assetsData, assets);
    const discoveryStatus = getDiscoveryStatus();
    const discoveryInProgress = discoveryStatus && discoveryStatus.status === 'loading';
    const isError = discoveryStatus && discoveryStatus.status === 'exception' && !networks.length;

    const goToCoinsSettings = () => dispatch(goto('settings-coins'));
    const setTable = () => dispatch(setFlag('dashboardAssetsGridMode', false));
    const setGrid = () => dispatch(setFlag('dashboardAssetsGridMode', true));

    return (
        <DashboardSection
            heading={
                <LoadingContent isLoading={isDiscoveryRunning}>
                    <Translation id="TR_MY_ASSETS" />
                </LoadingContent>
            }
            actions={
                <ActionsWrapper>
                    {hasMainnetNetworksToEnable && (
                        <StyledAddAccountButton
                            variant="tertiary"
                            icon="PLUS"
                            size="small"
                            onClick={goToCoinsSettings}
                        >
                            <Translation id="TR_ENABLE_MORE_COINS" />
                        </StyledAddAccountButton>
                    )}
                    <Icon
                        icon="TABLE"
                        data-test="@dashboard/assets/table-icon"
                        onClick={setTable}
                        color={
                            !dashboardAssetsGridMode ? theme.textPrimaryDefault : theme.textSubdued
                        }
                    />
                    <Icon
                        icon="GRID"
                        data-test="@dashboard/assets/grid-icon"
                        onClick={setGrid}
                        color={
                            dashboardAssetsGridMode ? theme.textPrimaryDefault : theme.textSubdued
                        }
                    />
                </ActionsWrapper>
            }
        >
            {dashboardAssetsGridMode && (
                <GridWrapper>
                    {assetsData.map((asset, index) => (
                        <AssetCard
                            index={index}
                            key={asset.symbol}
                            network={asset.network}
                            failed={asset.assetFailed}
                            cryptoValue={asset.assetBalance.toFixed()}
                            assetsFiatBalances={assetsFiatBalances}
                        />
                    ))}
                    {discoveryInProgress && <AssetCardSkeleton />}
                </GridWrapper>
            )}
            {!dashboardAssetsGridMode && (
                <StyledCard>
                    <AssetTable
                        assetsData={assetsData}
                        assetsFiatBalances={assetsFiatBalances}
                        discoveryInProgress={discoveryInProgress}
                    />
                    {isError && (
                        <InfoMessage>
                            <StyledIcon icon="WARNING" color={theme.iconAlertRed} size={14} />
                            <Translation id="TR_DASHBOARD_ASSETS_ERROR" />
                        </InfoMessage>
                    )}
                </StyledCard>
            )}
        </DashboardSection>
    );
};
