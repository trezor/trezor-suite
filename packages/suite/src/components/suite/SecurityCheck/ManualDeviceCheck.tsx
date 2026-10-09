import {
    type FC,
    type PropsWithChildren,
    type ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useSelector } from 'react-redux';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { selectRecoveryStatus } from '@suite/recovery';
import { gotoThunk } from '@suite/router';
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
import { useServices } from '@trezor/dependency-injection';
import { DeviceModelInternal, models } from '@trezor/device-utils';
import { ClockIcon, GradientIcon, InfoIcon, PackageIcon, SealCheckIcon } from '@trezor/icons';
import { breakpoints } from '@trezor/theme';
import {
    TREZOR_RESELLERS_URL,
    TREZOR_SUPPORT_FW_ALREADY_INSTALLED,
    TREZOR_SUPPORT_IS_MY_DEVICE_SAFE,
    TREZOR_URL,
    type Url,
} from '@trezor/urls';

import { Hologram } from 'src/components/onboarding/Hologram';
import { useLayoutSize, useOnboarding } from 'src/hooks/suite';
import { selectIsOnboardingActive } from 'src/reducers/onboarding/onboardingReducer';
import { ContentFlex, useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { SecurityCheckButton } from './components/SecurityCheckButton';
import { SecurityCheckFail } from './components/SecurityCheckFail';
import { SecurityCheckLayout } from './components/SecurityCheckLayout';
import { SecurityChecklist } from './components/SecurityChecklist';
import { ContactSupport } from './components/ctas';
import { type SecurityChecklistItem } from './types';

/*
ABOUT THIS FILE:

The component structure in this file may seem confusing at first, but it has its reason: a device
can undergo a Manual Device Check in three distinct cases:
  A) uninitialized device without FW (fresh or factory-reset)
  B) uninitialized device with FW (after a wipe or partial onboarding)
  C) initialized device with FW (shown only once in fresh suite)

Of course, an initialized device without FW is impossible (just for completness).

There are two different behaviors: uninitialized goes to onboarding, initialized goes to suite,
and two different UIs: a routine fresh device check, and more suspicious check if the device already has FW.
  exception: a tooltip estimating how long does the onboarding take – that's a UI feature, but it's split along the initialized axis (related to onboarding).
The complexity is there because of the overlap:
  A) shows routine check UI, goes to onboarding.
  B) shows suspicious UI, goes to onboarding.
  C) shows suspicious UI, goes to suite.
*/

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

type BaseLayoutWithFlowProps = {
    heading: ReactNode;
    secondaryButtonLabel: ReactNode;
    supportUrl: Url;
    checklistItems: readonly SecurityChecklistItem[];
    primaryButton: ReactNode;
};

/**
 * Basic layout supporting both UI variants, which also implements the fully reversible check failure flow.
 * The "failed" step has always the same UI.
 */
const BaseLayoutWithFlow = ({
    heading,
    secondaryButtonLabel,
    supportUrl,
    checklistItems,
    primaryButton,
}: BaseLayoutWithFlowProps) => {
    const device = useSelector(selectSelectedDevice);
    const [isFailed, setIsFailed] = useState(false);

    // Note: no need to persist failure, there are no details worth persisting, so we are persisting only explicit success or nothing.
    const handleRejectDevice = () => setIsFailed(true);
    const handleUndoRejectDevice = () => setIsFailed(false);

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
                        onClick={handleUndoRejectDevice}
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
                    onClick={handleRejectDevice}
                >
                    <Translation id="TR_CONNECTED_DIFFERENT_DEVICE" />
                </TextButton>
            </Column>
            <Divider margin={{ vertical: 32 }} />
            <Column gap={16}>
                <H3>{heading}</H3>
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
                    onClick={handleRejectDevice}
                >
                    {secondaryButtonLabel}
                </SecurityCheckButton>
                {primaryButton}
            </ContentFlex>
        </SecurityCheckLayout>
    );
};

type CommonUILayoutProps = {
    onPrimaryButtonClick: () => void;
    PrimaryButtonWrapper: FC<PropsWithChildren>;
    dataTestId: string;
};

/**
 * UI Layout with soft wording to routinely check a fresh device.
 */
const UILayoutWithoutFirmware = ({
    onPrimaryButtonClick,
    PrimaryButtonWrapper,
    dataTestId,
}: CommonUILayoutProps) => {
    const { isBelowTablet } = useLayoutSize();

    return (
        <BaseLayoutWithFlow
            heading={<Translation id="TR_ONBOARDING_DEVICE_CHECK" />}
            secondaryButtonLabel={<Translation id="TR_I_HAVE_DOUBTS" />}
            supportUrl={TREZOR_SUPPORT_IS_MY_DEVICE_SAFE}
            checklistItems={getNoFirmwareChecklist(isBelowTablet)}
            primaryButton={
                <PrimaryButtonWrapper>
                    <SecurityCheckButton
                        onClick={onPrimaryButtonClick}
                        data-testid={dataTestId}
                        intent="brand"
                    >
                        <Translation id="TR_SETUP_MY_TREZOR" />
                    </SecurityCheckButton>
                </PrimaryButtonWrapper>
            }
        />
    );
};

