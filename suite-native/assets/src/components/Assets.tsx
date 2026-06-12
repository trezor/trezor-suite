import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { selectIsDeviceAuthorized } from '@suite-common/device';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { AnimatedContainerCard } from '@suite-native/atoms';
import { AccountsRediscoveryNeededWarning } from '@suite-native/discovery';
import { FiveBinariesHomeBanner } from '@suite-native/module-earn';

import { selectDeviceNetworkSymbolsWithAssets } from '../assetsSelectors';
import { AssetItem } from './AssetItem';
import { DiscoveryAssetsLoader } from './DiscoveryAssetsLoader';

export const Assets = () => {
    const deviceNetworkSymbols = useSelector(selectDeviceNetworkSymbolsWithAssets);

    const hasDiscovery = useSelector(selectHasRunningDiscovery);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isLoading = hasDiscovery || !isDeviceAuthorized;

    return (
        <>
            <FiveBinariesHomeBanner />
            <AnimatedContainerCard noPadding layout={LinearTransition}>
                <AccountsRediscoveryNeededWarning hasPadding />
                {deviceNetworkSymbols.map(symbol => (
                    <Animated.View
                        entering={isLoading ? FadeInDown : undefined}
                        layout={LinearTransition}
                        key={symbol}
                    >
                        <AssetItem cryptoCurrencySymbol={symbol} />
                    </Animated.View>
                ))}
                {isLoading && (
                    <DiscoveryAssetsLoader isListEmpty={deviceNetworkSymbols.length < 1} />
                )}
            </AnimatedContainerCard>
        </>
    );
};
