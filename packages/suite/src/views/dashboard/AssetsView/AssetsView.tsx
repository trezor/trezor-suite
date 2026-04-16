import styled from 'styled-components';

import { selectFlags, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { type AssetFiatBalance } from '@suite-common/assets';
import {
    type NetworkSymbol,
    getNetwork,
    getNetworkFeatures,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import {
    selectAllAccountsToList,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import { type RatesByKey } from '@suite-common/wallet-types';
import {
    AMOUNT_UNIT_ZERO,
    BASE_CURRENCY_ZERO,
    asAmountUnit,
    getFiatRateKey,
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode, TokenInfo } from '@trezor/blockchain-link-types';
import { Button, Card, Icon, IconButton, LoadingContent, Row } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import { type PartialRecord } from '@trezor/type-utils';
import { BigNumber, typedObjectKeys } from '@trezor/utils';

import { DashboardSection } from 'src/components/dashboard';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useDiscovery, useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { AssetCard, AssetCardSkeleton } from './AssetCard/AssetCard';
import { type AssetData } from './AssetData';
import { AssetTable } from './AssetTable/AssetTable';

const InfoMessage = styled.div`
    padding: ${spacingsPx.md} ${spacingsPx.xl};
    align-items: center;
    display: flex;
    color: ${({ theme }) => theme.textAlertRed};
    ${typography['body-xs']}
`;

const GridWrapper = styled.div`
    display: grid;
    gap: ${spacingsPx.sm};
    grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
`;

const useAssetsFiatBalances = (
    assetsData: AssetData[],
    accounts: { [key: string]: Account[] },
    localCurrency: BaseCurrencyCode,
    currentFiatRates?: RatesByKey,
) =>
    assetsData.reduce<AssetFiatBalance[]>((acc, asset) => {
        if (!asset) return acc;

        const fiatRateKey = getFiatRateKey(asset.network.symbol, localCurrency);
        const fiatRate = currentFiatRates?.[fiatRateKey];
        const amount = (accounts[asset.network.symbol] ?? [])
            .reduce((balance, account) => balance + Number(account.formattedBalance), 0)
            .toString();

        const fiatBalance = toFiatCurrency({ amount, rate: fiatRate?.rate }) ?? BASE_CURRENCY_ZERO;

        return [...acc, { fiatBalance, symbol: asset.network.symbol }];
    }, []);

export const AssetsView = () => {
    const { dashboardAssetsGridMode } = useSelector(selectFlags);
    const enabledNetworks = useSelector(selectEnabledNetworks);

    const dispatch = useDispatch();
    const { isDiscoveryRunning } = useDiscovery();
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const accounts = useSelector(selectAllAccountsToList);
    const { supportedMainnets } = useNetworkSupport();
    const { isBelowTablet } = useLayoutSize();

    const baseCurrencyCode = useSelector(selectBaseCurrency);
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

    const assetSymbols = typedObjectKeys(assets).filter(symbol => isNetworkSymbol(symbol));

    const assetsData: AssetData[] = assetSymbols.map((symbol): AssetData => {
        const network = getNetwork(symbol);

        const assetNativeCryptoBalance =
            assets[symbol] !== undefined
                ? asAmountUnit(
                      assets[symbol].reduce(
                          (total, account) => total.plus(account.formattedBalance),
                          new BigNumber(0),
                      ),
                  )
                : undefined;

        const assetTokens = assets[symbol]?.reduce((allTokens: TokenInfo[], account) => {
            if (account.tokens) {
                allTokens.push(...account.tokens);
            }

            return allTokens;
        }, []);

        const assetFailed = accounts.find(f => f.symbol === network.symbol && f.failed);

        return {
            network,
            failed: !!assetFailed,
            assetNativeCryptoBalance: assetNativeCryptoBalance
                ? assetNativeCryptoBalance
                : AMOUNT_UNIT_ZERO,
            assetTokens: assetTokens?.length ? assetTokens : [],
            stakingAccounts: accounts.filter(
                account =>
                    isSupportedEthStakingNetworkSymbol(account.symbol) ||
                    isSupportedSolStakingNetworkSymbol(account.symbol),
            ),
            accounts,
            isStakeNetwork: getNetworkFeatures(symbol).includes('staking'),
        };
    });

    const assetsFiatBalances = useAssetsFiatBalances(
        assetsData,
        assets,
        baseCurrencyCode,
        currentFiatRates,
    );

    const discoveryInProgress = discoveryStatus && discoveryStatus.status === 'loading';
    const isError =
        discoveryStatus && discoveryStatus.status === 'exception' && !assetSymbols.length;

    const goToCoinsSettings = () => dispatch(goto({ routeName: 'settings-coins' }));
    const setTable = () => dispatch(setFlag({ key: 'dashboardAssetsGridMode', value: false }));
    const setGrid = () => dispatch(setFlag({ key: 'dashboardAssetsGridMode', value: true }));

    const showCards = isBelowTablet || dashboardAssetsGridMode;

    return (
        <DashboardSection
            data-testid="@dashboard/assets"
            heading={
                <LoadingContent isLoading={isDiscoveryRunning}>
                    <Translation id="TR_MY_ASSETS" />
                </LoadingContent>
            }
            actions={
                isBelowTablet ? (
                    <></>
                ) : (
                    <Row justifyContent="space-around" gap={12}>
                        {hasMainnetNetworksToEnable && (
                            <Button
                                intent="neutral"
                                priority="secondary"
                                iconLeft="plus"
                                onClick={goToCoinsSettings}
                                data-testid="@dashboard/assets/enable-more-coins"
                            >
                                <Translation id="TR_ENABLE_MORE_COINS" />
                            </Button>
                        )}
                        <Row gap={4}>
                            <IconButton
                                icon="rowsFilled"
                                data-testid="@dashboard/assets/table-icon"
                                onClick={setTable}
                                intent={dashboardAssetsGridMode ? 'neutral' : 'brand'}
                                priority="secondary"
                            />
                            <IconButton
                                icon="gridNineFilled"
                                data-testid="@dashboard/assets/grid-icon"
                                onClick={setGrid}
                                intent={dashboardAssetsGridMode ? 'brand' : 'neutral'}
                                priority="secondary"
                            />
                        </Row>
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
                                localCurrency={baseCurrencyCode}
                                currentFiatRates={currentFiatRates}
                                accounts={asset.accounts}
                                isStakeNetwork={asset.isStakeNetwork}
                            />
                        ))}
                        {discoveryInProgress && <AssetCardSkeleton />}
                    </GridWrapper>
                    {isError && (
                        <Card width="100%">
                            <InfoMessage>
                                <Icon
                                    name="warning"
                                    intent="critical"
                                    size={14}
                                    margin={{ right: 4 }}
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
                        baseCurrencyCode={baseCurrencyCode}
                        currentFiatRates={currentFiatRates}
                    />

                    {isError && (
                        <InfoMessage>
                            <Icon
                                name="warning"
                                intent="critical"
                                size={14}
                                margin={{ right: 4 }}
                            />
                            <Translation id="TR_DASHBOARD_ASSETS_ERROR" />
                        </InfoMessage>
                    )}
                </Card>
            )}
        </DashboardSection>
    );
};
