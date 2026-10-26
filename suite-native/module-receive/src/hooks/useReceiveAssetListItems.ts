import { useCallback, useMemo, useState } from 'react';

import { type GlobalReceiveAssetListItem, useGlobalReceiveAssets } from '@suite-common/receive';
import { useTranslate } from '@suite-native/intl';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { type ListRenderItem } from '../components/AssetList';

const OTHER_ASSETS_PAGE_SIZE = 100;

const listItemGroup = (label: string, items: GlobalReceiveAssetListItem[]): ListRenderItem[] => {
    if (items.length === 0) {
        return [];
    }

    return [
        label,
        ...items.map((item, index) => ({
            ...item,
            isFirst: index === 0,
            isLast: index === items.length - 1,
        })),
    ];
};

type UseReceiveAssetListItemsParams = {
    searchValue: string;
    filteredNetworks: NetworkSymbol[];
};

export const useReceiveAssetListItems = ({
    searchValue,
    filteredNetworks,
}: UseReceiveAssetListItemsParams) => {
    const { translate } = useTranslate();

    // FlashList cannot handle all the items at once, so we need to paginate the other assets list.
    // Using all the items at once caused my iPhone to use all the heap memory and freeze the UI.
    const [otherAssetsLimit, setOtherAssetsLimit] = useState(OTHER_ASSETS_PAGE_SIZE);

    const { myAssets, otherAssets, hasMoreOtherAssets } = useGlobalReceiveAssets({
        search: searchValue,
        networkSymbols: filteredNetworks,
        otherAssetsLimit,
    });

    const items = useMemo(
        () => [
            ...listItemGroup(translate('moduleReceive.assetList.myAssets'), myAssets),
            ...listItemGroup(translate('moduleReceive.assetList.allAssets'), otherAssets),
        ],
        [myAssets, otherAssets, translate],
    );

    const loadMoreOtherAssets = useCallback(() => {
        if (hasMoreOtherAssets) {
            setOtherAssetsLimit(limit => limit + OTHER_ASSETS_PAGE_SIZE);
        }
    }, [hasMoreOtherAssets]);

    const resetOtherAssetsLimit = useCallback(() => {
        setOtherAssetsLimit(OTHER_ASSETS_PAGE_SIZE);
    }, []);

    return { items, loadMoreOtherAssets, resetOtherAssetsLimit };
};
