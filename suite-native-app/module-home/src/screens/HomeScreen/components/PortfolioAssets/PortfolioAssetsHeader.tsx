import { Divider, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { HomescreenAlerts } from '../HomescreenAlerts';
import { PortfolioActionButtons } from './PortfolioActionButtons';
import { PortfolioBalance } from './PortfolioBalance';
import { PortfolioPromoBanners } from './PortfolioPromoBanners';

export const PortfolioAssetsHeader = () => (
    <VStack spacing={0} testID="@home/portfolio-assets/header">
        <VStack paddingTop="sp8" spacing="sp8">
            <HomescreenAlerts />
            <VStack paddingHorizontal="sp20" paddingTop="sp16" paddingBottom="sp24" spacing="sp8">
                <Text variant="body-xs" color="contentSecondary">
                    <Translation id="moduleHome.totalBalance" />
                </Text>

                <PortfolioBalance />
            </VStack>
        </VStack>

        <Divider />
        <PortfolioActionButtons />
        <PortfolioPromoBanners />
    </VStack>
);
