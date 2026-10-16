import { useSelector } from 'react-redux';

import { Box, Divider, Text, VStack } from '@suite-native/atoms';
import { PromoBanners, selectHasVisiblePromoBanners } from '@suite-native/banners';
import { Translation } from '@suite-native/intl';

import { HomescreenAlerts } from '../HomescreenAlerts';
import { PortfolioActionButtons } from './PortfolioActionButtons';
import { PortfolioBalance } from './PortfolioBalance';

export const PortfolioAssetsHeader = () => {
    const hasPromoBanners = useSelector(selectHasVisiblePromoBanners);

    return (
        <VStack spacing={0} testID="@home/portfolio-assets/header">
            <VStack paddingHorizontal="sp20" paddingVertical="sp24" spacing="sp8">
                <Text variant="body-xs" color="contentSecondary">
                    <Translation id="moduleHome.totalBalance" />
                </Text>

                <PortfolioBalance />
            </VStack>

            <Divider />
            {/* `gap` skips children rendering nothing, so the spacing holds with or without banners. */}
            <VStack paddingVertical="sp20" spacing="sp20">
                <HomescreenAlerts />
                {hasPromoBanners && (
                    // Offsets the negative vertical margin `PromoBanners` applies to itself.
                    <Box paddingHorizontal="sp16" paddingVertical="sp8">
                        <PromoBanners />
                    </Box>
                )}
                <PortfolioActionButtons />
            </VStack>
            <Divider />
        </VStack>
    );
};
