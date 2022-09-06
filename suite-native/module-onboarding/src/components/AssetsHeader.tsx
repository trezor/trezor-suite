import React from 'react';

import { Icon } from '@trezor/icons';
import { Box, Text } from '@suite-native/atoms';

export const AssetsHeader = () => (
    <Box flexDirection="row" justifyContent="space-between">
        <Text variant="titleMedium" color="gray1000">
            Import assets
        </Text>
        <Icon name="close" />
    </Box>
);
