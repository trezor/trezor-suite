import React, { useCallback } from 'react';
import { NativeModules } from 'react-native';

import { isDevelopOrDebugEnv } from '@suite-native/config';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import {
    Screen,
    StackProps,
    DevUtilsStackParamList,
    DevUtilsStackRoutes,
} from '@suite-native/navigation';
import { useStoragePersistor } from '@suite-native/storage';

export const DevUtilsScreen = ({
    navigation,
}: StackProps<DevUtilsStackParamList, DevUtilsStackRoutes.DevUtils>) => {
    const persistor = useStoragePersistor();

    const handleResetStorage = useCallback(() => {
        persistor.purge().then(() => NativeModules.DevSettings.reload());
    }, [persistor]);

    return (
        <Screen>
            {isDevelopOrDebugEnv() ? (
                <Box marginBottom="large">
                    <Box
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        marginBottom="large"
                    >
                        <Box>
                            <Text variant="titleMedium">DEV utils</Text>
                            <Text color="gray600" variant="hint">
                                This section is shown only in local and develop builds! (Not in
                                staging and production environments)
                            </Text>
                        </Box>
                    </Box>
                    <VStack spacing="medium">
                        <Button onPress={() => navigation.navigate(DevUtilsStackRoutes.Demo)}>
                            See Component Demo
                        </Button>
                        <Button colorScheme="primary" onPress={handleResetStorage}>
                            Reset storage
                        </Button>
                    </VStack>
                </Box>
            ) : null}
        </Screen>
    );
};
