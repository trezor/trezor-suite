import styled, { useTheme } from 'styled-components';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Icon, Button, LoadingContent, Card } from '@trezor/components';
import { selectCurrentFiatRates, selectDeviceSupportedNetworks } from '@suite-common/wallet-core';

import { DashboardSection } from 'src/components/dashboard';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { useDiscovery, useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { useAccounts } from 'src/hooks/wallet';
import { setFlag } from 'src/actions/suite/suiteActions';
import { goto } from 'src/actions/suite/routerActions';
import { useEnabledNetworks } from 'src/hooks/settings/useEnabledNetworks';

import { AssetCard, AssetCardSkeleton } from './components/AssetCard';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import { AssetFiatBalance } from '@suite-common/assets';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { AssetTable, AssetTableRowType } from './components/AssetTable';
import { networksCompatibility, NetworkSymbol } from '@suite-common/wallet-config';

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

const ErrorCard = styled(Card)`
    width: 100%;
`;

const useAssetsFiatBalances = (
    assetsData: AssetTableRowType[],
    accounts: { [key: string]: Account[] },
) => {
    const localCurrency = useSelector(selectLocalCurrency);
    const currentRiatRates = useSelector(selectCurrentFiatRates);

    return assetsData.reduce<AssetFiatBalance[]>((acc, asset) => {
        if (!asset) return acc;

        const fiatRateKey = getFiatRateKey(asset.symbol as NetworkSymbol, localCurrency);
        const fiatRate = currentRiatRates?.[fiatRateKey];
        const amount =
            accounts[asset.symbol]
                .reduce((balance, account) => balance + Number(account.formattedBalance), 0)
                .toString() ?? '0';

        const fiatBalance = toFiatCurrency(amount, fiatRate?.rate, 2) ?? '0';

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
    const { isMobileLayout } = useLayoutSize();

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
            const network = networksCompatibility.find(n => n.symbol === symbol && !n.accountType);
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

    const showCards = isMobileLayout || dashboardAssetsGridMode;

    return (
        <DashboardSection
            heading={
                <LoadingContent isLoading={isDiscoveryRunning}>
                    <Translation id="TR_MY_ASSETS" />
                </LoadingContent>
            }
            actions={
                isMobileLayout ? (
                    <></>
                ) : (
                    <ActionsWrapper>
                        {hasMainnetNetworksToEnable && (
                            <Button
                                variant="tertiary"
                                icon="plus"
                                size="small"
                                onClick={goToCoinsSettings}
                                data-testid="@dashboard/assets/enable-more-coins"
                                margin={{ right: spacings.sm }}
                            >
                                <Translation id="TR_ENABLE_MORE_COINS" />
                            </Button>
                        )}
                        <Icon
                            name="table"
                            data-testid="@dashboard/assets/table-icon"
                            onClick={setTable}
                            color={
                                !dashboardAssetsGridMode
                                    ? theme.textPrimaryDefault
                                    : theme.textSubdued
                            }
                        />
                        <Icon
                            name="grid"
                            data-testid="@dashboard/assets/grid-icon"
                            onClick={setGrid}
                            color={
                                dashboardAssetsGridMode
                                    ? theme.textPrimaryDefault
                                    : theme.textSubdued
                            }
                        />
                    </ActionsWrapper>
                )
            }
        >
            {showCards ? (
                <>
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
                    {isError && (
                        <ErrorCard>
                            <InfoMessage>
                                <Icon
                                    margin={{ right: spacings.xxs }}
                                    name="warningTriangle"
                                    color={theme.iconAlertRed}
                                    size={14}
                                />
                                <Translation id="TR_DASHBOARD_ASSETS_ERROR" />
                            </InfoMessage>
                        </ErrorCard>
                    )}
                </>
            ) : (
                <StyledCard>
                    <AssetTable
                        assetsData={assetsData}
                        assetsFiatBalances={assetsFiatBalances}
                        discoveryInProgress={discoveryInProgress}
                    />
                    {isError && (
                        <InfoMessage>
                            <Icon icon="warningTriangle" color={theme.iconAlertRed} size={14} />
                            <Translation id="TR_DASHBOARD_ASSETS_ERROR" />
                        </InfoMessage>
                    )}
                </StyledCard>
            )}
        </DashboardSection>
    );
};
