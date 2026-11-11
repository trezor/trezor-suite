import { VStack } from '@suite-native/atoms';

import { AssetDetailBalanceSection } from './AssetDetailBalanceSection';
import { AssetDetailEarnSection } from './AssetDetailEarnSection';
import { AssetDetailHiddenBanner } from './AssetDetailHiddenBanner';
import { AssetDetailPriceSection } from './AssetDetailPriceSection';
import { AssetDetailStakingBanner } from './AssetDetailStakingBanner';
import { AssetDetailYieldBanner } from './AssetDetailYieldBanner';

export const AssetDetailHeader = () => (
    <VStack spacing="sp20">
        <AssetDetailHiddenBanner />
        <AssetDetailPriceSection />
        <AssetDetailBalanceSection />
        <AssetDetailEarnSection />
        <AssetDetailStakingBanner />
        <AssetDetailYieldBanner />
    </VStack>
);
