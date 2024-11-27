import styled, { useTheme } from 'styled-components';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import { Icon, Button, LoadingContent, Card, Row } from '@trezor/components';
import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { AssetFiatBalance } from '@suite-common/assets';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import {
    getFiatRateKey,
    toFiatCurrency,
    isSupportedEthStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { NetworkSymbol, getNetwork, Network } from '@suite-common/wallet-config';
import { RatesByKey } from '@suite-common/wallet-types';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { PartialRecord } from '@trezor/type-utils';

import { DashboardSection } from 'src/components/dashboard';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { useDiscovery, useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { useAccounts } from 'src/hooks/wallet';
import { setFlag } from 'src/actions/suite/suiteActions';
import { goto } from 'src/actions/suite/routerActions';
import { selectEnabledNetworks, selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';

import { AssetCard, AssetCardSkeleton } from './AssetCard/AssetCard';
import { AssetTable } from './AssetTable/AssetTable';

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

export type AssetData = {
    network: Network;
    failed: boolean;
    assetNativeCryptoBalance: string;
    stakingAccounts: Account[];
    assetTokens: TokenInfo[];
    isStakeNetwork?: boolean;
    accounts: Account[];
};

const useAssetsFiatBalances = (
    assetsData: AssetData[],
    accounts: { [key: string]: Account[] },
    localCurrency: FiatCurrencyCode,
    currentFiatRates?: RatesByKey,
) => {
    return assetsData.reduce<AssetFiatBalance[]>((acc, asset) => {
        if (!asset) return acc;

        const fiatRateKey = getFiatRateKey(asset.network.symbol, localCurrency);
        const fiatRate = currentFiatRates?.[fiatRateKey];
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
    const enabledNetworks = useSelector(selectEnabledNetworks);

    const theme = useTheme();
    const dispatch = useDispatch();
    const { discovery, getDiscoveryStatus, isDiscoveryRunning } = useDiscovery();
    const { accounts } = useAccounts(discovery);
    const { supportedMainnets } = useNetworkSupport();
    const { isMobileLayout } = useLayoutSize();

    const localCurrency = useSelector(selectLocalCurrency);
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const hasMainnetNetworksToEnable = supportedMainnets.some(
        network => !enabledNetworks.includes(network.symbol),
    );

    const assets: PartialRecord<NetworkSymbol, Account[]> = {};

    accounts.forEach(account => {
        let symbolAssets = assets[account.symbol];

        if (!symbolAssets) {
            symbolAssets = [];
        }

        symbolAssets.push(account);

        assets[account.symbol] = symbolAssets;
    });

    const assetSymbols = Object.keys(assets) as NetworkSymbol[];

    const assetsData: AssetData[] = assetSymbols
        .map(symbol => {
            const network = getNetwork(symbol);
            if (!network) {
                console.error('unknown network');

                return null;
            }

            const assetNativeCryptoBalance = assets[symbol]?.reduce(
                (total, account) => total.plus(account.formattedBalance),
                new BigNumber(0),
            );

            const assetTokens = assets[symbol]?.reduce((allTokens: TokenInfo[], account) => {
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
                accounts,
            };
        })
        .filter(data => data !== null) as AssetData[];

    const assetsFiatBalances = useAssetsFiatBalances(
        assetsData,
        assets,
        localCurrency,
        currentFiatRates,
    );

    const discoveryStatus = getDiscoveryStatus();
    const discoveryInProgress = discoveryStatus && discoveryStatus.status === 'loading';
    const isError =
        discoveryStatus && discoveryStatus.status === 'exception' && !assetSymbols.length;

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
                                localCurrency={localCurrency}
                                currentFiatRates={currentFiatRates}
                                accounts={asset.accounts}
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
                <Card paddingType="none" overflow="hidden">
                    <AssetTable
                        assetsData={assetsData}
                        discoveryInProgress={discoveryInProgress}
                        assetsFiatBalances={assetsFiatBalances}
                        localCurrency={localCurrency}
                        currentFiatRates={currentFiatRates}
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
