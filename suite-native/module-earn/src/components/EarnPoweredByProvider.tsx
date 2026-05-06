import React from 'react';

import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

export const EarnPoweredByProvider = React.memo(() => (
    <Box alignItems="center" marginBottom="sp24">
        <HStack alignItems="center" spacing="sp8">
            <Text color="contentSecondary">
                <Translation id="earn.poweredBy" />
            </Text>
            <HStack alignItems="center" spacing="sp4">
                <Icon name="everstakeLogo" size="mediumLarge" color="contentPrimary" />
                <Text variant="body-md-strong">everstake</Text>
            </HStack>
        </HStack>
    </Box>
));
