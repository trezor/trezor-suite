import { Box, Divider, VStack } from '@suite-native/atoms';

import { NoNetworksConfigured } from '../NoNetworksConfigured';
import { PortfolioAssetsTotalBalance } from './PortfolioAssetsTotalBalance';

export const PortfolioAssetsNoNetworksConfigured = () => (
    <VStack flex={1} spacing="sp16">
        <VStack spacing={0} paddingTop="sp8">
            <PortfolioAssetsTotalBalance />
            <Divider />
        </VStack>
        <Box flex={1} paddingHorizontal="sp16">
            <NoNetworksConfigured />
        </Box>
    </VStack>
);
