import { Alert } from 'react-native';

import * as Sentry from '@sentry/react-native';

import { DeviceManager } from '@suite-native/device-manager';
import { isDebugEnv, isDevelopOrDebugEnv, isProduction } from '@suite-native/config';
import { Button, Card, VStack } from '@suite-native/atoms';
import {
    Screen,
    StackProps,
    DevUtilsStackParamList,
    DevUtilsStackRoutes,
    ScreenSubHeader,
    ScreenHeader,
} from '@suite-native/navigation';
import { clearStorage } from '@suite-native/storage';

import { BuildInfo } from '../components/BuildInfo';
import { RenderingUtils } from '../components/RenderingUtils';
import { CopyLogsButton } from '../components/CopyLogsButton';
import { FeatureFlags } from '../components/FeatureFlags';
import { TestnetsToggle } from '../components/TestnetsToggle';

export const DevUtilsScreen = ({
    navigation,
}: StackProps<DevUtilsStackParamList, DevUtilsStackRoutes.DevUtils>) => {
    const shouldShowFeatureFlags = isDevelopOrDebugEnv();

    return (
        <Screen
            screenHeader={
                <ScreenHeader>
                    <DeviceManager />
                </ScreenHeader>
            }
            subheader={<ScreenSubHeader content="DEV utils" />}
        >
            <VStack>
                <Card>
                    <VStack spacing="medium">
                        {!isDebugEnv() && <BuildInfo />}
                        {isDebugEnv() && (
                            <Button onPress={() => navigation.navigate(DevUtilsStackRoutes.Demo)}>
                                See Component Demo
                            </Button>
                        )}
                        {!isProduction() && <RenderingUtils />}
                        {shouldShowFeatureFlags && <FeatureFlags />}
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
                            Wipe all data
                        </Button>
                    </VStack>
                </Card>
                <Card>
                    <TestnetsToggle />
                </Card>
            </VStack>
        </Screen>
    );
};
