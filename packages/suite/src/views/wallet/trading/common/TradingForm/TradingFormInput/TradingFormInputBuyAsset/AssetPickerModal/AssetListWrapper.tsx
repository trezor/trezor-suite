import { type ReactNode, memo, useRef } from 'react';

import { AssetsList, AssetsListEmpty } from 'src/components/suite/asset-picker/components';
import { useListScrollReset } from 'src/components/suite/asset-picker/hooks';

import { type TradingAssetListItem } from './hooks/useBuildTradingAssetOptions';

const LIST_HEIGHT = 530;

export interface AssetListWrapperProps {
    renderItem: (item: TradingAssetListItem) => ReactNode;
    listItems: TradingAssetListItem[];
    resetScrollTrigger: string;
}

export const AssetListWrapper = memo(function AssetListWrapperInner({
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
                height={LIST_HEIGHT}
                ref={listRef}
            />
        </AssetsListEmpty>
    );
});
