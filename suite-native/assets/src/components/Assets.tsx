import { LinearTransition } from 'react-native-reanimated';

import { AnimatedContainerCard } from '@suite-native/atoms';
import { AccountsRediscoveryNeededWarning } from '@suite-native/discovery';

import { AssetList } from './AssetList';
import { DiscoveryAssetsLoader } from './DiscoveryAssetsLoader';

export const Assets = () => (
    <AnimatedContainerCard noPadding layout={LinearTransition}>
        <AccountsRediscoveryNeededWarning margin="sp8" />
        <AssetList />
        <DiscoveryAssetsLoader />
    </AnimatedContainerCard>
);
