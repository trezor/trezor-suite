import { ReactNode, useState } from 'react';

import { TitleHeader, VStack } from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    DeviceSuspicionCause,
    StackProps,
} from '@suite-native/navigation';
import { TREZOR_RESELLERS_URL } from '@trezor/urls';

import { DeviceOnboardingScreenWithExitButton } from '../components/OnboardingScreenWithExitButton';
import { SecurityCheckStepCard } from '../components/SecurityCheckStepCard';
import { SecuritySealDescription } from '../components/SecuritySealDescription';

const stepToContentMap = {
    1: {
        header: <Translation id="moduleDeviceOnboarding.securityCheckScreen.step1.header" />,
        suspicionCause: 'untrustedReseller',
        description: (
            <Translation
                id="moduleDeviceOnboarding.securityCheckScreen.step1.description"
                values={{
                    link: linkChunk => (
                        <Link
                            href={TREZOR_RESELLERS_URL}
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
        suspicionCause: 'securitySeal',
    },
    3: {
        header: <Translation id="moduleDeviceOnboarding.securityCheckScreen.step3.header" />,
        description: (
            <Translation id="moduleDeviceOnboarding.securityCheckScreen.step3.description" />
        ),
        icon: 'package',
        suspicionCause: 'packaging',
    },
} as const satisfies Record<
    1 | 2 | 3,
    {
        header: ReactNode;
        description: ReactNode;
        icon: IconName;
        link?: string;
        suspicionCause: DeviceSuspicionCause;
    }
>;

export const SecurityCheckScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.SecurityCheck>) => {
    const [currentStep, setCurrentStep] = useState<number>(1);

    const handlePressConfirmButton = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);

            return;
        }

        navigation.navigate(DeviceOnboardingStackRoutes.FirmwareInstallation);
    };

    return (
        <DeviceOnboardingScreenWithExitButton>
            <VStack justifyContent="flex-start" flex={1} marginTop="sp16">
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
                    <VStack spacing="sp16">
                        {Object.entries(stepToContentMap).map(([stepIndex, content]) => (
                            <SecurityCheckStepCard
                                key={stepIndex}
                                isChecked={currentStep > Number(stepIndex)}
                                isOpened={currentStep === Number(stepIndex)}
                                onPressConfirmButton={handlePressConfirmButton}
                                icon={content.icon}
                                header={content.header}
                                description={content.description}
                                suspicionCause={content.suspicionCause}
                            />
                        ))}
                    </VStack>
                </VStack>
            </VStack>
        </DeviceOnboardingScreenWithExitButton>
    );
};
