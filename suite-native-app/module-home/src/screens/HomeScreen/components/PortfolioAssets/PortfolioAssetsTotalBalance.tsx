import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { PortfolioBalance } from './PortfolioBalance';

export const PortfolioAssetsTotalBalance = () => (
    <VStack paddingHorizontal="sp20" paddingTop="sp16" paddingBottom="sp24" spacing="sp8">
        <Text variant="body-xs" color="contentSecondary">
            <Translation id="moduleHome.totalBalance" />
        </Text>

        <PortfolioBalance />
    </VStack>
);
