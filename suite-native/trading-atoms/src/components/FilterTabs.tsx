import { useEffect, useMemo, useRef } from 'react';
import { FlatList } from 'react-native-gesture-handler';

import { Button } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { noop } from '@trezor/utils';

export type FilterItem<T = any> = {
    label: string;
    value: T;
};

type FilterTabProps = {
    children: React.ReactNode;
    active: boolean;
    onPress: () => void;
    testID?: string;
};

export type FilterTabsProps<T = any> = {
    items: FilterItem<T>[];
    onChange: (value: T) => void;
    value?: T;
    keyExtractor?: (item: FilterItem<T>) => string;
    testID?: string;
};

const tabsStyle = prepareNativeStyle(({ spacings }) => ({
    gap: spacings.sp12,
}));

const FilterTab = ({ active, onPress, children, testID }: FilterTabProps) => (
    <Button
        intent="neutral"
        priority={active ? 'primary' : 'secondary'}
        size="medium"
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        testID={testID}
    >
        {children}
    </Button>
);

export const FilterTabs = <T,>({
    items,
    onChange,
    value,
    keyExtractor = (item: FilterItem<T>) => String(item.value),
    testID,
}: FilterTabsProps<T>) => {
    const listRef = useRef<FlatList>(null);
    const { applyStyle } = useNativeStyles();

    const defaultKeyExtractor = useMemo(
        () => (item: FilterItem<T>) => keyExtractor(item),
        [keyExtractor],
    );

    const activeTabIndex = useMemo(
        () => items.findIndex(item => item.value === value),
        [items, value],
    );

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

    const renderFilterTab = ({ item }: { item: FilterItem<T> }) => (
        <FilterTab
            active={value === item.value}
            onPress={() => onChange(item.value)}
            testID={`${testID}filter-tab/${item.label}`}
        >
            {item.label}
        </FilterTab>
    );

    return (
        <FlatList
            ref={listRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            accessible={true}
            contentContainerStyle={applyStyle(tabsStyle)}
            data={items}
            keyExtractor={defaultKeyExtractor}
            accessibilityRole="tablist"
            renderItem={renderFilterTab}
            keyboardShouldPersistTaps="always"
            onScrollToIndexFailed={noop}
        />
    );
};
