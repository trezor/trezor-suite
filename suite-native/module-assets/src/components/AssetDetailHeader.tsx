import { Divider, VStack } from '@suite-native/atoms';

import { AssetDetailBalance } from './AssetDetailBalance';
import { AssetDetailPriceSection } from './AssetDetailPriceSection';

export const AssetDetailHeader = () => (
    <VStack spacing={0}>
        <AssetDetailPriceSection />
        <Divider />
        <AssetDetailBalance />
    </VStack>
);
