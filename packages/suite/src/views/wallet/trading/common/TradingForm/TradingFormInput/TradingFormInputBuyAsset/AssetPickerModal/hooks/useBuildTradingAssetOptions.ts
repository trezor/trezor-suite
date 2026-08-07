import { useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import { type TranslationKey } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import {
    type TradingAssetOption,
    createAssetNativeTokenOption,
    createAssetTokenOption,
    getCryptoId,
} from '@suite-common/trading';
import { type NetworkConfigDeps, type NetworkSymbol } from '@suite-common/wallet-config';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { accountSearchFn, isTokenMatchesSearch } from '@suite-common/wallet-utils';

import {
    ASSET_ROW_GROUP_LABEL_HEIGHT,
    ASSET_ROW_HEIGHT,
    ASSET_ROW_HEIGHTS_BY_SIZE,
} from 'src/components/suite/asset-picker/constants';
import { useTokenDisplaySymbolNames } from 'src/components/suite/asset-picker/hooks';
import { getTokenDisplaySymbolName } from 'src/components/suite/asset-picker/utils/tokenDisplayNames';
import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { useAssetsContext } from '../../AssetOptionsContext';
import {
    type AggregatedAccountWithTokens,
    useAgregatedAccountsWithTokens,
} from '../../hooks/useAgregatedAccountsWithTokens';

function createSearchFilter(search: string) {
    return function searchFor(property?: string | null) {
        return Boolean(property?.toLocaleLowerCase().includes(search));
    };
}

function assetSearchFilter(asset: TradingAssetOption, search: string) {
    const searchFor = createSearchFilter(
        search.replaceAll('(', '').replaceAll(')', '').toLocaleLowerCase(),
    );

    return (
        searchFor(asset.name) ||
        searchFor(asset.networkName) ||
        searchFor(asset.displaySymbol) ||
        searchFor(asset.contractAddress) ||
        searchFor(asset.symbol) ||
        searchFor(asset.displaySymbolName)
    );
}

function excludeCryptoIds(deps: NetworkConfigDeps, excludedCryptoIds: Set<CryptoId>) {
    return function excludeCryptoIdsFilter(accountOrToken: AggregatedAccountWithTokens) {
        switch (accountOrToken.type) {
            case 'account':
                return !excludedCryptoIds.has(getCryptoId(deps, accountOrToken.account.symbol));
            case 'token':
                return !excludedCryptoIds.has(
                    getCryptoId(deps, accountOrToken.account.symbol, accountOrToken.token.contract),
                );
            default:
                return false;
        }
    };
}

/**
 * Note this is going to be replaced soon with more sophisticated top assets logic.
 */
function createTopFiveAssets(deps: NetworkConfigDeps, excludedCryptoIds: Set<CryptoId>) {
    return (
        (
            [
                createAssetNativeTokenOption(deps, 'btc'),
                createAssetNativeTokenOption(deps, 'eth'),
                createAssetTokenOption(deps, 'eth', {
                    contract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                    symbol: 'USDT',
                    name: 'Tether',
                }),
                createAssetTokenOption(deps, 'eth', {
                    contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    symbol: 'USDC',
                    name: 'USDC',
                }),
                createAssetNativeTokenOption(deps, 'sol'),
            ] satisfies TradingAssetOption[]
        )
            // E.g. filter out "from" field value
            .filter(asset => !excludedCryptoIds.has(asset.id))
    );
}

type GetOrderNetworksProps = {
    networkConfigDeps: NetworkConfigDeps;
    topFiveAssets: TradingAssetOption[];
    assets: TradingAssetOption[];
    accountsWithTokens: AggregatedAccountWithTokens[];
};

function getOrderNetworks({
    networkConfigDeps,
    topFiveAssets,
    assets,
    accountsWithTokens,
}: GetOrderNetworksProps) {
    const networks: Set<NetworkSymbol> = new Set();

    topFiveAssets.forEach(asset => networks.add(asset.networkSymbol));
    assets.forEach(asset => networks.add(asset.networkSymbol));
    accountsWithTokens.forEach(item => networks.add(item.account.symbol));

    return networkConfigDeps.networkModuleRepository
        .getSupportedNetworks()
        .filter(networkSymbol => networks.has(networkSymbol));
}

export type TradingAssetListItem =
    | {
          type: 'top-assets';
          assets: TradingAssetOption[];
          height: number;
      }
    | {
          type: 'asset';
          asset: TradingAssetOption;
          height: number;
      }
    | {
          type: 'account';
          account: Account;
          height: number;
      }
    | {
          type: 'token';
          token: TokensWithRates;
          account: Account;
          height: number;
      }
    | {
          type: 'group-label';
          label: TranslationKey;
          height: number;
      }
    | {
          type: 'group-space';
          height: number;
      };

export interface UseBuildTradingAssetOptionsProps {
    search: string;
    networkSymbol: NetworkSymbol | undefined;
}

export function useBuildTradingAssetOptions({
    search,
    networkSymbol,
}: UseBuildTradingAssetOptionsProps) {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { assets, includedCryptoIds, excludedCryptoIds } = useAssetsContext();
    const accountsWithTokens = useAgregatedAccountsWithTokens();

    const tokens = useMemo(
        () =>
            accountsWithTokens
                .filter(item => item.type === 'token')
                .map(item => ({
                    account: item.account,
                    token: item.token,
                })),
        [accountsWithTokens],
    );
    const tokenDisplaySymbolNames = useTokenDisplaySymbolNames(tokens, assets);

    return useMemo(() => {
        const listItems: TradingAssetListItem[] = [];

        const topFiveAssets =
            search.length === 0 && !networkSymbol
                ? createTopFiveAssets(networkConfigDeps, excludedCryptoIds)
                : [];
        const topFiveAssetIds = new Set(topFiveAssets.map(asset => asset.id));

        if (topFiveAssets.length > 0) {
            listItems.push(
                {
                    type: 'top-assets',
                    assets: topFiveAssets,
                    height: 82,
                },
                {
                    type: 'group-space',
                    height: ASSET_ROW_HEIGHTS_BY_SIZE['lg'],
                },
            );
        }

        const allAccountsWithTokens = accountsWithTokens
            .filter(excludeCryptoIds(networkConfigDeps, excludedCryptoIds))
            .filter(accountOrToken => {
                switch (accountOrToken.type) {
                    case 'account':
                        return includedCryptoIds.has(
                            getCryptoId(networkConfigDeps, accountOrToken.account.symbol),
                        );
                    case 'token':
                        return includedCryptoIds.has(
                            getCryptoId(
                                networkConfigDeps,
                                accountOrToken.account.symbol,
                                accountOrToken.token.contract,
                            ),
                        );
                    default:
                        return false;
                }
            });

        const searchDisplayNameFilter = createSearchFilter(search.toLocaleLowerCase());

        const filteredAccounts = allAccountsWithTokens
            .filter(accountOrToken => {
                switch (accountOrToken.type) {
                    case 'account':
                    case 'token':
                        return networkSymbol
                            ? accountOrToken.account.symbol === networkSymbol
                            : true;
                    default:
                        return false;
                }
            })
            .filter(accountOrToken => {
                switch (accountOrToken.type) {
                    case 'account':
                        return accountSearchFn(accountOrToken.account, search, {
                            ...networkConfigDeps,
                            tokensMatch: false,
                            accountLabel: '', // Todo: select label from SuiteSync
                        });
                    case 'token': {
                        const displaySymbolName = getTokenDisplaySymbolName({
                            ...networkConfigDeps,
                            tokenDisplaySymbolNames,
                            account: accountOrToken.account,
                            token: accountOrToken.token,
                        });

                        return (
                            searchDisplayNameFilter(displaySymbolName) ||
                            isTokenMatchesSearch(accountOrToken.token, search)
                        );
                    }
                    default:
                        return false;
                }
            });

        if (filteredAccounts.length > 0) {
            listItems.push({
                type: 'group-label',
                label: 'TR_ASSET_PICKER_YOUR_ASSETS',
                height: ASSET_ROW_GROUP_LABEL_HEIGHT,
            });
        }

        for (const accountOrToken of filteredAccounts) {
            switch (accountOrToken.type) {
                case 'account':
                    listItems.push({
                        type: 'account',
                        account: accountOrToken.account,
                        height: ASSET_ROW_HEIGHT,
                    });
                    break;

                case 'token': {
                    const tokenDisplaySymbolName = getTokenDisplaySymbolName({
                        ...networkConfigDeps,
                        tokenDisplaySymbolNames,
                        account: accountOrToken.account,
                        token: accountOrToken.token,
                    });

                    listItems.push({
                        type: 'token',
                        token: {
                            ...accountOrToken.token,
                            name: tokenDisplaySymbolName,
                        },
                        account: accountOrToken.account,
                        height: ASSET_ROW_HEIGHT,
                    });
                    break;
                }
            }
        }

        const allAssets = assets.filter(
            asset => !topFiveAssetIds.has(asset.id) && !excludedCryptoIds?.has(asset.id),
        );

        const filteredAssets = allAssets
            .filter(asset => (networkSymbol ? asset.networkSymbol === networkSymbol : true))
            .filter(asset => assetSearchFilter(asset, search));

        if (filteredAccounts.length > 0 && filteredAssets.length > 0) {
            listItems.push({
                type: 'group-space',
                height: ASSET_ROW_HEIGHTS_BY_SIZE['lg'],
            });

            listItems.push({
                type: 'group-label',
                label: 'TR_ASSET_PICKER_ALL_ASSETS',
                height: ASSET_ROW_GROUP_LABEL_HEIGHT,
            });
        }

        for (const asset of filteredAssets) {
            listItems.push({
                type: 'asset',
                asset,
                height: ASSET_ROW_HEIGHT,
            });
        }

        const orderedNetworks = getOrderNetworks({
            networkConfigDeps,
            topFiveAssets,
            assets: allAssets,
            accountsWithTokens: allAccountsWithTokens,
        });

        return { listItems, networks: orderedNetworks };
    }, [
        accountsWithTokens,
        assets,
        includedCryptoIds,
        excludedCryptoIds,
        networkSymbol,
        search,
        tokenDisplaySymbolNames,
    ]);
}
