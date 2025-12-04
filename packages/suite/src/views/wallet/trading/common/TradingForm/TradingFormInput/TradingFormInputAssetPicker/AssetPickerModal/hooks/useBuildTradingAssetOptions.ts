import { useMemo } from 'react';

import { TranslationKey } from '@suite-common/intl-types';
import { TradingAssetOption } from '@suite-common/trading';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { accountSearchFn, isTokenMatchesSearch } from '@suite-common/wallet-utils';

import {
    ASSET_ROW_ACCOUNT_HEIGHT,
    ASSET_ROW_ASSET_HEIGHT,
    ASSET_ROW_GROUP_LABEL_HEIGHT,
    ASSET_ROW_HEIGHTS_BY_SIZE,
    ASSET_ROW_TOKEN_HEIGHT,
} from 'src/components/suite/asset-picker/components';
import { TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { useAssetsContext } from '../../AssetOptionsContext';
import { useAgregatedAccountsWithTokens } from '../../hooks/useAgregatedAccountsWithTokens';

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

export type TradingAssetListItem =
    | {
          type: 'top-five-assets';
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
    const { assetsByTradingVolume } = useAssetsContext();
    const accountsWithTokens = useAgregatedAccountsWithTokens();

    return useMemo(() => {
        const listItems: TradingAssetListItem[] = [];

        const topFiveAssets =
            search.length === 0 && !networkSymbol ? assetsByTradingVolume.slice(0, 5) : [];

        if (topFiveAssets.length > 0) {
            listItems.push(
                {
                    type: 'top-five-assets',
                    assets: topFiveAssets,
                    height: 82,
                },
                {
                    type: 'group-space',
                    height: ASSET_ROW_HEIGHTS_BY_SIZE['lg'],
                },
            );
        }

        const filteredAccounts = accountsWithTokens
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
                        return accountSearchFn(accountOrToken.account, search);
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
                        height: ASSET_ROW_ACCOUNT_HEIGHT,
                    });
                    break;

                case 'token':
                    listItems.push({
                        type: 'token',
                        token: accountOrToken.token,
                        account: accountOrToken.account,
                        height: ASSET_ROW_TOKEN_HEIGHT,
                    });
                    break;
            }
        }

        const filteredAssets = assetsByTradingVolume
            .slice(topFiveAssets.length)
            .filter(asset => (networkSymbol ? asset.networkSymbol === networkSymbol : true))
            .filter(asset => assetSearchFilter(asset, search));

        if (filteredAccounts.length > 0 && filteredAssets.length > 0) {
            listItems.push({
                type: 'group-space',
                height: ASSET_ROW_HEIGHTS_BY_SIZE['lg'],
            });
        }

        if (filteredAssets.length > 0) {
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
                height: ASSET_ROW_ASSET_HEIGHT,
            });
        }

        return { listItems };
    }, [accountsWithTokens, assetsByTradingVolume, networkSymbol, search]);
}
