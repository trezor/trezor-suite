import { type ReactElement, type ReactNode, useMemo } from 'react';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedBox, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
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
    | {
          type: 'sectionHeader';
          title: ReactNode;
          key: string;
          sectionData: U;
      }
    | {
          type: 'item';
          item: T;
          config: ItemRenderConfig<U>;
      }
    | {
          type: 'emptySection';
          key: string;
          config: ItemRenderConfig<U>;
      };

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

type TransformToInternalFlatListDataProps<T, U> = {
    inputData: SectionListData<T, U>;
    noSingletonSectionHeader: boolean | undefined;
    withEmptySectionPlaceholder: boolean;
    isLastItemRounded: boolean;
};

type RenderInternalItemProps<T, U> = {
    item: ListInternalItemShape<T, U>;
    renderItem: (item: T, config: ItemRenderConfig<U>) => ReactElement;
    renderSectionHeader:
        | ((label: ReactNode, config: SectionHeaderRenderConfig<U>) => ReactElement)
        | undefined;
    SectionEmptyComponent: ReactElement | undefined;
    applyStyle: ReturnType<typeof useNativeStyles>['applyStyle'];
    itemStyle?: ReturnType<typeof prepareNativeStyle<ItemRenderConfig<unknown>>>;
};

const defaultItemStyle = prepareNativeStyle<ItemRenderConfig<unknown>>(
    ({ colors, spacings, borders }, { isFirst, isLast, isEnabled }) => ({
        backgroundColor: colors.surfaceFillRaised,
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
                    backgroundColor: colors.surfaceFillPage,
                },
            },
        ],
    }),
);

const transformToInternalFlatListData = <T, U = undefined>({
    inputData,
    noSingletonSectionHeader,
    withEmptySectionPlaceholder,
    isLastItemRounded,
}: TransformToInternalFlatListDataProps<T, U>): ListInternalItemShape<T, U>[] =>
    inputData.reduce(
        (acc, { key, label, data, sectionData }) => {
            const itemsData = data.map(
                (item, index): ListInternalItemShape<T, U> => ({
                    type: 'item',
                    item,
                    config: {
                        isFirst: index === 0,
                        isLast: index === data.length - 1 && isLastItemRounded,
                        sectionData,
                        isEnabled: item.isEnabled !== undefined ? item.isEnabled : true,
                    },
                }),
            );

            if (!noSingletonSectionHeader || inputData.length > 1) {
                acc.push({
                    type: 'sectionHeader',
                    title: label,
                    key,
                    sectionData,
                });

                if (withEmptySectionPlaceholder && itemsData.length === 0) {
                    acc.push({
                        type: 'emptySection',
                        key: key + '-empty-section',
                        config: {
                            isFirst: true,
                            isLast: true,
                            sectionData,
                            isEnabled: false,
                        },
                    });
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
    const { type } = item;
    switch (type) {
        case 'sectionHeader':
            return item.key;

        case 'item':
            return itemKeyExtractor(item.item, item.config.sectionData);

        case 'emptySection':
            return item.key;

        default:
            return exhaustive(type);
    }
};

const renderInternalItem = <T, U>({
    item,
    renderItem,
    renderSectionHeader,
    SectionEmptyComponent,
    applyStyle,
    itemStyle,
}: RenderInternalItemProps<T, U>): ReactElement => {
    const { type } = item;

    switch (type) {
        case 'sectionHeader': {
            const { key, sectionData, title } = item;

            return (
                <AnimatedBox
                    paddingVertical={renderSectionHeader ? undefined : 'sp12'}
                    entering={FadeIn}
                    exiting={FadeOut}
                >
                    {renderSectionHeader ? (
                        renderSectionHeader(title, { sectionData, key })
                    ) : (
                        <Text variant="body-sm" color="contentSecondary">
                            {item.title}
                        </Text>
                    )}
                </AnimatedBox>
            );
        }

        case 'item':
            return (
                <AnimatedBox
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={applyStyle(itemStyle ?? defaultItemStyle, item.config)}
                >
                    {renderItem(item.item, item.config)}
                </AnimatedBox>
            );

        case 'emptySection':
            return (
                <AnimatedBox
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={applyStyle(itemStyle ?? defaultItemStyle, item.config)}
                >
                    {SectionEmptyComponent}
                </AnimatedBox>
            );

        default:
            return exhaustive(type);
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
            transformToInternalFlatListData<T, U>({
                inputData: data,
                withEmptySectionPlaceholder: isEmptySectionPlaceholderDefined,
                noSingletonSectionHeader,
                isLastItemRounded,
            }),
        [data, noSingletonSectionHeader, isLastItemRounded, isEmptySectionPlaceholderDefined],
    );

    return {
        data: internalData,
        sectionsCount,
        itemsCount,
        keyExtractor: (item: ListInternalItemShape<T, U>) =>
            internalKeyExtractor(item, keyExtractor),
        renderItem: ({ item }: { item: ListInternalItemShape<T, U> }) =>
            renderInternalItem({
                item,
                renderItem,
                renderSectionHeader,
                SectionEmptyComponent,
                applyStyle,
                itemStyle,
            }),
    };
};
