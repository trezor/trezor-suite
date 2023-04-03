import React from 'react';

import { isDebugEnv, isDevelopOrDebugEnv } from '@suite-native/config';
import { Box, Button, VStack } from '@suite-native/atoms';
import {
    Screen,
    StackProps,
    DevUtilsStackParamList,
    DevUtilsStackRoutes,
    ScreenHeader,
} from '@suite-native/navigation';
import { purgeStorage, useStoragePersistor } from '@suite-native/storage';

import { BuildInfo } from '../components/BuildInfo';
import { Logs } from '../components/Logs';
import { RenderingUtils } from '../components/RenderingUtils';
import { ProductionDevInfo } from '../components/ProductionDevInfo';

export const DevUtilsScreen = ({
    navigation,
}: StackProps<DevUtilsStackParamList, DevUtilsStackRoutes.DevUtils>) => {
    const persistor = useStoragePersistor();

    const handleResetStorage = async () => {
        await purgeStorage(persistor);
    };

    return (
        <Screen header={<ScreenHeader title="DEV utils" hasGoBackIcon />}>
            {isDevelopOrDebugEnv() ? (
                <Box marginBottom="large">
                    <VStack spacing="medium">
                        {!isDebugEnv() && <BuildInfo />}
                        <RenderingUtils />
                        <Button onPress={() => navigation.navigate(DevUtilsStackRoutes.Demo)}>
                            See Component Demo
                        </Button>
                        <Button colorScheme="primary" onPress={handleResetStorage}>
                            Reset storage
                        </Button>
                        <Logs />
                    </VStack>
                </Box>
            ) : (
                <ProductionDevInfo />
            )}
        </Screen>
    );
};
