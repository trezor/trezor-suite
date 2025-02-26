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
    noSingletonSectionHeader?: boolean;
};

export const TradingBottomSheetSectionList = <T, U = undefined>({
    keyExtractor,
    renderItem,
    estimatedItemSize,
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

    return (
        <BottomSheetFlashList<ListInternalItemShape<T, U>>
            keyExtractor={internalKeyExtractor}
            renderItem={internalRenderItem}
            estimatedItemSize={estimatedItemSize}
            estimatedListHeight={estimatedListSize}
            data={internalData}
            {...rest}
        />
    );
};
