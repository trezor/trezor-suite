import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { selectDeviceNetworkSymbolsWithAssets, selectIsAssetListLoading } from '../assetsSelectors';
import { AssetItem } from './AssetItem';

export const AssetList = () => {
    const isAssetListLoading = useSelector(selectIsAssetListLoading);
    const deviceNetworkSymbols = useSelector(selectDeviceNetworkSymbolsWithAssets);

    return (
        <>
            {deviceNetworkSymbols.map(symbol => (
                <Animated.View
                    entering={isAssetListLoading ? FadeInDown : undefined}
                    layout={LinearTransition}
                    key={symbol}
                >
                    <AssetItem cryptoCurrencySymbol={symbol} />
                </Animated.View>
            ))}
        </>
    );
};
