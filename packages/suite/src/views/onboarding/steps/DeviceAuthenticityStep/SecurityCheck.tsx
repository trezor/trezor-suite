import { useEffect, useMemo, useState } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { deviceActions, selectDevices, selectSelectedDevice } from '@suite-common/device';
import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import { AcquiredDevice } from '@suite-common/suite-types';
import {
    Box,
    Button,
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
import { breakpoints, spacings } from '@trezor/theme';
import {
    TREZOR_RESELLERS_URL,
    TREZOR_SUPPORT_FW_ALREADY_INSTALLED,
    TREZOR_SUPPORT_IS_MY_DEVICE_SAFE,
    TREZOR_URL,
} from '@trezor/urls';

import { goto } from 'src/actions/suite/routerActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { Hologram } from 'src/components/onboarding/Hologram';
import { TrezorLink } from 'src/components/suite';
import { SecurityCheckFail } from 'src/components/suite/SecurityCheck/SecurityCheckFail';
import { SecurityCheckLayout } from 'src/components/suite/SecurityCheck/SecurityCheckLayout';
import { ContactSupport } from 'src/components/suite/SecurityCheck/deviceCompromisedCtas';
import { useDispatch, useLayoutSize, useOnboarding, useSelector } from 'src/hooks/suite';
import { selectIsOnboardingActive } from 'src/reducers/onboarding/onboardingReducer';
import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';
import { useAnalytics } from 'src/support/useAnalytics';

import { SecurityChecklist } from './SecurityChecklist';
import { SecurityChecklistItem } from './types';
import { ContentFlex, useIsContentBelowBreakpoint } from '../../../../support/suite/ContentFlex';
import { useResponsiveContext } from '../../../../support/suite/ResponsiveContext';

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

type ButtonFlexProps = {
    children: React.ReactNode;
};

const ButtonFlex = ({ children }: ButtonFlexProps) => {
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint();

    return (
        <ContentFlex
            isReversed={isContentBelowBreakpoint}
            alignItems={isContentBelowBreakpoint ? 'center' : 'stretch'}
            flexWrap="wrap"
            gap={spacings.xl}
            width="100%"
            margin={{ top: spacings.xxxxl }}
        >
            {children}
        </ContentFlex>
    );
};

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
    const recovery = useSelector(state => state.recovery);
    const device = useSelector(selectSelectedDevice);
    const deviceModel = device?.features?.internal_model || DeviceModelInternal.UNKNOWN;
    const isOnboardingActive = useSelector(selectIsOnboardingActive);
    const { contentWidth } = useResponsiveContext();
    const [isFailed, setIsFailed] = useState(false);

    const { goToNextStep, rerun, updateAnalytics } = useOnboarding();
    const dispatch = useDispatch();

    const initialized = !!device?.features?.initialized;
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
        : getNoFirmwareChecklist(isBelowTablet);

    const toggleView = () => setIsFailed(current => !current);
    const handleContinueButtonClick = () => {
        if (shouldAuthenticateSelectedDevice) {
            goToDeviceAuthentication();
        } else {
            goToSuiteOrNextDevice();
        }
    };

    const handleSetupButtonClick = () => {
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
            dispatch(routerActions.goto('onboarding-index'));
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

    const isContentBelowMobile = !!(contentWidth && contentWidth < breakpoints.mobile);

    return isFailed ? (
        <SecurityCheckFail
            ctaSection={
                <ButtonFlex>
                    <Button
                        intent="neutral"
                        priority="secondary"
                        onClick={toggleView}
                        size={isContentBelowMobile ? 'medium' : 'large'}
                        minWidth={100}
                    >
                        <Translation id="TR_BACK" />
                    </Button>
                    <ContactSupport supportUrl={supportUrl} />
                </ButtonFlex>
            }
            heading="TR_PLAY_IT_SAFE"
            text="TR_DEVICE_COMPROMISED_TEXT_SOFT"
        />
    ) : (
        <SecurityCheckLayout imageMode="ROTATE">
            <Column gap={spacings.sm}>
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
                    onClick={toggleView}
                >
                    <Translation id="TR_CONNECTED_DIFFERENT_DEVICE" />
                </TextButton>
            </Column>
            <Divider margin={{ vertical: spacings.xxl }} />
            <Column gap={spacings.md}>
                <H3>
                    <Translation id={headingText} />
                </H3>
                <SecurityChecklist items={checklistItems} />
            </Column>
            <ButtonFlex>
                <Button
                    intent="neutral"
                    priority="secondary"
                    onClick={toggleView}
                    size={isContentBelowMobile ? 'medium' : 'large'}
                    minWidth={240}
                >
                    <Translation id={secondaryButtonText} />
                </Button>
                {initialized ? (
                    <Button
                        data-testid="@onboarding/complete-onboarding"
                        onClick={handleContinueButtonClick}
                        size="large"
                        intent="brand"
                        minWidth={240}
                    >
                        <Translation id="TR_YES_CONTINUE" />
                    </Button>
                ) : (
                    <Tooltip
                        content={
                            <Note iconName="clock">
                                <Translation id="TR_TAKES_N_MINUTES" />
                            </Note>
                        }
                    >
                        <Button
                            onClick={handleSetupButtonClick}
                            data-testid="@analytics/continue-button"
                            size="large"
                            intent="brand"
                            minWidth={240}
                        >
                            <Translation id={primaryButtonTopText} />
                        </Button>
                    </Tooltip>
                )}
            </ButtonFlex>
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
            <Box padding={{ top: 40 }}>
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
