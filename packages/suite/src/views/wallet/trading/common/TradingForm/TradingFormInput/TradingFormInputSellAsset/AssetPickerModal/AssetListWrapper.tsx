import { ReactNode, memo, useRef } from 'react';

import { AssetsList, AssetsListEmpty } from 'src/components/suite/asset-picker/components';
import { AssetPickerListItem, useListScrollReset } from 'src/components/suite/asset-picker/hooks';

const LIST_HEIGHT = 530;

export interface AssetListWrapperProps {
    listItems: AssetPickerListItem[];
    listItemsFingerprint: string;
    renderItem: (item: AssetPickerListItem) => ReactNode;
}

export const AssetListWrapper = memo(
    function AssetListWrapperInner({
        listItems,
        listItemsFingerprint,
        renderItem,
    }: AssetListWrapperProps) {
        const listRef = useRef<HTMLDivElement>(null);

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
    },
    function isEqual(prevProps, nextProps) {
        return prevProps.listItemsFingerprint === nextProps.listItemsFingerprint;
    },
);
