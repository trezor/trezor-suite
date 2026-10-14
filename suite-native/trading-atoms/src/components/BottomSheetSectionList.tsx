import { type ReactElement, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';

import {
    BottomSheetFlashList,
    type BottomSheetFlashListControls,
    type BottomSheetFlashListProps,
} from '@suite-native/atoms';
import { type NativeStyle } from '@trezor/styles-native';

import {
    type ItemRenderConfig,
    type ListInternalItemShape,
    type SectionHeaderRenderConfig,
    type SectionListData,
    useSectionList,
} from '../hooks/useSectionList';

const DEFAULT_LIST_HEIGHT_RATIO = 0.9;

export type TradingBottomSheetSectionListProps<T, U> = Omit<
    BottomSheetFlashListProps<T>,
    | 'renderItem'
    | 'keyExtractor'
    | 'data'
    | 'estimatedItemSize'
    // not supported
    | 'getItemType'
    | 'overrideItemLayout'
    | 'onViewableItemsChanged'
    | 'viewabilityConfigCallbackPairs'
> & {
    data: SectionListData<T, U>;
    renderItem: (
        item: T,
        config: ItemRenderConfig<U>,
        sheetControls: BottomSheetFlashListControls,
    ) => ReactElement;
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
    estimatedListHeight,
    ...rest
}: TradingBottomSheetSectionListProps<T, U>) => {
    const { height: windowHeight } = useWindowDimensions();
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

    const listHeight = estimatedListHeight ?? windowHeight * DEFAULT_LIST_HEIGHT_RATIO;

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
