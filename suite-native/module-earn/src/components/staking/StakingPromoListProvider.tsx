import { HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

export const StakingPromoListProvider = () => (
    <VStack alignItems="center">
        <HStack alignItems="center" spacing="sp8">
            <Icon name="info" size="medium" color="contentSecondary" />
            <Text variant="body-sm" color="contentSecondary">
                <Translation id="earn.stakingOperatedByProviders" />
            </Text>
        </HStack>
    </VStack>
);
