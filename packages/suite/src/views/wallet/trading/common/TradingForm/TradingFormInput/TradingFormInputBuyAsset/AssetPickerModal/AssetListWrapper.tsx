import { ReactNode, memo, useRef } from 'react';

import { AssetsList, AssetsListEmpty } from 'src/components/suite/asset-picker/components';
import { useDataFingerprint, useListScrollReset } from 'src/components/suite/asset-picker/hooks';

import { TradingAssetListItem } from './hooks/useBuildTradingAssetOptions';

const LIST_HEIGHT = 530;

export interface AssetListWrapperProps {
    renderItem: (item: TradingAssetListItem) => ReactNode;
    listItems: TradingAssetListItem[];
}

export const AssetListWrapper = memo(function AssetListWrapperInner({
    listItems,
    renderItem,
}: AssetListWrapperProps) {
    const listRef = useRef<HTMLDivElement>(null);
    const listItemsFingerprint = useDataFingerprint(listItems);

    useListScrollReset(listRef, listItemsFingerprint);

    return (
        <AssetsListEmpty
            isEmpty={listItems.length === 0}
            heading="TR_ASSET_PICKER_SEARCH_NO_RESULTS"
            description="TR_ASSET_PICKER_SEARCH_NO_RESULTS_DESCRIPTION"
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
