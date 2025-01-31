import { useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Button } from '@suite-native/atoms';

type FilterTabProps = {
    children: React.ReactNode;
    active: boolean;
    onPress: () => void;
};

type TradeableAssetsFilterTabsProps = {
    visible: boolean;
    animationDuration: number;
};

const mockTabNames = [
    'All',
    'Ethereum',
    'Solana',
    'Base',
    'Ethereum 2',
    'Solana 2',
    'Base 2',
    'Ethereum 3',
    'Solana 3',
    'Base 3',
];

const FilterTab = ({ active, onPress, children }: FilterTabProps) => {
    const colorScheme = active ? 'tertiaryElevation0' : 'backgroundSurfaceElevation0';

    return (
        <Button
            colorScheme={colorScheme}
            size="small"
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
        >
            {children}
        </Button>
    );
};

export const TradeableAssetsFilterTabs = ({
    visible,
    animationDuration,
}: TradeableAssetsFilterTabsProps) => {
    const [activeTab, setActiveTab] = useState(mockTabNames[0]);

    if (!visible) {
        return null;
    }

    return (
        <Animated.FlatList
            entering={FadeIn.duration(animationDuration)}
            exiting={FadeOut.duration(animationDuration)}
            horizontal
            showsHorizontalScrollIndicator={false}
            data={mockTabNames}
            keyExtractor={item => item}
            accessible={true}
            accessibilityRole="tablist"
            renderItem={({ item }) => (
                <FilterTab active={activeTab === item} onPress={() => setActiveTab(item)}>
                    {item}
                </FilterTab>
            )}
        />
    );
};
