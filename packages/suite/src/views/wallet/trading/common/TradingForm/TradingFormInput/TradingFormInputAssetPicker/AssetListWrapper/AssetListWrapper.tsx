import { type ReactNode, memo, useRef } from 'react';

import { AssetsList, AssetsListEmpty } from 'src/components/suite/asset-picker/components';
import { useListScrollReset } from 'src/components/suite/asset-picker/hooks';

const LIST_HEIGHT = 530;

export interface AssetListWrapperProps<T> {
    listItems: T[];
    renderItem: (item: T) => ReactNode;
    getItemHeight: (item: T) => number;
    //Trigger to reset scroll position when this prop. changes
    resetScrollTrigger: string;
}

function AssetListWrapperInner<T>({
    listItems,
    renderItem,
    getItemHeight,
    resetScrollTrigger,
}: AssetListWrapperProps<T>) {
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
                getItemHeight={getItemHeight}
                height={LIST_HEIGHT}
                ref={listRef}
            />
        </AssetsListEmpty>
    );
}

export const AssetListWrapper = memo(AssetListWrapperInner) as typeof AssetListWrapperInner;
