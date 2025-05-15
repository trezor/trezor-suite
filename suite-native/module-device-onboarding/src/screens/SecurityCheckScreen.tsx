import { EventType, analytics } from '@suite-native/analytics';
import { CardStepper, CardStepperMap, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    DeviceSuspicionCause,
    StackProps,
} from '@suite-native/navigation';
import { TREZOR_RESELLERS_URL } from '@trezor/urls';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { SecuritySealDescription } from '../components/SecuritySealDescription';

const stepToContentMap = {
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
                                    type: EventType.DeviceSetupInfo,
                                    payload: {
                                        location: 'untrustedReseller',
                                    },
                                });
                            }}
                            label={linkChunk}
                            isUnderlined
                            textVariant="highlight"
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
} as const satisfies CardStepperMap<DeviceSuspicionCause>;

export const SecurityCheckScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.SecurityCheck>) => {
    const handleFinishStepper = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.FirmwareInstallation);
    };

    const handlePressSecondaryButton = (id?: DeviceSuspicionCause) => {
        if (!id) return;

        navigation.navigate(DeviceOnboardingStackRoutes.SuspiciousDevice, {
            suspicionCause: id,
        });
        analytics.report({
            type: EventType.DeviceSetupSecurityCheck,
            payload: {
                location: id,
            },
        });
    };

    return (
        <DeviceOnboardingScreenWithExitButton>
            <VStack justifyContent="flex-start" flex={1}>
                <VStack spacing="sp24">
                    <TitleHeader
                        titleVariant="titleMedium"
                        title={
                            <Translation id="moduleDeviceOnboarding.securityCheckScreen.title" />
                        }
                        subtitle={
                            <Translation id="moduleDeviceOnboarding.securityCheckScreen.subtitle" />
                        }
                    />
                    <CardStepper<DeviceSuspicionCause>
                        onFinish={handleFinishStepper}
                        onPressSecondaryButton={handlePressSecondaryButton}
                        stepToContentMap={stepToContentMap}
                    />
                </VStack>
            </VStack>
        </DeviceOnboardingScreenWithExitButton>
    );
};
