import React from 'react';

import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

export const EarnStakingProvidersInfo = React.memo(() => (
    <Box alignItems="center" marginBottom="sp24">
        <HStack alignItems="center" spacing="sp8">
            <Icon name="info" size="medium" color="contentSecondary" />
            <Text variant="body-sm" color="contentSecondary">
                <Translation id="earn.stakingOperatedByProviders" />
            </Text>
        </HStack>
    </Box>
));
