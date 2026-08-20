import { type ReactNode, useMemo, useState } from 'react';

import { normalizeForSearch } from '@suite-common/suite-utils';
import { type TradingType, usePreferredCurrencyUsdThreshold } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { type MyAsset } from '@suite-native/trading-types';

import { useTradingMyAssets } from './useTradingMyAssets';

export type MyAssetsSection = {
    assets: MyAsset[];
    key: string;
    label: ReactNode;
    lowBalanceAssets: MyAsset[];
    nonTradeableAssets: MyAsset[];
    sectionData: Account;
};

const doesAssetMatchSearch = (asset: MyAsset, normalizedFilterValue: string): boolean =>
    normalizeForSearch(asset.name).includes(normalizedFilterValue) ||
    normalizeForSearch(asset.symbol).includes(normalizedFilterValue) ||
    (asset.tokenSymbol != null &&
        normalizeForSearch(asset.tokenSymbol).includes(normalizedFilterValue)) ||
    (asset.cryptoId != null && normalizeForSearch(asset.cryptoId).includes(normalizedFilterValue));

const getSortWeight = (asset: MyAsset, normalizedFilterValue: string): number => {
    const name = normalizeForSearch(asset.name);
    const symbol = normalizeForSearch(asset.tokenSymbol ?? asset.symbol);

    if (name === normalizedFilterValue) return 0;
    if (symbol === normalizedFilterValue) return 1;
    if (name.startsWith(normalizedFilterValue)) return 2;
    if (symbol.startsWith(normalizedFilterValue)) return 3;
    if (name.includes(normalizedFilterValue)) return 4;
    if (symbol.includes(normalizedFilterValue)) return 5;

    return 6;
};

const groupAssets = (
    assets: MyAsset[],
    preferredCurrencyUsdThreshold: BaseCurrencyAmount | null,
) => {
    const regularAssets: MyAsset[] = [];
    const lowBalanceAssets: MyAsset[] = [];
    const nonTradeableAssets: MyAsset[] = [];

    assets.forEach(asset => {
        if (!asset.isEnabled) {
            nonTradeableAssets.push(asset);

            return;
        }

        if (
            asset.fiatBalance !== null &&
            preferredCurrencyUsdThreshold !== null &&
            asset.fiatBalance.lt(preferredCurrencyUsdThreshold)
        ) {
            lowBalanceAssets.push(asset);

            return;
        }

        regularAssets.push(asset);
    });

    return { assets: regularAssets, lowBalanceAssets, nonTradeableAssets };
};

export const useMyAssetsFilteredData = (tradingType: TradingType) => {
    const sections = useTradingMyAssets(tradingType);
    const preferredCurrencyUsdThreshold = usePreferredCurrencyUsdThreshold();
    const [filterSymbol, setFilterSymbol] = useState<NetworkSymbol | undefined>(undefined);
    const [filterValue, setFilterValue] = useState('');

    const filteredSections = useMemo<MyAssetsSection[]>(() => {
        const normalizedFilterValue = normalizeForSearch(filterValue);

        return sections
            .filter(section => !filterSymbol || section.sectionData.symbol === filterSymbol)
            .map(section => {
                const matchingAssets = normalizedFilterValue
                    ? [...section.data]
                          .filter(asset => doesAssetMatchSearch(asset, normalizedFilterValue))
                          .sort(
                              (assetA, assetB) =>
                                  getSortWeight(assetA, normalizedFilterValue) -
                                  getSortWeight(assetB, normalizedFilterValue),
                          )
                    : section.data;

                return {
                    ...section,
                    ...groupAssets(matchingAssets, preferredCurrencyUsdThreshold),
                };
            })
            .filter(
                section =>
                    section.assets.length > 0 ||
                    section.lowBalanceAssets.length > 0 ||
                    section.nonTradeableAssets.length > 0,
            );
    }, [filterSymbol, filterValue, preferredCurrencyUsdThreshold, sections]);

    const scrollResetKey = `Network:${filterSymbol ?? 'all'};Search:${filterValue}`;

    return {
        filteredSections,
        filterSymbol,
        scrollResetKey,
        setFilterSymbol,
        setFilterValue,
    };
};
