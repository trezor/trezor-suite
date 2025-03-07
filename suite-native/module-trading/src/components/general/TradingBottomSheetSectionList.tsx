import { ReactElement } from 'react';

import { BottomSheetFlashList, BottomSheetFlashListProps } from '@suite-native/atoms';

import {
    ItemRenderConfig,
    ListInternalItemShape,
    SectionListData,
    useSectionList,
} from '../../hooks/useSectionList';

export type TradingBottomSheetSectionListProps<T, U> = Omit<
    BottomSheetFlashListProps<T>,
    | 'renderItem'
    | 'keyExtractor'
    | 'data'
    | 'estimatedItemSize'
    // computed automatically
    | 'estimatedListHeight'
    // not supported
    | 'getItemType'
    | 'overrideItemLayout'
> & {
    data: SectionListData<T, U>;
    renderItem: (item: T, config: ItemRenderConfig<U>) => ReactElement;
    keyExtractor: (item: T, sectionData: U) => string;
    estimatedItemSize: number;
    estimatedHeaderHeight: number;
    noSingletonSectionHeader?: boolean;
};

const CONTENT_BOTTOM_OFFSET = 20;

export const TradingBottomSheetSectionList = <T, U = undefined>({
    keyExtractor,
    renderItem,
    estimatedItemSize,
    estimatedHeaderHeight,
    data,
    noSingletonSectionHeader,
    ...rest
}: TradingBottomSheetSectionListProps<T, U>) => {
    const {
        data: internalData,
        estimatedListSize,
        keyExtractor: internalKeyExtractor,
        renderItem: internalRenderItem,
    } = useSectionList({
        data,
        estimatedItemSize,
        keyExtractor,
        renderItem,
        noSingletonSectionHeader,
    });

    const estimatedListHeight = estimatedListSize + estimatedHeaderHeight + CONTENT_BOTTOM_OFFSET;

    return (
        <BottomSheetFlashList<ListInternalItemShape<T, U>>
            keyExtractor={internalKeyExtractor}
            renderItem={internalRenderItem}
            estimatedItemSize={estimatedItemSize}
            estimatedListHeight={estimatedListHeight}
            data={internalData}
            {...rest}
        />
    );
};
