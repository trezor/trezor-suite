import React from 'react';
import { Alert } from 'react-native';

import * as Sentry from '@sentry/react-native';

import { isDebugEnv, isDevelopOrDebugEnv } from '@suite-native/config';
import { Box, Button, VStack } from '@suite-native/atoms';
import {
    Screen,
    StackProps,
    DevUtilsStackParamList,
    DevUtilsStackRoutes,
    ScreenHeader,
} from '@suite-native/navigation';
import { clearStorage } from '@suite-native/storage';

import { BuildInfo } from '../components/BuildInfo';
import { RenderingUtils } from '../components/RenderingUtils';
import { ProductionDevInfo, SentryTestErrorButton } from '../components/ProductionDevInfo';
import { CopyLogsButton } from '../components/CopyLogsButton';

export const DevUtilsScreen = ({
    navigation,
}: StackProps<DevUtilsStackParamList, DevUtilsStackRoutes.DevUtils>) => (
    <Screen header={<ScreenHeader content="DEV utils" hasGoBackIcon />}>
        {isDevelopOrDebugEnv() ? (
            <Box marginBottom="large">
                <VStack spacing="medium">
                    {!isDebugEnv() && <BuildInfo />}
                    <RenderingUtils />
                    <Button onPress={() => navigation.navigate(DevUtilsStackRoutes.Demo)}>
                        See Component Demo
                    </Button>
                    <Button onPress={clearStorage}>Reset storage</Button>
                    <SentryTestErrorButton />
                    <CopyLogsButton />
                </VStack>
            </Box>
        ) : (
            <ProductionDevInfo />
        )}
    </Screen>
);
