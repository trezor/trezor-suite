import { useEffect, useMemo, useState } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { selectRecoveryStatus } from '@suite/recovery';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { injectDispatch } from '@suite-common/redux-utils';
import {
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
import { ClockIcon, GradientIcon, InfoIcon, PackageIcon, SealCheckIcon } from '@trezor/icons';
import { breakpoints } from '@trezor/theme';
import {
    TREZOR_RESELLERS_URL,
    TREZOR_SUPPORT_FW_ALREADY_INSTALLED,
    TREZOR_SUPPORT_IS_MY_DEVICE_SAFE,
    TREZOR_URL,
} from '@trezor/urls';

import { Hologram } from 'src/components/onboarding/Hologram';
import { useLayoutSize, useOnboarding, useSelector } from 'src/hooks/suite';
import { selectIsOnboardingActive } from 'src/reducers/onboarding/onboardingReducer';
import { ContentFlex, useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { SecurityCheckButton } from './components/SecurityCheckButton';
import { SecurityCheckFail } from './components/SecurityCheckFail';
import { SecurityCheckLayout } from './components/SecurityCheckLayout';
import { SecurityChecklist } from './components/SecurityChecklist';
import { ContactSupport } from './components/ctas';
import { type SecurityChecklistItem } from './types';

const firmwareInstalledChecklist = [
    {
        icon: <Icon size={24} as={InfoIcon} />,
        content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_4" />,
    },
] as const satisfies SecurityChecklistItem[];

const getNoFirmwareChecklist = (isBelowTablet: boolean) =>
    [
        {
            icon: <Icon size={24} as={SealCheckIcon} />,
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
            icon: <Icon size={24} as={GradientIcon} />,
            content: (
                <Translation
                    id="TR_ONBOARDING_DEVICE_CHECK_1"
                    values={{
                        strong: chunks => (
                            <Tooltip
                                placement={isBelowTablet ? 'top' : 'left'}
                                content={
                                    <Column>
                                        <Translation id="TR_HOLOGRAM_STEP_HEADING" />
                                        <Hologram />
                                    </Column>
                                }
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
            icon: <Icon size={24} as={PackageIcon} />,
            content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_3" />,
        },
    ] as const satisfies SecurityChecklistItem[];

type ManualDeviceCheckProps = {
    goToDeviceAuthentication: () => void;
    goToSuiteOrNextDevice: () => void;
    shouldAuthenticateSelectedDevice: boolean;
};

export const ManualDeviceCheck = ({
    goToDeviceAuthentication,
    goToSuiteOrNextDevice,
    shouldAuthenticateSelectedDevice,
}: ManualDeviceCheckProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { isBelowTablet } = useLayoutSize();
    const recoveryStatus = useSelector(selectRecoveryStatus);
    const device = useSelector(selectSelectedDevice);
    const isVerticalLayout = useIsContentBelowBreakpoint(breakpoints.tablet);
    const deviceId = device?.id;
    const deviceModel = device?.features?.internal_model || DeviceModelInternal.UNKNOWN;
    const isOnboardingActive = useSelector(selectIsOnboardingActive);
    const [isFailed, setIsFailed] = useState(false);

    const { goToNextStep, rerun, updateAnalytics } = useOnboarding();

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
        dispatch(persistentDeviceDataActions.setManualDeviceCheckSuccess({ deviceId }));
        if (shouldAuthenticateSelectedDevice) {
            goToDeviceAuthentication();
        } else {
            goToSuiteOrNextDevice();
        }
    };

    const handleSetupButtonClick = () => {
        dispatch(persistentDeviceDataActions.setManualDeviceCheckSuccess({ deviceId }));
        analytics.report(
            {
                type: events.deviceSetupStartedEvent.name,
                payload: {
                    deviceModel,
                },
            },
            { force: true },
        );

        if (isRecoveryInProgress) {
            rerun();
        } else if (isOnboardingActive) {
            goToNextStep('firmware');
            // ensure that we are not stuck in the 'start' FullscreenApp
            dispatch(gotoThunk({ routeName: 'onboarding-index' }));
        } else {
            dispatch(gotoThunk({ routeName: 'onboarding-index' }));
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
                            <Note icon={ClockIcon}>
                                <Translation id="TR_TAKES_N_MINUTES" />
                            </Note>
                        }
                        placement="bottom"
                        width={isVerticalLayout ? '100%' : undefined}
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
