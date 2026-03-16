import { useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import { type TranslationKey } from '@suite/intl';
import {
    type TradingAssetOption,
    createAssetNativeTokenOption,
    createAssetTokenOption,
    getCryptoId,
} from '@suite-common/trading';
import { type NetworkSymbol, networkSymbolCollection } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { accountSearchFn, isTokenMatchesSearch } from '@suite-common/wallet-utils';

import {
    ASSET_ROW_GROUP_LABEL_HEIGHT,
    ASSET_ROW_HEIGHT,
    ASSET_ROW_HEIGHTS_BY_SIZE,
} from 'src/components/suite/asset-picker/constants';
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
        searchFor(asset.symbol)
    );
}

function excludeCryptoIds(excludedCryptoIds: Set<CryptoId>) {
    return function excludeCryptoIdsFilter(accountOrToken: AggregatedAccountWithTokens) {
        switch (accountOrToken.type) {
            case 'account':
                return !excludedCryptoIds.has(getCryptoId(accountOrToken.account.symbol));
            case 'token':
                return !excludedCryptoIds.has(
                    getCryptoId(accountOrToken.account.symbol, accountOrToken.token.contract),
                );
            default:
                return false;
        }
    };
}

/**
 * Note this is going to be replaced soon with more sophisticated top assets logic.
 */
function createTopFiveAssets(excludedCryptoIds: Set<CryptoId>) {
    return (
        (
            [
                createAssetNativeTokenOption('btc'),
                createAssetNativeTokenOption('eth'),
                createAssetTokenOption('eth', {
                    contract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                    symbol: 'USDT',
                    name: 'Tether',
                }),
                createAssetTokenOption('eth', {
                    contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    symbol: 'USDC',
                    name: 'USDC',
                }),
                createAssetNativeTokenOption('sol'),
            ] satisfies TradingAssetOption[]
        )
            // E.g. filter out "from" field value
            .filter(asset => !excludedCryptoIds.has(asset.id))
    );
}

type GetOrderNetworksProps = {
    topFiveAssets: TradingAssetOption[];
    assets: TradingAssetOption[];
    accountsWithTokens: AggregatedAccountWithTokens[];
};

function getOrderNetworks({ topFiveAssets, assets, accountsWithTokens }: GetOrderNetworksProps) {
    const networks: Set<NetworkSymbol> = new Set();

    topFiveAssets.forEach(asset => networks.add(asset.networkSymbol));
    assets.forEach(asset => networks.add(asset.networkSymbol));
    accountsWithTokens.forEach(item => networks.add(item.account.symbol));

    return networkSymbolCollection.filter(networkSymbol => networks.has(networkSymbol));
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
    const { assets, excludedCryptoIds } = useAssetsContext();
    const accountsWithTokens = useAgregatedAccountsWithTokens();

    return useMemo(() => {
        const listItems: TradingAssetListItem[] = [];

        const topFiveAssets =
            search.length === 0 && !networkSymbol ? createTopFiveAssets(excludedCryptoIds) : [];
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

        const allAccountsWithTokens = accountsWithTokens.filter(
            excludeCryptoIds(excludedCryptoIds),
        );

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
                            tokensMatch: false,
                            accountLabel: '', // Todo: select label from SuiteSync
                        });
                    case 'token':
                        return isTokenMatchesSearch(accountOrToken.token, search);
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

                case 'token':
                    listItems.push({
                        type: 'token',
                        token: accountOrToken.token,
                        account: accountOrToken.account,
                        height: ASSET_ROW_HEIGHT,
                    });
                    break;
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
            topFiveAssets,
            assets: allAssets,
            accountsWithTokens: allAccountsWithTokens,
        });

        return { listItems, networks: orderedNetworks };
    }, [accountsWithTokens, assets, excludedCryptoIds, networkSymbol, search]);
}
