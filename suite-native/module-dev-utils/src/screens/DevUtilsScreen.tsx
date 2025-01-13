import { Alert } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';

import { getEnv, isDevelopOrDebugEnv } from '@suite-native/config';
import { Button, Card, VStack, TitleHeader } from '@suite-native/atoms';
import {
    Screen,
    DevUtilsStackParamList,
    DevUtilsStackRoutes,
    ScreenSubHeader,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
    RootStackParamList,
    OnboardingStackRoutes,
} from '@suite-native/navigation';
import { clearStorage } from '@suite-native/storage';
import { getCommitHash, getSuiteVersion } from '@trezor/env-utils';

import { RenderingUtils } from '../components/RenderingUtils';
import { FeatureFlags } from '../components/FeatureFlags';
import { TestnetsToggle } from '../components/TestnetsToggle';
import { DevicePassphraseSwitch } from '../components/DevicePassphraseSwitch';
import { MessageSystemInfo } from '../components/MessageSystemInfo';

type NavigationProps = StackToStackCompositeNavigationProps<
    DevUtilsStackParamList,
    DevUtilsStackRoutes.DevUtils,
    RootStackParamList
>;

export const DevUtilsScreen = () => {
    const navigation = useNavigation<NavigationProps>();

    const navigateToNewWelcomeFlow = () =>
        navigation.navigate(RootStackRoutes.Onboarding, {
            screen: OnboardingStackRoutes.Welcome,
        });

    return (
        <Screen screenHeader={<ScreenSubHeader content="DEV utils" />}>
            <VStack spacing="sp16">
                <Card>
                    <VStack spacing="sp16">
                        <TitleHeader
                            title="Build version"
                            subtitle={`${getEnv()}-${getSuiteVersion()}, commit ${getCommitHash() || 'N/A in debug build'}`}
                        />
                        {isDevelopOrDebugEnv() && (
                            <>
                                <Button
                                    onPress={() => navigation.navigate(DevUtilsStackRoutes.Demo)}
                                >
                                    See Component Demo
                                </Button>
                                {/* This button will be present for limited time only, until the new welcome flow is finished and enabled by default. */}
                                <Button onPress={navigateToNewWelcomeFlow}>
                                    Open New Welcome Flow
                                </Button>
                            </>
                        )}
                        <FeatureFlags />
                        {isDevelopOrDebugEnv() && (
                            <>
                                <RenderingUtils />
                                <DevicePassphraseSwitch />
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
                <MessageSystemInfo />
            </VStack>
        </Screen>
    );
};
