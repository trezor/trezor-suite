import { useEffect, useMemo, useState } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { selectRecoveryStatus } from '@suite/recovery';
import { goto } from '@suite/router';
import {
    deviceActions,
    selectSelectedDevice,
    selectShouldDoDeviceManualCheck,
} from '@suite-common/device';
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
import {
    selectAllDevicesRequiringSecurityCheck,
    selectShouldCheckDeviceAuthenticity,
} from 'src/selectors/suite/securityCheckSelectors';
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

type ManualDeviceCheckProps = { onConfirm: () => void };

const ManualDeviceCheck = ({ onConfirm }: ManualDeviceCheckProps) => {
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
        onConfirm();
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
                        data-testid="@onboarding/confirm-manual-device-check"
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
    const selectedDeviceId = selectedDevice?.id;
    const dispatch = useDispatch();
    const { goToSuite } = useOnboarding();
    const [checkedDevices, setCheckedDevices] = useState<string[]>([]);

    const shouldDisplayManualDeviceCheck = useSelector(state =>
        selectShouldDoDeviceManualCheck(state, selectedDeviceId),
    );
    const shouldDisplayDeviceAuthenticityCheck = useSelector(state =>
        selectShouldCheckDeviceAuthenticity(state, selectedDevice),
    );

    // This cannot be decided only based on redux state, because the Authenticity Check screen has a result screen,
    // so after the check itself is complete (not needed as per redux state) we need to stay on it.
    const [isAuthenticityCheckStep, setIsAuthenticityCheckStep] = useState(
        // Edge case: start at Device Authenticity step if it is required, and Manual Device Check has already been done.
        !shouldDisplayManualDeviceCheck && shouldDisplayDeviceAuthenticityCheck,
    );

    const allDevicesRequiringSecurityCheck = useSelector(selectAllDevicesRequiringSecurityCheck);

    // Finish up the Security Check – but if there are multiple devices eligible for either
    // Manual Device Check or Device Authenticity check, check all of them before continuing to Suite.
    const goToSuiteOrNextDevice = () => {
        const nextDeviceToCheck = allDevicesRequiringSecurityCheck.find(
            ({ id }) => !!id && id !== selectedDeviceId && !checkedDevices.includes(id),
        );

        if (nextDeviceToCheck !== undefined) {
            setIsAuthenticityCheckStep(false); // Next device → reset to first step (it might not even support DAC)
            setCheckedDevices(prev => [...prev, selectedDeviceId ?? '']); // Device ID must be available as firmware is already installed.
            dispatch(deviceActions.selectDevice(nextDeviceToCheck));
        } else {
            goToSuite();
        }
    };

    // Finish up the Security Check unless there is still Device Authenticity Check needed to be done.
    const onManualDeviceCheckConfirm = () => {
        if (shouldDisplayDeviceAuthenticityCheck) {
            setIsAuthenticityCheckStep(true);
        } else {
            goToSuiteOrNextDevice();
        }
    };

    // Device Authenticity Check is the 2nd step
    if (isAuthenticityCheckStep) {
        return (
            <Box padding={{ top: 40 }} width="100%">
                <DeviceAuthenticityStep goToNext={goToSuiteOrNextDevice} />
            </Box>
        );
    }

    // Manual Device Check is the 1st step (and default view on this page)
    return (
        <Card paddingType="large">
            <ManualDeviceCheck onConfirm={onManualDeviceCheckConfirm} />
        </Card>
    );
};
