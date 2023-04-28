import React from 'react';
import { Alert } from 'react-native';

import * as Sentry from '@sentry/react-native';

import { isDebugEnv, isDevelopOrDebugEnv } from '@suite-native/config';
import { Box, Button, Card, VStack } from '@suite-native/atoms';
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
import { CopyLogsButton } from '../components/CopyLogsButton';

export const DevUtilsScreen = ({
    navigation,
}: StackProps<DevUtilsStackParamList, DevUtilsStackRoutes.DevUtils>) => (
    <Screen header={<ScreenHeader content="DEV utils" hasGoBackIcon />}>
        <Card>
            <VStack spacing="medium">
                {!isDebugEnv() && <BuildInfo />}
                {isDebugEnv() && (
                    <>
                        <Button onPress={() => navigation.navigate(DevUtilsStackRoutes.Demo)}>
                            See Component Demo
                        </Button>
                        <RenderingUtils />
                    </>
                )}
                <Button
                    onPress={() => {
                        const errorMessage = `Sentry test error - ${Date.now()}`;
                        Sentry.captureException(new Error(errorMessage));
                        Alert.alert('Sentry error thrown', errorMessage);
                    }}
                >
                    Throw Sentry error
                </Button>
                <CopyLogsButton />
                <Button colorScheme="dangerElevation0" onPress={clearStorage}>
                    Reset storage
                </Button>
            </VStack>
        </Card>
    </Screen>
);
