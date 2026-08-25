import { type ReactNode, useRef } from 'react';

import { AssetsList, AssetsListEmpty } from 'src/components/suite/asset-picker/components';
import { useListScrollReset } from 'src/components/suite/asset-picker/hooks';
import { type AssetPickerListItem } from 'src/components/suite/asset-picker/types';
import { getAssetPickerItemHeight } from 'src/components/suite/asset-picker/utils/assetPickerItemHeights';

const LIST_HEIGHT = 530;

export interface AssetListWrapperProps {
    listItems: AssetPickerListItem[];
    renderItem: (item: AssetPickerListItem) => ReactNode;
    /**
     * Trigger to reset scroll position when this prop. changes
     */
    resetScrollTrigger: string;
}

export function AssetListWrapper({
    listItems,
    renderItem,
    resetScrollTrigger,
}: AssetListWrapperProps) {
    const listRef = useRef<HTMLDivElement>(null);

    useListScrollReset(listRef, resetScrollTrigger);

    return (
        <AssetsListEmpty
            isEmpty={listItems.length === 0}
            heading="TR_ASSET_PICKER_SEARCH_NO_RESULTS"
            description="TR_ASSET_PICKER_SEARCH_NO_RESULTS_DESCRIPTION"
            height={LIST_HEIGHT}
        >
            <AssetsList
                items={listItems}
                renderItem={renderItem}
                getItemHeight={getAssetPickerItemHeight}
                height={LIST_HEIGHT}
                ref={listRef}
            />
        </AssetsListEmpty>
    );
}
