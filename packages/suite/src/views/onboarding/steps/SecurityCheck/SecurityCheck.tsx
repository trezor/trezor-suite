import { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';

import { getConnectedDeviceStatus } from '@suite-common/suite-utils';
import { AcquiredDevice } from '@suite-common/suite-types';
import { deviceActions, selectDevice, selectDevices } from '@suite-common/wallet-core';
import { Button, Column, Icon, H2, Text, Tooltip, Divider } from '@trezor/components';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import { TREZOR_RESELLERS_URL, TREZOR_URL } from '@trezor/urls';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useLayoutSize, useOnboarding, useSelector } from 'src/hooks/suite';
import { Translation, TrezorLink } from 'src/components/suite';
import { Hologram, OnboardingButtonSkip } from 'src/components/onboarding';
import { CollapsibleOnboardingCard } from 'src/components/onboarding/CollapsibleOnboardingCard';
import { SecurityCheckLayout } from 'src/components/suite/SecurityCheck/SecurityCheckLayout';
import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from 'src/constants/suite/device';
import { SecurityCheckFail } from 'src/components/suite/SecurityCheck/SecurityCheckFail';
import { selectIsOnboardingActive } from 'src/reducers/onboarding/onboardingReducer';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';
import { SecurityChecklist } from './SecurityChecklist';
import { DeviceAuthenticity } from './DeviceAuthenticity';

const StyledCard = styled(CollapsibleOnboardingCard)`
    max-width: 840px;
    padding: ${spacingsPx.md};
`;

const DeviceNameSection = styled.div`
    margin: ${spacingsPx.xs} 0 ${spacingsPx.xl};
    width: 100%;
`;

const DeviceName = styled.div`
    ${typography.titleMedium}
    color: ${({ theme }) => theme.backgroundPrimaryDefault};
    margin-top: ${spacingsPx.sm};
`;

const Underline = styled.span`
    position: relative;
    display: inline-block;

    &::after {
        content: '';
        position: absolute;
        bottom: ${spacingsPx.xxs};
        left: 0;
        right: 0;
        border-bottom: 1px dashed ${({ theme }) => theme.textSubdued};
        width: 100%;
    }
`;

const Flex = styled.div`
    flex: 1;
`;

const TimeEstimateWrapper = styled.div`
    ${typography.label}
    display: flex;
    justify-content: center;
    align-items: center;
    gap: ${spacingsPx.xxxs};
    opacity: 0.66;
    margin-top: 1px;
`;

const Buttons = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${spacingsPx.xl};
`;

const StyledTrezorLink = styled(TrezorLink)`
    color: inherit;
`;

const TooltipWrapper = styled.span`
    display: inline-block;
    position: relative;
`;

const firmwareInstalledChecklist = [
    {
        icon: 'info',
        content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_4" />,
    },
] as const;

const getNoFirmwareChecklist = (isMobileLayout: boolean) =>
    [
        {
            icon: 'verified',
            content: (
                <Translation
                    id="TR_ONBOARDING_DEVICE_CHECK_2"
                    values={{
                        reseller: link => (
                            <StyledTrezorLink href={TREZOR_RESELLERS_URL} variant="underline">
                                {link}
                            </StyledTrezorLink>
                        ),
                        shop: link => (
                            <StyledTrezorLink href={TREZOR_URL} variant="underline">
                                {link}
                            </StyledTrezorLink>
                        ),
                    }}
                />
            ),
        },
        {
            icon: 'hologram',
            content: (
                <Translation
                    id="TR_ONBOARDING_DEVICE_CHECK_1"
                    values={{
                        strong: chunks => (
                            <TooltipWrapper>
                                <Tooltip
                                    placement={isMobileLayout ? 'top' : 'left'}
                                    title={<Translation id="TR_HOLOGRAM_STEP_HEADING" />}
                                    content={<Hologram />}
                                >
                                    <Underline>{chunks}</Underline>
                                </Tooltip>
                            </TooltipWrapper>
                        ),
                    }}
                />
            ),
        },
        {
            icon: 'package',
            content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_3" />,
        },
    ] as const;

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
    const device = useSelector(selectDevice);
    const isOnboardingActive = useSelector(selectIsOnboardingActive);

    const [isFailed, setIsFailed] = useState(false);

    const { goToNextStep, rerun, updateAnalytics } = useOnboarding();
    const theme = useTheme();
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

    return isFailed ? (
        <SecurityCheckFail useSoftMessaging goBack={toggleView} />
    ) : (
        <SecurityCheckLayout>
            <Column alignItems="flex-start">
                <DeviceNameSection>
                    <Text variant="tertiary">
                        <Translation id="TR_YOU_HAVE_CONNECTED" />
                    </Text>
                    <DeviceName>{device?.name}</DeviceName>
                    <OnboardingButtonSkip onClick={toggleView}>
                        <Translation id="TR_CONNECTED_DIFFERENT_DEVICE" />
                    </OnboardingButtonSkip>
                </DeviceNameSection>
                <Divider margin={{ top: spacings.zero, bottom: spacings.xl }} />
                <H2 margin={{ top: spacings.md }}>
                    <Translation id={headingText} />
                </H2>
                <SecurityChecklist items={checklistItems} />
            </Column>
            <Buttons>
                <Button variant="tertiary" onClick={toggleView} size="large">
                    <Translation id={secondaryButtonText} />
                </Button>
                <Flex>
                    {initialized ? (
                        <Button
                            data-testid="@onboarding/exit-app-button"
                            onClick={handleContinueButtonClick}
                            isFullWidth
                            size="large"
                        >
                            <Translation id="TR_YES_CONTINUE" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSetupButtonClick}
                            data-testid="@analytics/continue-button"
                            isFullWidth
                            size="large"
                        >
                            <Column>
                                <Translation id={primaryButtonTopText} />
                                <TimeEstimateWrapper>
                                    <Icon size={12} name="clock" color={theme.iconOnPrimary} />
                                    <Translation id="TR_TAKES_N_MINUTES" />
                                </TimeEstimateWrapper>
                            </Column>
                        </Button>
                    )}
                </Flex>
            </Buttons>
        </SecurityCheckLayout>
    );
};

export const SecurityCheck = () => {
    const selectedDevice = useSelector(selectDevice);
    const devices = useSelector(selectDevices);
    const { initialRun } = useSelector(selectSuiteFlags);
    const {
        isDeviceAuthenticityCheckDisabled,
        debug: { isUnlockedBootloaderAllowed },
    } = useSelector(state => state.suite.settings);
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
        !isDeviceAuthenticityCheckDisabled &&
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
        <StyledCard>
            <SecurityCheckContent
                goToDeviceAuthentication={goToDeviceAuthentication}
                goToSuiteOrNextDevice={goToSuiteOrNextDevice}
                shouldAuthenticateSelectedDevice={shouldAuthenticateSelectedDevice}
            />
        </StyledCard>
    );
};
