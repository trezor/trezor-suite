import React from 'react';

import { Icon } from '@trezor/icons';
import { Box } from '@suite-native/atoms';

import { DashboardHeaderDeviceChip } from './DashboardHeaderDeviceChip';

export const DashboardHeader = () => (
    <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        style={{ width: '100%' }}
    >
        <DashboardHeaderDeviceChip />
        <Box flexDirection="row">
            <Box marginRight="medium">
                <Icon name="eyeSlash" />
            </Box>
            <Icon name="notifications" />
        </Box>
    </Box>
);
