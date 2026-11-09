import { useSelector } from 'react-redux';

import { selectDeviceModel } from '@suite-common/device';
import { HAS_BRANDED_PLASTIC_WRAP_PACKAGING } from '@suite-common/device-authenticity';
import { type AnalyticsNativeEvents, events, injectNativeAnalytics } from '@suite-native/analytics';
import { CardStepper, type CardStepperMap, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type DeviceSuspicionCause,
    type StackProps,
} from '@suite-native/navigation';
import { type Analytics } from '@trezor/analytics-uploader';
import { useServices } from '@trezor/dependency-injection';
import { DeviceModelInternal } from '@trezor/device-utils';
import { TREZOR_RESELLERS_URL } from '@trezor/urls';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { SecuritySealDescription } from '../components/SecuritySealDescription';

type CardStepperStep = NonNullable<CardStepperMap<DeviceSuspicionCause>[number]>;

const getSecurityCheckSteps = (
    analytics: Analytics<AnalyticsNativeEvents>,
    hasBrandedPlasticWrap: boolean,
): CardStepperStep[] => [
    {
        header: (
            <Translation id="moduleDeviceOnboarding.securityCheckScreen.trustedSource.header" />
        ),
        secondaryButtonParameter: 'untrustedReseller',
        description: (
            <Translation
                id="moduleDeviceOnboarding.securityCheckScreen.trustedSource.description"
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
                            textColor="contentBrand"
                        />
                    ),
                }}
            />
        ),
        icon: 'seal',
    },
    ...(hasBrandedPlasticWrap
        ? [
              {
                  header: (
                      <Translation id="moduleDeviceOnboarding.securityCheckScreen.plasticWrap.header" />
                  ),
                  description: (
                      <Translation id="moduleDeviceOnboarding.securityCheckScreen.plasticWrap.description" />
                  ),
                  icon: 'sticker',
                  secondaryButtonParameter: 'plasticWrap',
              } satisfies CardStepperStep,
          ]
        : []),
    {
        header: <Translation id="moduleDeviceOnboarding.securityCheckScreen.packaging.header" />,
        description: (
            <Translation id="moduleDeviceOnboarding.securityCheckScreen.packaging.description" />
        ),
        icon: 'package',
        secondaryButtonParameter: 'packaging',
    },
    {
        header: <Translation id="moduleDeviceOnboarding.securityCheckScreen.securitySeal.header" />,
        description: <SecuritySealDescription />,
        icon: 'trezorBody',
        secondaryButtonParameter: 'securitySeal',
    },
];

// CardStepper requires consecutive step numbers starting from 1.
const toNumberedSteps = (steps: CardStepperStep[]): CardStepperMap<DeviceSuspicionCause> =>
    Object.fromEntries(steps.map((step, index) => [index + 1, step]));

export const SecurityCheckScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.SecurityCheck>) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const deviceModel = useSelector(selectDeviceModel) ?? DeviceModelInternal.UNKNOWN;

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
                    stepToContentMap={toNumberedSteps(
                        getSecurityCheckSteps(
                            analytics,
                            HAS_BRANDED_PLASTIC_WRAP_PACKAGING[deviceModel],
                        ),
                    )}
                />
            </VStack>
        </DeviceOnboardingScreenWithExitButton>
    );
};
