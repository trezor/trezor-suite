import { ReactNode, memo, useEffect, useRef } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';

import { AssetsList, AssetsListEmpty } from 'src/components/suite/asset-picker/components';
import { useDataFingerprint } from 'src/components/suite/asset-picker/hooks';

import {
    TradingAssetListItem,
    useBuildTradingAssetOptions,
} from './hooks/useBuildTradingAssetOptions';

const LIST_HEIGHT = 620;
export interface AssetListWrapperProps {
    search: string;
    networkSymbol: NetworkSymbol | undefined;
    renderItem: (item: TradingAssetListItem) => ReactNode;
}

export const AssetListWrapper = memo(function AssetListWrapperInner({
    search,
    networkSymbol,
    renderItem,
}: AssetListWrapperProps) {
    const listRef = useRef<HTMLDivElement>(null);

    const { listItems } = useBuildTradingAssetOptions({
        search,
        networkSymbol,
    });
    const listItemsFingerprint = useDataFingerprint(listItems);

    useEffect(() => {
        listRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    }, [listRef, listItemsFingerprint]);

    return (
        <AssetsListEmpty
            isEmpty={listItems.length === 0}
            heading="TR_ASSET_PICKER_SEARCH_NO_RESULTS"
            height={LIST_HEIGHT}
        >
            <AssetsList
                items={listItems}
                itemsFingerprint={listItemsFingerprint}
                renderItem={renderItem}
                height={LIST_HEIGHT}
                ref={listRef}
            />
        </AssetsListEmpty>
    );
});
