import { ReactElement, ReactNode, useMemo } from 'react';

import { UnreachableCaseError } from '@suite-common/suite-utils';
import { BottomSheetFlashList, BottomSheetFlashListProps, Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type ItemRenderConfig<U> = {
    isFirst?: boolean;
    isLast?: boolean;
    sectionData: U;
};

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

export type SectionListData<T, U = undefined> = {
    key: string;
    label: ReactNode;
    sectionData: U;
    data: T[];
}[];

type ListInternalItemShape<T, U> =
    // [type, text, key]
    | ['sectionHeader', ReactNode, string]
    // [type, data, config]
    | ['item', T, ItemRenderConfig<U>];

const SECTION_HEADER_HEIGHT = 48 as const;

const itemStyle = prepareNativeStyle<ItemRenderConfig<unknown>>(
    ({ colors, spacings, borders }, { isFirst, isLast }) => ({
        backgroundColor: colors.backgroundSurfaceElevation1,
        paddingHorizontal: spacings.sp12,
        extend: [
            {
                condition: !!isFirst,
                style: {
                    borderTopLeftRadius: borders.radii.r20,
                    borderTopRightRadius: borders.radii.r20,
                },
            },
            {
                condition: !!isLast,
                style: {
                    borderBottomLeftRadius: borders.radii.r20,
                    borderBottomRightRadius: borders.radii.r20,
                },
            },
        ],
    }),
);

const transformToInternalFlatListData = <T, U = undefined>(
    inputData: SectionListData<T, U>,
    noSingletonSectionHeader: boolean | undefined,
): ListInternalItemShape<T, U>[] =>
    inputData.reduce(
        (acc, { key, label, data, sectionData }) => {
            const itemsData = data.map(
                (item, index): ListInternalItemShape<T, U> => [
                    'item',
                    item,
                    {
                        isFirst: index === 0,
                        isLast: index === data.length - 1,
                        sectionData,
                    },
                ],
            );

            if (noSingletonSectionHeader && inputData.length === 1) {
                return [...acc, ...itemsData];
            }

            return [...acc, ['sectionHeader', label, key], ...itemsData];
        },
        [] as ListInternalItemShape<T, U>[],
    );

const internalKeyExtractor = <T, U>(
    item: ListInternalItemShape<T, U>,
    itemKeyExtractor: (item: T, sectionData: U) => string,
) => {
    switch (item[0]) {
        case 'sectionHeader':
            return item[2];

        case 'item':
            return itemKeyExtractor(item[1], item[2].sectionData);

        default:
            throw new UnreachableCaseError(item[0]);
    }
};

const renderInternalItem = <T, U>(
    item: ListInternalItemShape<T, U>,
    renderItem: (item: T, config: ItemRenderConfig<U>) => ReactElement,
    applyStyle: ReturnType<typeof useNativeStyles>['applyStyle'],
): ReactElement => {
    switch (item[0]) {
        case 'sectionHeader':
            return (
                <Box paddingVertical="sp12">
                    <Text variant="hint" color="textSubdued">
                        {item[1]}
                    </Text>
                </Box>
            );

        case 'item':
            return <Box style={applyStyle(itemStyle, item[2])}>{renderItem(item[1], item[2])}</Box>;

        default:
            throw new UnreachableCaseError(item[0]);
    }
};

export const TradingBottomSheetSectionList = <T, U = undefined>({
    keyExtractor,
    renderItem,
    estimatedItemSize,
    data,
    noSingletonSectionHeader,
    ...rest
}: TradingBottomSheetSectionListProps<T, U>) => {
    const { applyStyle } = useNativeStyles();

    const sectionsCount = data.length;

    const itemsCount = useMemo(
        () =>
            data.reduce(
                (intermediateDataLength, { data: sectionData }) =>
                    intermediateDataLength + sectionData.length,
                0,
            ),
        [data],
    );

    const estimatedListSize = useMemo(
        () =>
            itemsCount * estimatedItemSize +
            (sectionsCount === 1 && noSingletonSectionHeader
                ? 0
                : SECTION_HEADER_HEIGHT * sectionsCount),
        [itemsCount, estimatedItemSize, sectionsCount, noSingletonSectionHeader],
    );

    const internalData = useMemo(
        () => transformToInternalFlatListData<T, U>(data, noSingletonSectionHeader),
        [data, noSingletonSectionHeader],
    );

    return (
        <BottomSheetFlashList<ListInternalItemShape<T, U>>
            keyExtractor={item => internalKeyExtractor(item, keyExtractor)}
            renderItem={({ item }) => renderInternalItem(item, renderItem, applyStyle)}
            estimatedItemSize={estimatedItemSize}
            estimatedListHeight={estimatedListSize}
            data={internalData}
            {...rest}
        />
    );
};
