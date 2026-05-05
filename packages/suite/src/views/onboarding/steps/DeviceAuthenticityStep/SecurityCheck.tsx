import { useEffect, useMemo, useState } from 'react';

import { events } from '@suite/analytics';
import { selectFlags } from '@suite/flags';
import { Translation } from '@suite/intl';
import { selectRecoveryStatus } from '@suite/recovery';
import { goto } from '@suite/router';
import {
    selectIsDeviceAuthenticityCheckEnabled,
    selectIsUnlockedBootloaderAllowed,
} from '@suite/settings';
import { deviceActions, selectDevices, selectSelectedDevice } from '@suite-common/device';
import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import { type AcquiredDevice } from '@suite-common/suite-types';
import {
    Box,
    Card,
    Column,
    Divider,
    H3,
    Icon,
    Note,
    Paragraph,
    Text,
    TextButton,
    Tooltip,
} from '@trezor/components';
import { DeviceModelInternal, models } from '@trezor/device-utils';
import { breakpoints } from '@trezor/theme';
import {
    TREZOR_RESELLERS_URL,
    TREZOR_SUPPORT_FW_ALREADY_INSTALLED,
    TREZOR_SUPPORT_IS_MY_DEVICE_SAFE,
    TREZOR_URL,
} from '@trezor/urls';

import { Hologram } from 'src/components/onboarding/Hologram';
import { TrezorLink } from 'src/components/suite';
import { SecurityCheckButton } from 'src/components/suite/SecurityCheck/SecurityCheckButton';
import { SecurityCheckFail } from 'src/components/suite/SecurityCheck/SecurityCheckFail';
import { SecurityCheckLayout } from 'src/components/suite/SecurityCheck/SecurityCheckLayout';
import { ContactSupport } from 'src/components/suite/SecurityCheck/deviceCompromisedCtas';
import { useDispatch, useLayoutSize, useOnboarding, useSelector } from 'src/hooks/suite';
import { selectIsOnboardingActive } from 'src/reducers/onboarding/onboardingReducer';
import { ContentFlex } from 'src/support/suite/ContentFlex';
import { useAnalytics } from 'src/support/useAnalytics';

import { SecurityChecklist } from './SecurityChecklist';
import { type SecurityChecklistItem } from './types';

import { DeviceAuthenticityStep } from './index';

const firmwareInstalledChecklist = [
    {
        icon: <Icon size={24} name="info" />,
        content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_4" />,
    },
] as const satisfies SecurityChecklistItem[];

const getNoFirmwareChecklist = (isBelowTablet: boolean) =>
    [
        {
            icon: <Icon size={24} name="sealCheck" />,
            content: (
                <Translation
                    id="TR_ONBOARDING_DEVICE_CHECK_2"
                    values={{
                        reseller: link => (
                            <TrezorLink href={TREZOR_RESELLERS_URL}>{link}</TrezorLink>
                        ),
                        shop: link => <TrezorLink href={TREZOR_URL}>{link}</TrezorLink>,
                    }}
                />
            ),
        },
        {
            icon: <Icon size={24} name="gradient" />,
            content: (
                <Translation
                    id="TR_ONBOARDING_DEVICE_CHECK_1"
                    values={{
                        strong: chunks => (
                            <Tooltip
                                placement={isBelowTablet ? 'top' : 'left'}
                                title={<Translation id="TR_HOLOGRAM_STEP_HEADING" />}
                                content={<Hologram />}
                                display="inline-flex"
                                as="span"
                                hasIcon
                            >
                                {chunks}
                            </Tooltip>
                        ),
                    }}
                />
            ),
        },
        {
            icon: <Icon size={24} name="package" />,
            content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_3" />,
        },
    ] as const satisfies SecurityChecklistItem[];

type SecurityCheckContentProps = {
    goToDeviceAuthentication: () => void;
    goToSuiteOrNextDevice: () => void;
    shouldAuthenticateSelectedDevice: boolean;
};

