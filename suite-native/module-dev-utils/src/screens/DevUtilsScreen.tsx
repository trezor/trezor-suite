import { Alert, Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectAnalyticsInstanceId } from '@suite-common/analytics';
import { Button, Card, Text, TitleHeader, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { getEnv, isDevelopOrDebugEnv } from '@suite-native/config';
import { Translation } from '@suite-native/intl';
import {
    DevUtilsStackParamList,
    DevUtilsStackRoutes,
    DynamicScreenHeader,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { captureSentryException } from '@suite-native/sentry';
import { useNativeServices } from '@suite-native/services';
import { clearStorage } from '@suite-native/storage';
import { getCommitHash, getSuiteVersion } from '@trezor/env-utils';

import { FeatureFlags } from '../components/FeatureFlags';
import { FirmwareUpdateEnvironmentSelect } from '../components/FirmwareUpdateEnvironmentSelect';
import { MessageSystemInfo } from '../components/MessageSystemInfo';
import { RenderingUtils } from '../components/RenderingUtils';
import { SuiteSyncQuotaManager } from '../components/SuiteSyncQuotaManager';
import { SuiteSyncRelaySettings } from '../components/SuiteSyncRelaySettings';
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
    const instanceId = useSelector(selectAnalyticsInstanceId);
    const versionString = `${getEnv()}-${getSuiteVersion()}, commit ${getCommitHash() || 'N/A in debug build'}`;
    const { getMMKVStorage } = useNativeServices();

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
                        <Pressable onPress={handleCopyVersion}>
                            <TitleHeader title="Instance ID" subtitle={instanceId} />
                        </Pressable>

                        {isDevelopOrDebugEnv() && (
                            <VStack>
                                <Button
                                    onPress={() => navigation.navigate(DevUtilsStackRoutes.Demo)}
                                >
                                    See Component Demo
                                </Button>
                                <Button
                                    onPress={() => navigation.navigate(RootStackRoutes.Storybook)}
                                >
                                    StoryBook
                                </Button>
                            </VStack>
                        )}
                    </VStack>
                </Card>
                <FeatureFlags />
                <Card>
                    <VStack spacing="sp16">
                        {isDevelopOrDebugEnv() && (
                            <>
                                <RenderingUtils />
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
                        <Button
                            colorScheme="redBold"
                            onPress={() => {
                                getMMKVStorage().then(mmkv => {
                                    clearStorage({ mmkvInstance: mmkv });
                                });
                            }}
                        >
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
                <SuiteSyncRelaySettings />
                <SuiteSyncQuotaManager />
                {isDevelopOrDebugEnv() && (
                    <Button onPress={() => navigation.navigate(DevUtilsStackRoutes.Demo)}>
                        See Component Demo
                    </Button>
                )}
            </VStack>
        </Screen>
    );
};
