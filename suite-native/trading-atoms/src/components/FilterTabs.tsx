import { useMemo } from 'react';
import { FlatList } from 'react-native-gesture-handler';

import { Button } from '@suite-native/atoms';

export type FilterItem<T = any> = {
    label: string;
    value: T;
};

type FilterTabProps = {
    children: React.ReactNode;
    active: boolean;
    onPress: () => void;
};

export type FilterTabsProps<T = any> = {
    items: FilterItem<T>[];
    onChange: (value: T) => void;
    value?: T;
    keyExtractor?: (item: FilterItem<T>) => string;
};

const FilterTab = ({ active, onPress, children }: FilterTabProps) => (
    <Button
        intent="neutral"
        priority={active ? 'primary' : 'secondary'}
        size="medium"
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
    >
        {children}
    </Button>
);

export const FilterTabs = <T,>({
    items,
    onChange,
    value,
    keyExtractor = (item: FilterItem<T>) => String(item.value),
}: FilterTabsProps<T>) => {
    const defaultKeyExtractor = useMemo(
        () => (item: FilterItem<T>) => keyExtractor(item),
        [keyExtractor],
    );

    const renderFilterTab = ({ item }: { item: FilterItem<T> }) => (
        <FilterTab active={value === item.value} onPress={() => onChange(item.value)}>
            {item.label}
        </FilterTab>
    );

    return (
        <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={items}
            keyExtractor={defaultKeyExtractor}
            accessible={true}
            accessibilityRole="tablist"
            renderItem={renderFilterTab}
            keyboardShouldPersistTaps="always"
        />
    );
};
