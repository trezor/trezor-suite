import styled, { useTheme } from 'styled-components';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Icon, Button, LoadingContent, Card, Row } from '@trezor/components';
import {
    isSupportedEthStakingNetworkSymbol,
    selectDeviceSupportedNetworks,
} from '@suite-common/wallet-core';

import { DashboardSection } from 'src/components/dashboard';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { useDiscovery, useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { useAccounts } from 'src/hooks/wallet';
import { setFlag } from 'src/actions/suite/suiteActions';
import { goto } from 'src/actions/suite/routerActions';
import { useEnabledNetworks } from 'src/hooks/settings/useEnabledNetworks';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { AssetFiatBalance } from '@suite-common/assets';

import { AssetCard, AssetCardSkeleton } from './AssetCard/AssetCard';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import { AssetTable } from './AssetTable/AssetTable';
import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { AssetTableRowProps } from './AssetTable/AssetRow';
import { selectCurrentFiatRates } from '@suite-common/wallet-core';

const InfoMessage = styled.div`
    padding: ${spacingsPx.md} ${spacingsPx.xl};
    display: flex;
    color: ${({ theme }) => theme.textAlertRed};
    ${typography.label}
`;

const GridWrapper = styled.div`
    display: grid;
    grid-gap: 10px;
    grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
`;

export type AssetTableRowPropsWithoutFiatBalances = Omit<AssetTableRowProps, 'assetsFiatBalances'>;

const useAssetsFiatBalances = (
    assetsData: AssetTableRowPropsWithoutFiatBalances[],
    accounts: { [key: string]: Account[] },
) => {
    const localCurrency = useSelector(selectLocalCurrency);
    const currentRiatRates = useSelector(selectCurrentFiatRates);

    return assetsData.reduce<AssetFiatBalance[]>((acc, asset) => {
        if (!asset) return acc;

        const fiatRateKey = getFiatRateKey(asset.network.symbol, localCurrency);
        const fiatRate = currentRiatRates?.[fiatRateKey];
        const amount =
            accounts[asset.network.symbol]
                .reduce((balance, account) => balance + Number(account.formattedBalance), 0)
                .toString() ?? '0';

        const fiatBalance = toFiatCurrency(amount, fiatRate?.rate, 2) ?? '0';

        return [...acc, { fiatBalance, symbol: asset.network.symbol }];
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

    const assetNetworkSymbols = Object.keys(assets) as NetworkSymbol[];

    const assetsData: AssetTableRowPropsWithoutFiatBalances[] = assetNetworkSymbols
        .map(symbol => {
            const network = getNetwork(symbol);
            if (!network) {
                console.error('unknown network');

                return null;
            }

            const assetNativeCryptoBalance = assets[symbol].reduce(
                (total, account) => total.plus(account.formattedBalance),
                new BigNumber(0),
            );

            const assetTokens = assets[symbol].reduce((allTokens: TokenInfo[], account) => {
                if (account.tokens) {
                    allTokens.push(...account.tokens);
                }

                return allTokens;
            }, []);

            const assetFailed = accounts.find(f => f.symbol === network.symbol && f.failed);

            return {
                symbol,
                network,
                failed: !!assetFailed,
                assetNativeCryptoBalance: assetNativeCryptoBalance
                    ? assetNativeCryptoBalance.toNumber()
                    : '0',
                assetTokens: assetTokens?.length ? assetTokens : undefined,
                stakingAccounts: accounts.filter(account =>
                    isSupportedEthStakingNetworkSymbol(account.symbol),
                ),
            };
        })
        .filter(data => data !== null) as AssetTableRowPropsWithoutFiatBalances[];

    const assetsFiatBalances = useAssetsFiatBalances(assetsData, assets);

    const discoveryStatus = getDiscoveryStatus();
    const discoveryInProgress = discoveryStatus && discoveryStatus.status === 'loading';
    const isError =
        discoveryStatus && discoveryStatus.status === 'exception' && !assetNetworkSymbols.length;

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
                    <Row justifyContent="space-around" alignItems="center">
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
                    </Row>
                )
            }
        >
            {showCards ? (
                <>
                    <GridWrapper>
                        {assetsData.map((asset, index) => (
                            <AssetCard
                                index={index}
                                key={asset.network.symbol}
                                network={asset.network}
                                failed={asset.failed}
                                cryptoValue={asset.assetNativeCryptoBalance}
                                assetsFiatBalances={assetsFiatBalances}
                                stakingAccounts={asset.stakingAccounts}
                                assetTokens={asset.assetTokens}
                            />
                        ))}
                        {discoveryInProgress && <AssetCardSkeleton />}
                    </GridWrapper>
                    {isError && (
                        <Card width="100%">
                            <InfoMessage>
                                <Icon
                                    name="warningTriangle"
                                    color={theme.iconAlertRed}
                                    size={14}
                                    margin={{ right: spacings.xxs }}
                                />
                                <Translation id="TR_DASHBOARD_ASSETS_ERROR" />
                            </InfoMessage>
                        </Card>
                    )}
                </>
            ) : (
                <Card paddingType="none">
                    <AssetTable
                        assetsData={assetsData}
                        discoveryInProgress={discoveryInProgress}
                        assetsFiatBalances={assetsFiatBalances}
                    />
                    {isError && (
                        <InfoMessage>
                            <Icon name="warningTriangle" color={theme.iconAlertRed} size={14} />
                            <Translation id="TR_DASHBOARD_ASSETS_ERROR" />
                        </InfoMessage>
                    )}
                </Card>
            )}
        </DashboardSection>
    );
};
