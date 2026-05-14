import { useEffect, useMemo, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectDiscoverySupportedNetworks } from '@suite-native/discovery';
import { type FilterItem, FilterTabs } from '@suite-native/trading-atoms';

type TradeableAssetsFilterTabsProps = {
    visible: boolean;
    animationDuration: number;
    onSelectedNetworkFilter: (symbol: NetworkSymbol | undefined) => void;
};

export const TradeableAssetFilterTabs = ({
    visible,
    animationDuration,
    onSelectedNetworkFilter,
}: TradeableAssetsFilterTabsProps) => {
    const networks = useSelector(selectDiscoverySupportedNetworks);

    const [selectedValue, setSelectedValue] = useState<NetworkSymbol | undefined>(undefined);

    const onFilterChange = (value: NetworkSymbol | undefined) => {
        setSelectedValue(value);
        onSelectedNetworkFilter(value);
    };

    // Clear network filter on unmounting filter tabs
    useEffect(() => () => onSelectedNetworkFilter(undefined), [onSelectedNetworkFilter]);

    const filterItems: FilterItem<NetworkSymbol | undefined>[] = useMemo(
        () => [
            { label: 'All', value: undefined },
            ...networks.map(n => ({ label: n.name, value: n.symbol })),
        ],
        [networks],
    );

    const keyExtractor = (item: FilterItem<NetworkSymbol | undefined>) => item.value ?? 'undefined';

    if (!visible) {
        return null;
    }

    return (
        <Animated.View
            entering={FadeIn.duration(animationDuration)}
            exiting={FadeOut.duration(animationDuration)}
        >
            <FilterTabs
                items={filterItems}
                onChange={onFilterChange}
                keyExtractor={keyExtractor}
                value={selectedValue}
            />
        </Animated.View>
    );
};
