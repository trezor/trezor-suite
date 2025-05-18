import { ReactElement } from 'react';
import { Dimensions } from 'react-native';

import { BottomSheetFlashList, BottomSheetFlashListProps } from '@suite-native/atoms';

import {
    ItemRenderConfig,
    ListInternalItemShape,
    SectionListData,
    useSectionList,
} from '../../hooks/general/useSectionList';

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

export const BottomSheetSectionList = <T, U = undefined>({
    keyExtractor,
    renderItem,
    estimatedItemSize,
    data,
    noSingletonSectionHeader,
    ...rest
}: TradingBottomSheetSectionListProps<T, U>) => {
    const {
        data: internalData,
        keyExtractor: internalKeyExtractor,
        renderItem: internalRenderItem,
    } = useSectionList({
        data,
        keyExtractor,
        renderItem,
        noSingletonSectionHeader,
    });

    const listHeight = Dimensions.get('window').height * 0.9;

    return (
        <BottomSheetFlashList<ListInternalItemShape<T, U>>
            keyExtractor={internalKeyExtractor}
            renderItem={internalRenderItem}
            estimatedItemSize={estimatedItemSize}
            estimatedListHeight={listHeight}
            data={internalData}
            keyboardShouldPersistTaps="handled"
            {...rest}
        />
    );
};
