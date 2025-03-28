import { ReactElement, ReactNode, useMemo } from 'react';
import { FadeInLeft, FadeInUp, FadeOutRight, FadeOutUp } from 'react-native-reanimated';

import { UnreachableCaseError } from '@suite-common/suite-utils';
import { AnimatedBox, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type ItemRenderConfig<U> = {
    isFirst?: boolean;
    isLast?: boolean;
    sectionData: U;
};

export type SectionListData<T, U = undefined> = {
    key: string;
    label: ReactNode;
    sectionData: U;
    data: T[];
}[];

export type ListInternalItemShape<T, U> =
    // [type, text, key]
    | ['sectionHeader', ReactNode, string]
    // [type, data, config]
    | ['item', T, ItemRenderConfig<U>];

type UseSectionListProps<T, U> = {
    data: SectionListData<T, U>;
    renderItem: (item: T, config: ItemRenderConfig<U>) => ReactElement;
    keyExtractor: (item: T, sectionData: U) => string;
    noSingletonSectionHeader: boolean | undefined;
    isLastItemRounded?: boolean;
};

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
                    },
                ],
            );

            if (!noSingletonSectionHeader || inputData.length > 1) {
                acc.push(['sectionHeader', label, key]);
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
                <AnimatedBox paddingVertical="sp12" entering={FadeInUp} exiting={FadeOutUp}>
                    <Text variant="hint" color="textSubdued">
                        {item[1]}
                    </Text>
                </AnimatedBox>
            );

        case 'item':
            return (
                <AnimatedBox
                    entering={FadeInLeft}
                    exiting={FadeOutRight}
                    style={applyStyle(itemStyle, item[2])}
                >
                    {renderItem(item[1], item[2])}
                </AnimatedBox>
            );

        default:
            throw new UnreachableCaseError(item[0]);
    }
};

export const useSectionList = <T, U = undefined>({
    data,
    renderItem,
    keyExtractor,
    noSingletonSectionHeader,
    isLastItemRounded = true,
}: UseSectionListProps<T, U>) => {
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

    const internalData = useMemo(
        () =>
            transformToInternalFlatListData<T, U>(
                data,
                noSingletonSectionHeader,
                isLastItemRounded,
            ),
        [data, noSingletonSectionHeader, isLastItemRounded],
    );

    return {
        data: internalData,
        sectionsCount,
        itemsCount,
        keyExtractor: (item: ListInternalItemShape<T, U>) =>
            internalKeyExtractor(item, keyExtractor),
        renderItem: ({ item }: { item: ListInternalItemShape<T, U> }) =>
            renderInternalItem(item, renderItem, applyStyle),
    };
};
