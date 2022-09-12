import React from 'react';

import { Screen } from '@suite-native/navigation';
import { Box, Text } from '@suite-native/atoms';

import { AccountsList } from '../components/AccountsList';

export const AccountsScreen = () => (
    <Screen>
        <Box marginBottom="medium">
            <Text color="gray600">All Accounts</Text>
        </Box>
        <AccountsList />
    </Screen>
);
