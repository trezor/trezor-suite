import { Divider, VStack } from '@suite-native/atoms';

import { HomescreenAlerts } from '../HomescreenAlerts';
import { PortfolioActionButtons } from './PortfolioActionButtons';
import { PortfolioAssetsTotalBalance } from './PortfolioAssetsTotalBalance';
import { PortfolioPromoBanners } from './PortfolioPromoBanners';

export const PortfolioAssetsHeader = () => (
    <VStack spacing={0} testID="@home/portfolio-assets/header">
        <VStack paddingTop="sp8" spacing="sp8">
            <HomescreenAlerts />
            <PortfolioAssetsTotalBalance />
        </VStack>

        <Divider />
        <PortfolioActionButtons />
        <PortfolioPromoBanners />
    </VStack>
);
