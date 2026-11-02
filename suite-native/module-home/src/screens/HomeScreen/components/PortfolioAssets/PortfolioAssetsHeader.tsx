import { Divider, Text, VStack } from '@suite-native/atoms';
import { PromoBanners } from '@suite-native/banners';
import { Translation } from '@suite-native/intl';

import { HomescreenAlerts } from '../HomescreenAlerts';
import { PortfolioActionButtons } from './PortfolioActionButtons';
import { PortfolioBalance } from './PortfolioBalance';

export const PortfolioAssetsHeader = () => (
    <VStack spacing={0} testID="@home/portfolio-assets/header">
        <VStack paddingHorizontal="sp20" paddingVertical="sp24" spacing="sp8">
            <Text variant="body-xs" color="contentSecondary">
                <Translation id="moduleHome.totalBalance" />
            </Text>

            <PortfolioBalance />
        </VStack>

        <Divider />
        <VStack paddingTop="sp20" spacing="sp20">
            <HomescreenAlerts />
            <PromoBanners hasNegativeVerticalMargin={false} hasHorizontalMargin />
            <PortfolioActionButtons />
        </VStack>
    </VStack>
);
