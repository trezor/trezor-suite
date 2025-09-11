import { Alert, Pressable } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { Button, Card, Text, TitleHeader, VStack } from '@suite-native/atoms';
import { getEnv, isDevelopOrDebugEnv } from '@suite-native/config';
import { useCopyToClipboard } from '@suite-native/helpers';
import { Translation } from '@suite-native/intl';
import {
    DevUtilsStackParamList,
    DevUtilsStackRoutes,
    DynamicScreenHeader,
    RootStackParamList,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { captureSentryException } from '@suite-native/sentry';
import { clearStorage } from '@suite-native/storage';
import { getCommitHash, getSuiteVersion } from '@trezor/env-utils';

import { DevicePassphraseSwitch } from '../components/DevicePassphraseSwitch';
import { FeatureFlags } from '../components/FeatureFlags';
import { FirmwareUpdateEnvironmentSelect } from '../components/FirmwareUpdateEnvironmentSelect';
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
    const copyToClipboard = useCopyToClipboard();
    const versionString = `${getEnv()}-${getSuiteVersion()}, commit ${getCommitHash() || 'N/A in debug build'}`;

    const handleCopyVersion = () => {
        copyToClipboard(versionString);
    };

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleSettings.items.features.devUtils.title" />}
                    subtitle={<Translation id="moduleSettings.items.features.devUtils.subtitle" />}
                />
            }
        >
            <VStack spacing="sp16">
                <Card>
                    <VStack spacing="sp16">
                        <Pressable onPress={handleCopyVersion}>
                            <TitleHeader title="Build version" subtitle={versionString} />
                        </Pressable>
                        {isDevelopOrDebugEnv() && (
                            <Button onPress={() => navigation.navigate(DevUtilsStackRoutes.Demo)}>
                                See Component Demo
                            </Button>
                        )}
                    </VStack>
                </Card>
                <FeatureFlags />
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
                    <VStack>
                        <Text variant="highlight">Trading</Text>
                        <TradingEnvironmentSelect />
                        <TradingDeeplinks />
                    </VStack>
                </Card>
                <MessageSystemInfo />
                <Card>
                    <VStack>
                        <Text variant="highlight">Firmware Source</Text>
                        <FirmwareUpdateEnvironmentSelect />
                    </VStack>
                </Card>
            </VStack>
        </Screen>
    );
};
