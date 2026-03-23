import { type AnalyticsNativeEvents, events } from '@suite-native/analytics';
import { CardStepper, type CardStepperMap, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type DeviceSuspicionCause,
    type StackProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { type Analytics } from '@trezor/analytics-uploader';
import { TREZOR_RESELLERS_URL } from '@trezor/urls';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { SecuritySealDescription } from '../components/SecuritySealDescription';

const cardStepperContentMap = (analytics: Analytics<AnalyticsNativeEvents>) =>
    ({
        1: {
            header: <Translation id="moduleDeviceOnboarding.securityCheckScreen.step1.header" />,
            secondaryButtonParameter: 'untrustedReseller',
            description: (
                <Translation
                    id="moduleDeviceOnboarding.securityCheckScreen.step1.description"
                    values={{
                        link: linkChunk => (
                            <Link
                                href={TREZOR_RESELLERS_URL}
                                onPress={() => {
                                    analytics.report({
                                        type: events.deviceSetupInfoEvent.name,
                                        payload: {
                                            location: 'untrustedReseller',
                                        },
                                    });
                                }}
                                label={linkChunk}
                                isUnderlined
                                textVariant="body-md-strong"
                                textColor="backgroundSecondaryDefault"
                            />
                        ),
                    }}
                />
            ),
            icon: 'seal',
        },
        2: {
            header: <Translation id="moduleDeviceOnboarding.securityCheckScreen.step2.header" />,
            description: <SecuritySealDescription />,
            icon: 'selectionSlash',
            secondaryButtonParameter: 'securitySeal',
        },
        3: {
            header: <Translation id="moduleDeviceOnboarding.securityCheckScreen.step3.header" />,
            description: (
                <Translation id="moduleDeviceOnboarding.securityCheckScreen.step3.description" />
            ),
            icon: 'package',
            secondaryButtonParameter: 'packaging',
        },
    }) as const satisfies CardStepperMap<DeviceSuspicionCause>;

export const SecurityCheckScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.SecurityCheck>) => {
    const analytics = useAnalytics();
    const handleFinishStepper = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.FirmwareInfo);
    };

    const handlePressSecondaryButton = (id?: DeviceSuspicionCause) => {
        if (!id) return;

        navigation.navigate(DeviceOnboardingStackRoutes.SuspiciousDevice, {
            suspicionCause: id,
        });
        analytics.report({
            type: events.deviceSetupSecurityCheckEvent.name,
            payload: {
                location: id,
            },
        });
    };

    return (
        <DeviceOnboardingScreenWithExitButton
            screenHeaderTitle={
                <Translation id="moduleDeviceOnboarding.securityCheckScreen.title" />
            }
            screenHeaderSubtitle={
                <Translation id="moduleDeviceOnboarding.securityCheckScreen.subtitle" />
            }
        >
            <VStack justifyContent="flex-start" flex={1}>
                <CardStepper<DeviceSuspicionCause>
                    onFinish={handleFinishStepper}
                    secondaryButtonText={
                        <Translation id="moduleDeviceOnboarding.securityCheckScreen.declineButton" />
                    }
                    primaryButtonText={<Translation id="generic.buttons.yes" />}
                    onPressSecondaryButton={handlePressSecondaryButton}
                    stepToContentMap={cardStepperContentMap(analytics)}
                />
            </VStack>
        </DeviceOnboardingScreenWithExitButton>
    );
};