const SecurityCheckContent = ({
    goToDeviceAuthentication,
    goToSuiteOrNextDevice,
    shouldAuthenticateSelectedDevice,
}: SecurityCheckContentProps) => {
    const analytics = useAnalytics();
    const { isBelowTablet } = useLayoutSize();
    const recoveryStatus = useSelector(selectRecoveryStatus);
    const device = useSelector(selectSelectedDevice);
    const deviceId = device?.id;
    const deviceModel = device?.features?.internal_model || DeviceModelInternal.UNKNOWN;
    const isOnboardingActive = useSelector(selectIsOnboardingActive);
    const [isFailed, setIsFailed] = useState(false);

    const { goToNextStep, rerun, updateAnalytics } = useOnboarding();
    const dispatch = useDispatch();

    const initialized = !!device?.features?.initialized;
    const isRecoveryInProgress = recoveryStatus === 'in-progress';
    const isFirmwareInstalled = device?.firmware !== 'none';
    const secondaryButtonText = isFirmwareInstalled ? 'TR_I_HAVE_NOT_USED_IT' : 'TR_I_HAVE_DOUBTS';
    const primaryButtonTopText = isFirmwareInstalled
        ? 'TR_YES_SETUP_MY_TREZOR'
        : 'TR_SETUP_MY_TREZOR';
    const headingText = isFirmwareInstalled
        ? 'TR_USED_TREZOR_BEFORE'
        : 'TR_ONBOARDING_DEVICE_CHECK';
    const supportUrl = isFirmwareInstalled
        ? TREZOR_SUPPORT_FW_ALREADY_INSTALLED
        : TREZOR_SUPPORT_IS_MY_DEVICE_SAFE;

    const checklistItems = isFirmwareInstalled
        ? firmwareInstalledChecklist
        : getNoFirmwareChecklist(isBelowTablet);

    const toggleIsDeviceRejected = () => setIsFailed(current => !current);
    const handleContinueButtonClick = () => {
        dispatch(deviceActions.setManualDeviceCheckSuccess({ deviceId }));
        if (shouldAuthenticateSelectedDevice) {
            goToDeviceAuthentication();
        } else {
            goToSuiteOrNextDevice();
        }
    };

    const handleSetupButtonClick = () => {
        dispatch(deviceActions.setManualDeviceCheckSuccess({ deviceId }));
        analytics.report({
            type: events.deviceSetupStartedEvent.name,
            payload: {
                deviceModel,
            },
        });

        if (isRecoveryInProgress) {
            rerun();
        } else if (isOnboardingActive) {
            goToNextStep('firmware');
            // ensure that we are not stuck in the 'start' FullscreenApp
            dispatch(goto({ routeName: 'onboarding-index' }));
        } else {
            dispatch(goto({ routeName: 'onboarding-index' }));
        }
    };

    // Start measuring onboarding duration. In case of an ongoing recovery, the timer is started in middleware.
    useEffect(() => {
        if (!initialized && !isRecoveryInProgress) {
            updateAnalytics({
                startTime: Date.now(),
            });
        }
    }, [initialized, isRecoveryInProgress, updateAnalytics]);

    const humanizedModelColor = useMemo(
        () =>
            device?.features?.internal_model && device?.features?.unit_color
                ? models[device?.features?.internal_model]?.colors?.[device?.features?.unit_color]
                : null,
        [device],
    );

    return isFailed ? (
        <SecurityCheckFail
            ctaSection={
                <>
                    <SecurityCheckButton
                        intent="neutral"
                        priority="secondary"
                        onClick={toggleIsDeviceRejected}
                    >
                        <Translation id="TR_BACK" />
                    </SecurityCheckButton>
                    <ContactSupport supportUrl={supportUrl} />
                </>
            }
            heading="TR_PLAY_IT_SAFE"
            text="TR_DEVICE_COMPROMISED_TEXT_SOFT"
        />
    ) : (
        <SecurityCheckLayout imageMode="ROTATE">
            <Column gap={12}>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_YOU_HAVE_CONNECTED" />
                </Paragraph>
                <Paragraph typographyStyle="headline-md" intent="brand">
                    {device?.name}
                    {humanizedModelColor && <Text> {humanizedModelColor}</Text>}
                </Paragraph>
                <TextButton
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    isUnderlined
                    onClick={toggleIsDeviceRejected}
                >
                    <Translation id="TR_CONNECTED_DIFFERENT_DEVICE" />
                </TextButton>
            </Column>
            <Divider margin={{ vertical: 32 }} />
            <Column gap={16}>
                <H3>
                    <Translation id={headingText} />
                </H3>
                <SecurityChecklist items={checklistItems} />
            </Column>
            <ContentFlex
                breakpoint={breakpoints.tablet}
                alignItems="center"
                gap={12}
                margin={{ top: 48 }}
            >
                <SecurityCheckButton
                    intent="neutral"
                    priority="secondary"
                    onClick={toggleIsDeviceRejected}
                >
                    <Translation id={secondaryButtonText} />
                </SecurityCheckButton>
                {initialized ? (
                    <SecurityCheckButton
                        data-testid="@onboarding/complete-onboarding"
                        onClick={handleContinueButtonClick}
                        intent="brand"
                    >
                        <Translation id="TR_YES_CONTINUE" />
                    </SecurityCheckButton>
                ) : (
                    <Tooltip
                        content={
                            <Note iconName="clock">
                                <Translation id="TR_TAKES_N_MINUTES" />
                            </Note>
                        }
                        width="100%"
                    >
                        <SecurityCheckButton
                            onClick={handleSetupButtonClick}
                            data-testid="@analytics/continue-button"
                            intent="brand"
                        >
                            <Translation id={primaryButtonTopText} />
                        </SecurityCheckButton>
                    </Tooltip>
                )}
            </ContentFlex>
        </SecurityCheckLayout>
    );
};

