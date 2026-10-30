import { Divider, VStack } from '@suite-native/atoms';

import { AssetDetailBalanceSection } from './AssetDetailBalanceSection';
import { AssetDetailEarnSection } from './AssetDetailEarnSection';
import { AssetDetailPriceSection } from './AssetDetailPriceSection';

export const AssetDetailHeader = () => (
    <VStack spacing="sp20">
        <AssetDetailPriceSection />
        <Divider />
        <AssetDetailBalanceSection />
        <AssetDetailEarnSection />
    </VStack>
);
