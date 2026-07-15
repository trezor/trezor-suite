import { LinearTransition } from 'react-native-reanimated';

import { AnimatedContainerCard } from '@suite-native/atoms';
import { AccountsRediscoveryNeededWarning } from '@suite-native/discovery';
import { FiveBinariesHomeBanner } from '@suite-native/module-earn';

import { AssetList } from './AssetList';
import { DiscoveryAssetsLoader } from './DiscoveryAssetsLoader';

export const Assets = () => (
    <>
        <FiveBinariesHomeBanner />
        <AnimatedContainerCard noPadding layout={LinearTransition}>
            <AccountsRediscoveryNeededWarning hasPadding />
            <AssetList />
            <DiscoveryAssetsLoader />
        </AnimatedContainerCard>
    </>
);
