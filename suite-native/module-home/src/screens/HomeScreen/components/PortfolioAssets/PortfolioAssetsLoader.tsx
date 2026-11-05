import { HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { PortfolioAssetsSpinner } from './PortfolioAssetsSpinner';

export const PortfolioAssetsLoader = () => (
    <HStack spacing="sp4" alignItems="center" testID="@home/portfolio-assets/show-more/loading">
        <Text variant="body-xs" color="contentTertiary">
            <Translation id="moduleHome.assets.loadingBalances" />
        </Text>
        <PortfolioAssetsSpinner />
    </HStack>
);