export const SecurityCheck = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const devices = useSelector(selectDevices);
    const { initialRun } = useSelector(selectFlags);
    const isDeviceAuthenticityCheckEnabled = useSelector(selectIsDeviceAuthenticityCheckEnabled);
    const isUnlockedBootloaderAllowed = useSelector(selectIsUnlockedBootloaderAllowed);
    const dispatch = useDispatch();
    const { goToSuite } = useOnboarding();
    const [isAuthenticityCheckStep, setIsAuthenticityCheckStep] = useState(false);
    const [checkedDevices, setCheckedDevices] = useState<string[]>([]);

    const isDebugDevice = (device: AcquiredDevice) =>
        isUnlockedBootloaderAllowed && device.features.bootloader_locked === false;

    const shouldAuthenticateSelectedDevice =
        !!selectedDevice?.features?.internal_model &&
        SUPPORTS_DEVICE_AUTHENTICITY_CHECK[selectedDevice.features.internal_model] &&
        initialRun &&
        isDeviceAuthenticityCheckEnabled &&
        !isDebugDevice(selectedDevice);

    // If there are multiple devices connected, check all of them before continuing to Suite.
    const goToSuiteOrNextDevice = (onSelectNext?: () => void) => {
        const nextDeviceToCheck = devices
            .filter(device => device.id !== selectedDevice?.id)
            .find(device => device.id && !checkedDevices.includes(device.id));

        if (nextDeviceToCheck !== undefined) {
            onSelectNext?.();
            setCheckedDevices(prev => [...prev, selectedDevice?.id ?? '']); // Device ID must be available as firmware is already installed.
            dispatch(deviceActions.selectDevice(nextDeviceToCheck));
        } else {
            goToSuite();
        }
    };

    // Edge case:
    // Devices A and B are connected, only device A supports authenticity check.
    // Device A disconnects while on the first screen of the check.
    useEffect(() => {
        if (isAuthenticityCheckStep && !shouldAuthenticateSelectedDevice) {
            setIsAuthenticityCheckStep(false);
        }
    }, [isAuthenticityCheckStep, shouldAuthenticateSelectedDevice]);

    if (isAuthenticityCheckStep) {
        return (
            <Box padding={{ top: 40 }} width="100%">
                <DeviceAuthenticityStep
                    goToNext={() => goToSuiteOrNextDevice(() => setIsAuthenticityCheckStep(false))}
                />
            </Box>
        );
    }

    const goToDeviceAuthentication = () => setIsAuthenticityCheckStep(true);

    return (
        <Card paddingType="large">
            <SecurityCheckContent
                goToDeviceAuthentication={goToDeviceAuthentication}
                goToSuiteOrNextDevice={goToSuiteOrNextDevice}
                shouldAuthenticateSelectedDevice={shouldAuthenticateSelectedDevice}
            />
        </Card>
    );
};
