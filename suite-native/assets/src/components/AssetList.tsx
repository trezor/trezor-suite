import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { getSupportedNetworks } from '@suite-common/wallet-config';

import { selectDeviceNetworkSymbolsWithAssets, selectIsAssetListLoading } from '../assetsSelectors';
import { type AssetsRootState } from '../types';
import { AssetItem } from './AssetItem';

export const AssetList = () => {
    const allNetworkSymbols = getSupportedNetworks();

    const isAssetListLoading = useSelector(selectIsAssetListLoading);
    const deviceNetworkSymbols = useSelector((state: AssetsRootState) =>
        selectDeviceNetworkSymbolsWithAssets(state, allNetworkSymbols),
    );

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
