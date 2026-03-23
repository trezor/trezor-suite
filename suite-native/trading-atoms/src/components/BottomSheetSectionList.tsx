import { type ReactElement, type ReactNode } from 'react';
import { Dimensions } from 'react-native';

import { BottomSheetFlashList, type BottomSheetFlashListProps } from '@suite-native/atoms';
import { type NativeStyle } from '@trezor/styles-native';

import {
    type ItemRenderConfig,
    type ListInternalItemShape,
    type SectionHeaderRenderConfig,
    type SectionListData,
    useSectionList,
} from '../hooks/useSectionList';

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
    | 'onViewableItemsChanged'
    | 'viewabilityConfigCallbackPairs'
> & {
    data: SectionListData<T, U>;
    renderItem: (item: T, config: ItemRenderConfig<U>) => ReactElement;
    renderSectionHeader?: (label: ReactNode, config: SectionHeaderRenderConfig<U>) => ReactElement;
    keyExtractor: (item: T, sectionData: U) => string;
    noSingletonSectionHeader?: boolean;
    itemStyle?: NativeStyle<ItemRenderConfig<unknown>>;
    SectionEmptyComponent?: ReactElement;
};

export const BottomSheetSectionList = <T, U = undefined>({
    keyExtractor,
    renderItem,
    renderSectionHeader,
    data,
    noSingletonSectionHeader,
    itemStyle,
    SectionEmptyComponent,
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
        renderSectionHeader,
        noSingletonSectionHeader,
        itemStyle,
        SectionEmptyComponent,
    });

    const listHeight = Dimensions.get('window').height * 0.9;

    return (
        <BottomSheetFlashList<ListInternalItemShape<T, U>>
            keyExtractor={internalKeyExtractor}
            renderItem={internalRenderItem}
            estimatedListHeight={listHeight}
            data={internalData}
            keyboardShouldPersistTaps="handled"
            {...rest}
        />
    );
};
