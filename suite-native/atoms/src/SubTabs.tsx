import { type ReactNode, useEffect, useRef } from 'react';
import { FlatList } from 'react-native-gesture-handler';

import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color, type NativeTypographyStyle } from '@trezor/theme';

import { PressableOpacity } from './Pressable';
import { Text } from './Text';

export const SUB_TABS_SIZES = ['normal', 'large'] as const;
export type SubTabsSize = (typeof SUB_TABS_SIZES)[number];

export type SubTabItem<TValue> = {
    label: ReactNode;
    value: TValue;
    icon?: IconName;
    testID?: string;
};

export type SubTabsProps<TValue> = {
    items: SubTabItem<TValue>[];
    onChange: (value: TValue) => void;
    value?: TValue;
    size?: SubTabsSize;
    keyExtractor?: (item: SubTabItem<TValue>) => string;
    testID?: string;
};

type SubTabProps = {
    isActive: boolean;
    item: SubTabItem<unknown>;
    onPress: () => void;
    size: SubTabsSize;
};

type SubTabStyleProps = {
    isActive: boolean;
    size: SubTabsSize;
};

const typographyBySize = {
    normal: 'body-sm',
    large: 'body-md',
} as const satisfies Record<SubTabsSize, NativeTypographyStyle>;

const iconSizeBySize = {
    normal: 20,
    large: 24,
} as const satisfies Record<SubTabsSize, number>;

const tabsStyle = prepareNativeStyle(({ spacings }) => ({
    gap: spacings.sp12,
    paddingHorizontal: spacings.sp16,
}));

const tabStyle = prepareNativeStyle<SubTabStyleProps>((utils, { isActive, size }) => ({
    alignItems: 'center',
    backgroundColor: utils.colors.elementFillElevated,
    borderRadius: utils.borders.radii.round,
    flexDirection: 'row',
    gap: utils.spacings.sp8,
    justifyContent: 'center',
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp8,
    ...utils.boxShadows.small,
    extend: [
        {
            condition: !isActive,
            style: {
                backgroundColor: 'transparent',
                ...utils.boxShadows.none,
            },
        },
        {
            condition: size === 'normal',
            style: {
                borderBottomColor: 'transparent',
                borderBottomWidth: utils.borders.widths.large,
                height: utils.spacings.sp36,
            },
        },
        {
            condition: size === 'large',
            style: {
                height: utils.spacings.sp40,
            },
        },
    ],
}));

const SubTab = ({ isActive, item, onPress, size }: SubTabProps) => {
    const { applyStyle } = useNativeStyles();
    const contentColor: Color = isActive ? 'contentPrimary' : 'contentSecondary';

    return (
        <PressableOpacity
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={onPress}
            style={applyStyle(tabStyle, { isActive, size })}
            testID={item.testID}
        >
            {!!item.icon && (
                <Icon
                    color={contentColor}
                    name={item.icon}
                    size={iconSizeBySize[size]}
                    testID={item.testID ? `${item.testID}/icon` : undefined}
                />
            )}
            <Text
                color={contentColor}
                numberOfLines={1}
                testID={item.testID ? `${item.testID}/text` : undefined}
                variant={typographyBySize[size]}
            >
                {item.label}
            </Text>
        </PressableOpacity>
    );
};

export const SubTabs = <TValue,>({
    items,
    keyExtractor = item => String(item.value),
    onChange,
    size = 'normal',
    testID,
    value,
}: SubTabsProps<TValue>) => {
    const listRef = useRef<FlatList>(null);
    const { applyStyle } = useNativeStyles();

    const activeTabIndex = items.findIndex(item => item.value === value);

    useEffect(() => {
        if (activeTabIndex < 0) {
            return;
        }

        listRef.current?.scrollToIndex({
            index: activeTabIndex,
            animated: true,
            viewPosition: 0.5,
        });
    }, [activeTabIndex]);

    return (
        <FlatList
            ref={listRef}
            accessibilityRole="tablist"
            accessible={true}
            contentContainerStyle={applyStyle(tabsStyle)}
            data={items}
            extraData={{ size, value }}
            horizontal={true}
            keyExtractor={keyExtractor}
            onScrollToIndexFailed={({ index, averageItemLength }) => {
                listRef.current?.scrollToOffset({
                    offset: averageItemLength * index,
                });
            }}
            renderItem={({ item }) => (
                <SubTab
                    isActive={item.value === value}
                    item={item}
                    onPress={() => onChange(item.value)}
                    size={size}
                />
            )}
            showsHorizontalScrollIndicator={false}
            testID={testID}
        />
    );
};
