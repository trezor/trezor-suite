import { useEffect, useMemo, useState } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Button } from '@suite-native/atoms';
import { selectDiscoverySupportedNetworks } from '@suite-native/discovery';

type FilterTabProps = {
    children: React.ReactNode;
    active: boolean;
    onPress: () => void;
};

type TradeableAssetsFilterTabsProps = {
    visible: boolean;
    animationDuration: number;

    onSelectedNetworkFilter: (symbol: NetworkSymbol | undefined) => void;
};

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
    onSelectedNetworkFilter,
}: TradeableAssetsFilterTabsProps) => {
    const networks = useSelector(selectDiscoverySupportedNetworks);
    const [activeTab, setActiveTab] = useState<NetworkSymbol | undefined>(undefined);

    //clear network filter on unmounting filter tabs
    useEffect(() => () => onSelectedNetworkFilter(undefined), [onSelectedNetworkFilter]);

    const filterItems = useMemo(
        () => [
            { label: 'All', symbol: undefined },
            ...networks.map(n => ({ label: n.name, symbol: n.symbol })),
        ],
        [networks],
    );

    if (!visible) {
        return null;
    }

    const handleFilterTap = (symbol: NetworkSymbol | undefined) => {
        setActiveTab(symbol);
        onSelectedNetworkFilter(symbol);
    };

    return (
        <Animated.View
            entering={FadeIn.duration(animationDuration)}
            exiting={FadeOut.duration(animationDuration)}
        >
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={filterItems}
                keyExtractor={item => item.symbol ?? 'undefined'}
                accessible={true}
                accessibilityRole="tablist"
                renderItem={({ item }) => (
                    <FilterTab
                        active={activeTab === item.symbol}
                        onPress={() => handleFilterTap(item.symbol)}
                    >
                        {item.label}
                    </FilterTab>
                )}
                keyboardShouldPersistTaps="always"
            />
        </Animated.View>
    );
};
