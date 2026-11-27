import { Box, VStack } from '@suite-native/atoms';

import { NoNetworksConfigured } from '../NoNetworksConfigured';
import { PortfolioAssetsTotalBalance } from './PortfolioAssetsTotalBalance';

export const PortfolioAssetsNoNetworksConfigured = () => (
    <VStack flex={1} spacing={0} paddingTop="sp8">
        <PortfolioAssetsTotalBalance />
        <Box flex={1} paddingHorizontal="sp16">
            <NoNetworksConfigured />
        </Box>
    </VStack>
);
