import { Alert } from 'react-native';

import * as Sentry from '@sentry/react-native';

import { getEnv, isDevelopOrDebugEnv } from '@suite-native/config';
import { Button, Card, VStack, TitleHeader } from '@suite-native/atoms';
import {
    Screen,
    StackProps,
    DevUtilsStackParamList,
    DevUtilsStackRoutes,
    ScreenSubHeader,
} from '@suite-native/navigation';
import { clearStorage } from '@suite-native/storage';
import { getCommitHash, getSuiteVersion } from '@trezor/env-utils';
import { isBluetoothBuild } from '@suite-native/bluetooth';

import { RenderingUtils } from '../components/RenderingUtils';
import { FeatureFlags } from '../components/FeatureFlags';
import { TestnetsToggle } from '../components/TestnetsToggle';
import { DevicePassphraseSwitch } from '../components/DevicePassphraseSwitch';
import { BluetoothToggle } from '../components/BluetoothToggle';

export const DevUtilsScreen = ({
    navigation,
}: StackProps<DevUtilsStackParamList, DevUtilsStackRoutes.DevUtils>) => {
    return (
        <Screen screenHeader={<ScreenSubHeader content="DEV utils" />}>
            <VStack>
                <Card>
                    <VStack spacing="medium">
                        <TitleHeader
                            title="Build version"
                            subtitle={`${getEnv()}-${getSuiteVersion()}, commit ${getCommitHash() || 'N/A in debug build'}`}
                        />
                        {isDevelopOrDebugEnv() && (
                            <Button onPress={() => navigation.navigate(DevUtilsStackRoutes.Demo)}>
                                See Component Demo
                            </Button>
                        )}
                        <FeatureFlags />
                        {isDevelopOrDebugEnv() && (
                            <>
                                <RenderingUtils />
                                <DevicePassphraseSwitch />
                                {isBluetoothBuild && <BluetoothToggle />}
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
                        <Button colorScheme="redElevation0" onPress={clearStorage}>
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