/**
 * UI Layout with a more severe wording to raise suspicion, because the device already has a firmware.
 */
const UILayoutWithFirmware = ({
    onPrimaryButtonClick,
    PrimaryButtonWrapper,
    dataTestId,
}: CommonUILayoutProps) => (
    <BaseLayoutWithFlow
        heading={<Translation id="TR_USED_TREZOR_BEFORE" />}
        secondaryButtonLabel={<Translation id="TR_I_HAVE_NOT_USED_IT" />}
        supportUrl={TREZOR_SUPPORT_FW_ALREADY_INSTALLED}
        checklistItems={firmwareInstalledChecklist}
        primaryButton={
            <PrimaryButtonWrapper>
                <SecurityCheckButton
                    data-testid={dataTestId}
                    onClick={onPrimaryButtonClick}
                    intent="brand"
                >
                    <Translation id="TR_YES_CONTINUE" />
                </SecurityCheckButton>
            </PrimaryButtonWrapper>
        }
    />
);

const TakesManyMinutesTooltip = ({ children }: PropsWithChildren) => {
    const isVerticalLayout = useIsContentBelowBreakpoint(breakpoints.tablet);

    return (
        <Tooltip
            content={
                <Note icon={ClockIcon}>
                    <Translation id="TR_TAKES_N_MINUTES" />
                </Note>
            }
            placement="bottom"
            width={isVerticalLayout ? '100%' : undefined}
        >
            {children}
        </Tooltip>
    );
};

/**
 * Manual Device Check for an uninitialized device, which starts the onboarding flow.
 */
export const UninitializedManualDeviceCheck = () => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const recoveryStatus = useSelector(selectRecoveryStatus);
    const device = useSelector(selectSelectedDevice);
    const deviceId = device?.id;
    const deviceModel = device?.features?.internal_model || DeviceModelInternal.UNKNOWN;
    const isOnboardingActive = useSelector(selectIsOnboardingActive);

    const { goToNextStep, rerun, updateAnalytics } = useOnboarding();

    const isRecoveryInProgress = recoveryStatus === 'in-progress';
    const isFirmwareInstalled = device?.firmware !== 'none';

    // Start measuring onboarding duration. In case of an ongoing recovery, the timer is started in middleware.
    useEffect(() => {
        if (!isRecoveryInProgress) {
            updateAnalytics({
                startTime: Date.now(),
            });
        }
    }, [isRecoveryInProgress, updateAnalytics]);

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

    const UILayoutComponent = isFirmwareInstalled ? UILayoutWithFirmware : UILayoutWithoutFirmware;

    return (
        <UILayoutComponent
            onPrimaryButtonClick={handleSetupButtonClick}
            PrimaryButtonWrapper={TakesManyMinutesTooltip}
            dataTestId="@onboarding/device-check/setup-button"
        />
    );
};

type InitializedManualDeviceCheckProps = {
    onSuccess: () => void;
};

/**
 * Manual Device Check for an already initialized device, which is simply dismissed on success.
 */
export const InitializedManualDeviceCheck = ({ onSuccess }: InitializedManualDeviceCheckProps) => {
    const { dispatch } = useServices(injectDispatch);
    const device = useSelector(selectSelectedDevice);
    const deviceId = device?.id;

    const handleContinueButtonClick = () => {
        dispatch(persistentDeviceDataActions.setManualDeviceCheckSuccess({ deviceId }));
        onSuccess();
    };

    return (
        <UILayoutWithFirmware
            onPrimaryButtonClick={handleContinueButtonClick}
            PrimaryButtonWrapper={({ children }: PropsWithChildren) => children}
            dataTestId="@onboarding/complete-onboarding"
        />
    );
};

type ManualDeviceCheckProps = { onSuccess: () => void };

// TODO this will be removed in subsequent refactoring, but in this commit, it works just like before!
export const ManualDeviceCheck = ({ onSuccess }: ManualDeviceCheckProps) => {
    const device = useSelector(selectSelectedDevice);

    const initialized = !!device?.features?.initialized;

    return initialized ? (
        <InitializedManualDeviceCheck onSuccess={onSuccess} />
    ) : (
        <UninitializedManualDeviceCheck />
    );
};
