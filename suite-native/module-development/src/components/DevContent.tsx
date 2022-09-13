import React from 'react';
import { NativeModules } from 'react-native';

import { useNavigation } from '@react-navigation/core';

import { persistor } from '@suite-native/state';
import { isDevelopment } from '@suite-native/config';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import {
    HomeStackParamList,
    HomeStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

export const DevContent = () => {
    const navigation =
        useNavigation<StackNavigationProps<HomeStackParamList, HomeStackRoutes.Home>>();

    const handleResetStorage = async () => {
        await persistor.purge();
        NativeModules.DevSettings.reload();
    };

    if (isDevelopment()) {
        return (
            <Box marginBottom="large">
                <Box
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    marginBottom="large"
                >
                    <Box>
                        <Text variant="titleMedium">DEV Buttons</Text>
                        <Text color="gray600" variant="hint">
                            This section is shown only in local and develop builds! (Not in staging
                            and production environments)
                        </Text>
                    </Box>
                </Box>
                <VStack spacing="medium">
                    <Button onPress={() => navigation.navigate(HomeStackRoutes.Demo)}>
                        See Component Demo
                    </Button>
                    <Button colorScheme="primary" onPress={handleResetStorage}>
                        Reset storage
                    </Button>
                </VStack>
            </Box>
        );
    }

    return null;
};
