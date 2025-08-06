import { ReactElement, ReactNode, useMemo } from 'react';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedBox, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { exhaustive } from '@trezor/type-utils';

export type ItemRenderConfig<U> = {
    isFirst?: boolean;
    isLast?: boolean;
    sectionData: U;
    isEnabled?: boolean;
};

export type SectionListDataArray<T> = (T & { isEnabled?: boolean })[];

export type SectionListData<T, U = undefined> = {
    key: string;
    label: ReactNode;
    sectionData: U;
    data: SectionListDataArray<T>;
}[];

export type SectionHeaderRenderConfig<U> = {
    sectionData: U;
    key: string;
};

export type ListInternalItemShape<T, U> =
    // [type, text, key, sectionData]
    | ['sectionHeader', ReactNode, string, U]
    // [type, data, config]
    | ['item', T, ItemRenderConfig<U>]
    // [type, key, sectionData]
    | ['emptySection', string, ItemRenderConfig<U>];

export type UseSectionListProps<T, U> = {
    data: SectionListData<T, U>;
    renderItem: (item: T, config: ItemRenderConfig<U>) => ReactElement;
    renderSectionHeader?: (label: ReactNode, config: SectionHeaderRenderConfig<U>) => ReactElement;
    SectionEmptyComponent?: ReactElement;
    keyExtractor: (item: T, sectionData: U) => string;
    noSingletonSectionHeader: boolean | undefined;
    isLastItemRounded?: boolean;
    itemStyle?: ReturnType<typeof prepareNativeStyle<ItemRenderConfig<unknown>>>;
};

const defaultItemStyle = prepareNativeStyle<ItemRenderConfig<unknown>>(
    ({ colors, spacings, borders }, { isFirst, isLast, isEnabled }) => ({
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
            {
                condition: !isEnabled,
                style: {
                    backgroundColor: colors.baseFillSurfacePage,
                },
            },
        ],
    }),
);

const transformToInternalFlatListData = <T, U = undefined>(
    inputData: SectionListData<T, U>,
    noSingletonSectionHeader: boolean | undefined,
    withEmptySectionPlaceholder: boolean,
    isLastItemRounded: boolean,
): ListInternalItemShape<T, U>[] =>
    inputData.reduce(
        (acc, { key, label, data, sectionData }) => {
            const itemsData = data.map(
                (item, index): ListInternalItemShape<T, U> => [
                    'item',
                    item,
                    {
                        isFirst: index === 0,
                        isLast: index === data.length - 1 && isLastItemRounded,
                        sectionData,
                        isEnabled: item.isEnabled !== undefined ? item.isEnabled : true,
                    },
                ],
            );

            if (!noSingletonSectionHeader || inputData.length > 1) {
                acc.push(['sectionHeader', label, key, sectionData]);

                if (withEmptySectionPlaceholder && itemsData.length === 0) {
                    acc.push([
                        'emptySection',
                        key + '-empty-section',
                        {
                            isFirst: true,
                            isLast: true,
                            sectionData,
                            isEnabled: false,
                        },
                    ]);
                }
            }

            acc.push(...itemsData);

            return acc;
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

        case 'emptySection':
            return item[1];

        default:
            return exhaustive(item[0]);
    }
};

const renderInternalItem = <T, U>(
    item: ListInternalItemShape<T, U>,
    renderItem: (item: T, config: ItemRenderConfig<U>) => ReactElement,
    renderSectionHeader:
        | ((label: ReactNode, config: SectionHeaderRenderConfig<U>) => ReactElement)
        | undefined,
    SectionEmptyComponent: ReactElement | undefined,
    applyStyle: ReturnType<typeof useNativeStyles>['applyStyle'],
    itemStyle?: ReturnType<typeof prepareNativeStyle<ItemRenderConfig<unknown>>>,
): ReactElement => {
    switch (item[0]) {
        case 'sectionHeader':
            return (
                <AnimatedBox
                    paddingVertical={renderSectionHeader ? undefined : 'sp12'}
                    entering={FadeIn}
                    exiting={FadeOut}
                >
                    {renderSectionHeader ? (
                        renderSectionHeader(item[1], {
                            sectionData: item[3],
                            key: item[2],
                        })
                    ) : (
                        <Text variant="hint" color="textSubdued">
                            {item[1]}
                        </Text>
                    )}
                </AnimatedBox>
            );

        case 'item':
            return (
                <AnimatedBox
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={applyStyle(itemStyle ?? defaultItemStyle, item[2])}
                >
                    {renderItem(item[1], item[2])}
                </AnimatedBox>
            );

        case 'emptySection':
            return (
                <AnimatedBox
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={applyStyle(itemStyle ?? defaultItemStyle, {
                        isFirst: true,
                        isLast: true,
                        sectionData: item[2],
                        isEnabled: false,
                    })}
                >
                    {SectionEmptyComponent}
                </AnimatedBox>
            );

        default:
            return exhaustive(item[0]);
    }
};

export const useSectionList = <T, U = undefined>({
    data,
    renderItem,
    renderSectionHeader,
    keyExtractor,
    noSingletonSectionHeader,
    isLastItemRounded = true,
    itemStyle,
    SectionEmptyComponent,
}: UseSectionListProps<T, U>) => {
    const { applyStyle } = useNativeStyles();
    const sectionsCount = data.length;
    const isEmptySectionPlaceholderDefined = !!SectionEmptyComponent;

    const itemsCount = useMemo(
        () =>
            data.reduce(
                (intermediateDataLength, { data: sectionData }) =>
                    intermediateDataLength + sectionData.length,
                0,
            ),
        [data],
    );

    const internalData = useMemo(
        () =>
            transformToInternalFlatListData<T, U>(
                data,
                noSingletonSectionHeader,
                isEmptySectionPlaceholderDefined,
                isLastItemRounded,
            ),
        [data, noSingletonSectionHeader, isLastItemRounded, isEmptySectionPlaceholderDefined],
    );

    return {
        data: internalData,
        sectionsCount,
        itemsCount,
        keyExtractor: (item: ListInternalItemShape<T, U>) =>
            internalKeyExtractor(item, keyExtractor),
        renderItem: ({ item }: { item: ListInternalItemShape<T, U> }) =>
            renderInternalItem(
                item,
                renderItem,
                renderSectionHeader,
                SectionEmptyComponent,
                applyStyle,
                itemStyle,
            ),
    };
};
