import { Alert } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { Button, Card, Text, TitleHeader, VStack } from '@suite-native/atoms';
import { getEnv, isDevelopOrDebugEnv } from '@suite-native/config';
import {
    DevUtilsStackParamList,
    DevUtilsStackRoutes,
    RootStackParamList,
    Screen,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { captureSentryException } from '@suite-native/sentry';
import { clearStorage } from '@suite-native/storage';
import { getCommitHash, getSuiteVersion } from '@trezor/env-utils';

import { BluetoothCard } from '../components/BluetoothCard';
import { DevicePassphraseSwitch } from '../components/DevicePassphraseSwitch';
import { FeatureFlags } from '../components/FeatureFlags';
import { MessageSystemInfo } from '../components/MessageSystemInfo';
import { RenderingUtils } from '../components/RenderingUtils';
import { TestnetsToggle } from '../components/TestnetsToggle';
import { TradingDeeplinks } from '../components/TradingDeeplinks';
import { TradingEnvironmentSelect } from '../components/TradingEnvironmentSelect';

type NavigationProps = StackToStackCompositeNavigationProps<
    DevUtilsStackParamList,
    DevUtilsStackRoutes.DevUtils,
    RootStackParamList
>;

export const DevUtilsScreen = () => {
    const navigation = useNavigation<NavigationProps>();

    return (
        <Screen header={<ScreenHeader content="DEV utils" />}>
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
                    </VStack>
                </Card>
                <FeatureFlags />
                <BluetoothCard />
                <Card>
                    <VStack spacing="sp16">
                        {isDevelopOrDebugEnv() && (
                            <>
                                <RenderingUtils />
                                <DevicePassphraseSwitch />
                            </>
                        )}
                        <Button
                            onPress={() => {
                                const errorMessage = `Sentry test error - ${Date.now()}`;
                                captureSentryException(new Error(errorMessage));
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
                <Card>
                    <Text variant="highlight">Trading</Text>
                    <TradingEnvironmentSelect />
                    <TradingDeeplinks />
                </Card>
                <MessageSystemInfo />
            </VStack>
        </Screen>
    );
};
