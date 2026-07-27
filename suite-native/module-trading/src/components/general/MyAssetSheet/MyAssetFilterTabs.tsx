import { useEffect, useMemo, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { useTranslate } from '@suite-native/intl';
import { type FilterItem, FilterTabs } from '@suite-native/trading-atoms';

type MyAssetFilterTabsProps = {
    isVisible: boolean;
    animationDuration: number;
    onSelectedNetworkFilter: (symbol: NetworkSymbol | undefined) => void;
    availableNetworks: NetworkSymbol[];
};

const keyExtractor = (item: FilterItem<NetworkSymbol | undefined>) => item.value ?? 'undefined';

const MyAssetFilterTabsContent = ({
    animationDuration,
    onSelectedNetworkFilter,
    availableNetworks,
}: Omit<MyAssetFilterTabsProps, 'isVisible'>) => {
    const [selectedValue, setSelectedValue] = useState<NetworkSymbol | undefined>(undefined);

    const { translate } = useTranslate();

    const onFilterChange = (value: NetworkSymbol | undefined) => {
        setSelectedValue(value);
        onSelectedNetworkFilter(value);
    };

    useEffect(() => () => onSelectedNetworkFilter(undefined), [onSelectedNetworkFilter]);

    const filterItems: FilterItem<NetworkSymbol | undefined>[] = useMemo(
        () => [
            {
                label: translate('moduleTrading.tradeableAssetsSheet.allFilterTabTitle'),
                value: undefined,
            },
            ...availableNetworks.map(symbol => ({
                label: getNetwork(symbol).name,
                value: symbol,
            })),
        ],
        [availableNetworks, translate],
    );

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

export const MyAssetFilterTabs = ({ isVisible, ...rest }: MyAssetFilterTabsProps) => {
    if (!isVisible) {
        return null;
    }

    return <MyAssetFilterTabsContent {...rest} />;
};
