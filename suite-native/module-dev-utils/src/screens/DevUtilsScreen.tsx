import { Alert } from 'react-native';

import * as Sentry from '@sentry/react-native';

import { getEnv, isDebugEnv, isDevelopOrDebugEnv } from '@suite-native/config';
import { Button, Card, ListItem, VStack } from '@suite-native/atoms';
import {
    Screen,
    StackProps,
    DevUtilsStackParamList,
    DevUtilsStackRoutes,
    ScreenSubHeader,
} from '@suite-native/navigation';
import { clearStorage } from '@suite-native/storage';
import { getCommitHash, getSuiteVersion } from '@trezor/env-utils';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

import { RenderingUtils } from '../components/RenderingUtils';
import { FeatureFlags } from '../components/FeatureFlags';
import { TestnetsToggle } from '../components/TestnetsToggle';
import { DiscoveryCoinsFilter } from '../components/DiscoveryCoinsFilter';
import { DevicePassphraseSwitch } from '../components/DevicePassphraseSwitch';

export const DevUtilsScreen = ({
    navigation,
}: StackProps<DevUtilsStackParamList, DevUtilsStackRoutes.DevUtils>) => {
    const [isCoinEnablingActive] = useFeatureFlag(FeatureFlag.IsCoinEnablingActive);

    return (
        <Screen screenHeader={<ScreenSubHeader content="DEV utils" />}>
            <VStack>
                <Card>
                    <VStack spacing="medium">
                        {!isDebugEnv() && (
                            <ListItem
                                subtitle={`${getEnv()}-${getSuiteVersion()}, commit ${getCommitHash()}`}
                                title="Build version"
                            />
                        )}
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
                            </>
                        )}
                        {isCoinEnablingActive && <DiscoveryCoinsFilter />}
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
