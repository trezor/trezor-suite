import { Divider, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { PortfolioActionButtons } from './PortfolioActionButtons';
import { PortfolioBalance } from './PortfolioBalance';

export const PortfolioAssetsHeader = () => (
    <VStack testID="@home/portfolio-assets/header">
        <VStack paddingHorizontal="sp20" paddingVertical="sp24" spacing="sp8">
            <Text variant="body-xs" color="contentSecondary">
                <Translation id="moduleHome.totalBalance" />
            </Text>

            <PortfolioBalance />
        </VStack>

        <Divider />
        <PortfolioActionButtons />
        <Divider />
    </VStack>
);
