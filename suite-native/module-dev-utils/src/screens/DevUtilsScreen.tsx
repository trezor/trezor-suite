import { Alert } from 'react-native';
import { useState } from 'react';

import { useNavigation } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';

import { Button, Card, Text, TitleHeader, VStack } from '@suite-native/atoms';
import { isBluetoothBuild, isBluetoothEnabled } from '@suite-native/bluetooth';
import { getEnv, isDevelopOrDebugEnv } from '@suite-native/config';
import { useCopyToClipboard } from '@suite-native/helpers';
import {
    DevUtilsStackParamList,
    DevUtilsStackRoutes,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
    RootStackParamList,
    Screen,
} from '@suite-native/navigation';
import { clearStorage } from '@suite-native/storage';
import { getCommitHash, getSuiteVersion } from '@trezor/env-utils';
import { logs, nativeBleManager } from '@trezor/transport-native-ble';
import TrezorConnect from '@trezor/connect';

import { BluetoothToggle } from '../components/BluetoothToggle';
import { DevicePassphraseSwitch } from '../components/DevicePassphraseSwitch';
import { FeatureFlags } from '../components/FeatureFlags';
import { MessageSystemInfo } from '../components/MessageSystemInfo';
import { RenderingUtils } from '../components/RenderingUtils';
import { TestnetsToggle } from '../components/TestnetsToggle';

type NavigationProps = StackToStackCompositeNavigationProps<
    DevUtilsStackParamList,
    DevUtilsStackRoutes.DevUtils,
    RootStackParamList
>;

export const DevUtilsScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const copyToClipboard = useCopyToClipboard();
    const [isErasingBonds, setIsErasingBonds] = useState(false);

    const handleEraseBonds = async () => {
        setIsErasingBonds(true);
        try {
            Alert.alert('Please confirm erasing BT bonds on device.');
            const result = await TrezorConnect.eraseBonds({});
            console.log('result', result);
            if (!result.success) {
                throw new Error(`${result.payload.code} - ${result.payload.error}`);
            }
            Alert.alert(
                'BT bonds erased - please follow these steps:',
                `1. Accept request on Trezor \n2. Restart Trezor device by cutting the power \n2. Click on "Forget device" in system settings \n3. Restart mobile app`,
            );
        } catch (error) {
            console.error(error);
            Alert.alert('Error erasing BT bonds', error.message);
        }
        setIsErasingBonds(false);
    };

    return (
        <Screen screenHeader={<ScreenHeader content="DEV utils" />}>
            <VStack spacing="sp16">
                <Card>
                    <VStack spacing="sp16">
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
                                <Text>
                                    EXPO_PUBLIC_BLUETOOTH_ENABLED:{' '}
                                    {process.env.EXPO_PUBLIC_BLUETOOTH_ENABLED} {'\n'}
                                    {'\n'}
                                    isBluetoothBuild: {String(isBluetoothBuild)} {'\n'}
                                    isBluetoothEnabled: {String(isBluetoothEnabled)}
                                </Text>
                                {isBluetoothBuild && <BluetoothToggle />}
                            </>
                        )}
                        <Button
                            onPress={handleEraseBonds}
                            colorScheme="redBold"
                            isLoading={isErasingBonds}
                            isDisabled={isErasingBonds}
                        >
                            🔵🗑️ Erase BT bonds
                        </Button>
                        <Button
                            onPress={() => {
                                copyToClipboard(logs.join('\n'));
                            }}
                        >
                            Copy BT logs
                        </Button>
                        <Button
                            onPress={() => {
                                const errorMessage = `Sentry test error - ${Date.now()}`;
                                Sentry.captureException(new Error(errorMessage));
                                Alert.alert('Sentry error thrown', errorMessage);
                            }}
                        >
                            Throw Sentry error
                        </Button>
                        <Button colorScheme="redBold" onPress={clearStorage}>
                            💥 Wipe all data
                        </Button>
                    </VStack>
                </Card>
                <Card>
                    <TestnetsToggle />
                </Card>
                <MessageSystemInfo />
            </VStack>
        </Screen>
    );
};
