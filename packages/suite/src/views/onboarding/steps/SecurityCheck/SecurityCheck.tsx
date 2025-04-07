import { useEffect, useMemo, useState } from 'react';

import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import { AcquiredDevice } from '@suite-common/suite-types';
import { getConnectedDeviceStatus } from '@suite-common/suite-utils';
import { deviceActions, selectDevices, selectSelectedDevice } from '@suite-common/wallet-core';
import {
    Button,
    Card,
    Column,
    Divider,
    H3,
    Icon,
    Paragraph,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import { models } from '@trezor/connect/src/data/models';
import { spacings } from '@trezor/theme';
import {
    TREZOR_RESELLERS_URL,
    TREZOR_SUPPORT_FW_ALREADY_INSTALLED,
    TREZOR_SUPPORT_IS_MY_DEVICE_SAFE,
    TREZOR_URL,
} from '@trezor/urls';

import { goto } from 'src/actions/suite/routerActions';
import { Hologram, OnboardingButtonSkip } from 'src/components/onboarding';
import { Translation, TrezorLink } from 'src/components/suite';
import { SecurityCheckFail } from 'src/components/suite/SecurityCheck/SecurityCheckFail';
import { SecurityCheckLayout } from 'src/components/suite/SecurityCheck/SecurityCheckLayout';
import { useDispatch, useLayoutSize, useOnboarding, useSelector } from 'src/hooks/suite';
import { selectIsOnboardingActive } from 'src/reducers/onboarding/onboardingReducer';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';

import { DeviceAuthenticity } from './DeviceAuthenticity';
import { SecurityChecklist } from './SecurityChecklist';
import { SecurityChecklistItem } from './types';

const firmwareInstalledChecklist = [
    {
        icon: <Icon size={24} name="info" />,
        content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_4" />,
    },
] as const satisfies SecurityChecklistItem[];

const getNoFirmwareChecklist = (isMobileLayout: boolean) =>
    [
        {
            icon: <Icon size={24} name="verified" />,
            content: (
                <Translation
                    id="TR_ONBOARDING_DEVICE_CHECK_2"
                    values={{
                        reseller: link => (
                            <TrezorLink href={TREZOR_RESELLERS_URL} variant="underline">
                                {link}
                            </TrezorLink>
                        ),
                        shop: link => (
                            <TrezorLink href={TREZOR_URL} variant="underline">
                                {link}
                            </TrezorLink>
                        ),
                    }}
                />
            ),
        },
        {
            icon: <Icon size={24} name="hologram" />,
            content: (
                <Translation
                    id="TR_ONBOARDING_DEVICE_CHECK_1"
                    values={{
                        strong: chunks => (
                            <Tooltip
                                placement={isMobileLayout ? 'top' : 'left'}
                                title={<Translation id="TR_HOLOGRAM_STEP_HEADING" />}
                                content={<Hologram />}
                                isInline
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
    const { isMobileLayout } = useLayoutSize();
    const recovery = useSelector(state => state.recovery);
    const device = useSelector(selectSelectedDevice);
    const isOnboardingActive = useSelector(selectIsOnboardingActive);

    const [isFailed, setIsFailed] = useState(false);

    const { goToNextStep, rerun, updateAnalytics } = useOnboarding();
    const dispatch = useDispatch();

    const deviceStatus = getConnectedDeviceStatus(device);
    const initialized = deviceStatus === 'initialized';
    const isRecoveryInProgress = recovery.status === 'in-progress';
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
        : getNoFirmwareChecklist(isMobileLayout);

    const toggleView = () => setIsFailed(current => !current);
    const handleContinueButtonClick = () =>
        shouldAuthenticateSelectedDevice ? goToDeviceAuthentication() : goToSuiteOrNextDevice();

    const handleSetupButtonClick = () => {
        if (isRecoveryInProgress) {
            rerun();
        } else if (isOnboardingActive) {
            goToNextStep('firmware');
        } else {
            dispatch(goto('onboarding-index'));
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
            goBack={toggleView}
            heading="TR_PLAY_IT_SAFE"
            text="TR_DEVICE_COMPROMISED_TEXT_SOFT"
            supportUrl={supportUrl}
        />
    ) : (
        <SecurityCheckLayout imageMode="ROTATE">
            <Column gap={spacings.sm}>
                <Paragraph variant="tertiary">
                    <Translation id="TR_YOU_HAVE_CONNECTED" />
                </Paragraph>
                <Paragraph typographyStyle="titleMedium" variant="primary">
                    {device?.name}
                    {humanizedModelColor && <Text> {humanizedModelColor}</Text>}
                </Paragraph>
                <OnboardingButtonSkip onClick={toggleView}>
                    <Translation id="TR_CONNECTED_DIFFERENT_DEVICE" />
                </OnboardingButtonSkip>
            </Column>
            <Divider margin={{ vertical: spacings.xxl }} />
            <Column gap={spacings.md}>
                <H3>
                    <Translation id={headingText} />
                </H3>
                <SecurityChecklist items={checklistItems} />
            </Column>
            <Row
                alignItems="stretch"
                flexWrap="wrap"
                gap={spacings.xl}
                width="100%"
                margin={{ top: spacings.xxxxl }}
            >
                <Button variant="tertiary" onClick={toggleView} size="large">
                    <Translation id={secondaryButtonText} />
                </Button>
                {initialized ? (
                    <Button
                        data-testid="@onboarding/exit-app-button"
                        onClick={handleContinueButtonClick}
                        isFullWidth
                        size="large"
                        variant="primary"
                        flex="1"
                    >
                        <Translation id="TR_YES_CONTINUE" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSetupButtonClick}
                        data-testid="@analytics/continue-button"
                        isFullWidth
                        size="large"
                        variant="primary"
                        flex="1"
                    >
                        <Column alignItems="center">
                            <Translation id={primaryButtonTopText} />
                            <Text typographyStyle="label" as="div" opacity={0.65}>
                                <Row gap={spacings.xxs}>
                                    <Icon size={12} name="clock" />
                                    <Translation id="TR_TAKES_N_MINUTES" />
                                </Row>
                            </Text>
                        </Column>
                    </Button>
                )}
            </Row>
        </SecurityCheckLayout>
    );
};

export const SecurityCheck = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const devices = useSelector(selectDevices);
    const { initialRun } = useSelector(selectSuiteFlags);
    const isDeviceAuthenticityCheckEnabled = useSelector(
        state => state.suite.settings.enabledSecurityChecks.deviceAuthenticity,
    );
    const isUnlockedBootloaderAllowed = useSelector(
        state => state.suite.settings.debug.isUnlockedBootloaderAllowed,
    );
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
            <DeviceAuthenticity
                goToNext={() => goToSuiteOrNextDevice(() => setIsAuthenticityCheckStep(false))}
            />
        );
    }

    const goToDeviceAuthentication = () => setIsAuthenticityCheckStep(true);

    return (
        <Card maxWidth={840}>
            <SecurityCheckContent
                goToDeviceAuthentication={goToDeviceAuthentication}
                goToSuiteOrNextDevice={goToSuiteOrNextDevice}
                shouldAuthenticateSelectedDevice={shouldAuthenticateSelectedDevice}
            />
        </Card>
    );
};
