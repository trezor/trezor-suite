import { Alert } from 'react-native';

import * as Sentry from '@sentry/react-native';

import { getEnv, isDebugEnv, isDevelopOrDebugEnv, isProduction } from '@suite-native/config';
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

import { RenderingUtils } from '../components/RenderingUtils';
import { FeatureFlags } from '../components/FeatureFlags';
import { TestnetsToggle } from '../components/TestnetsToggle';
import { DiscoveryCoinsFilter } from '../components/DiscoveryCoinsFilter';

export const DevUtilsScreen = ({
    navigation,
}: StackProps<DevUtilsStackParamList, DevUtilsStackRoutes.DevUtils>) => (
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
                    {isDebugEnv() && (
                        <Button onPress={() => navigation.navigate(DevUtilsStackRoutes.Demo)}>
                            See Component Demo
                        </Button>
                    )}
                    {!isProduction() && <RenderingUtils />}
                    {isDevelopOrDebugEnv() && (
                        <>
                            <FeatureFlags />
                            <DiscoveryCoinsFilter />
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
