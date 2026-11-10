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
import { selectIsDebugModeActive } from '@suite/debug';
import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { selectRecoveryStatus } from '@suite/recovery';
import { gotoThunk } from '@suite/router';
import { selectDeviceModel, selectSelectedDevice } from '@suite-common/device';
import { HAS_BRANDED_PLASTIC_WRAP_PACKAGING } from '@suite-common/device-authenticity';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { Column, H3, Icon, Note, Paragraph, Text, TextButton, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { DeviceModelInternal, models } from '@trezor/device-utils';
import {
    ClockIcon,
    PackageIcon,
    QuestionFilledIcon,
    SealCheckIcon,
    StickerIcon,
    TrezorBodyIcon,
} from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import { breakpoints } from '@trezor/theme';
import {
    TREZOR_RESELLERS_URL,
    TREZOR_SUPPORT_FW_ALREADY_INSTALLED,
    TREZOR_SUPPORT_IS_MY_DEVICE_SAFE,
    TREZOR_URL,
    type Url,
} from '@trezor/urls';

import { Hologram } from '#src/components/onboarding/Hologram';
import { useLayoutSize, useOnboarding } from '#src/hooks/suite';
import { selectIsOnboardingActive } from '#src/reducers/onboarding/onboardingReducer';
import { ContentFlex, useIsContentBelowBreakpoint } from '#src/support/suite/ContentFlex';

import { SecurityCheckButton } from './components/SecurityCheckButton';
import { SecurityCheckFail } from './components/SecurityCheckFail';
import { SecurityCheckLayout } from './components/SecurityCheckLayout';
import { SecurityConfirmationChecklist } from './components/SecurityConfirmationChecklist';
import { ContactSupport } from './components/ctas';
import { type SecurityConfirmationItem } from './types';

/*
ABOUT THIS FILE:

The component structure in this file may seem confusing at first, but it has its reason: a device
can undergo a Manual Device Check in three distinct cases:
  A) uninitialized device without FW (fresh or factory-reset)
  B) uninitialized device with FW (after a wipe or partial onboarding)
  C) initialized device with FW, which hasn't been confirmed yet

Of course, an initialized device without FW is impossible (just for completness).

There are two different behaviors: uninitialized goes to onboarding, initialized goes to suite,
and two different UIs: a routine fresh device check, and more suspicious check if the device already has FW.
  exception: a tooltip estimating how long does the onboarding take – that's a UI feature, but it's split along the initialized axis (related to onboarding).
The complexity is there because of the overlap:
  A) shows routine check UI, goes to onboarding.
  B) shows suspicious UI, goes to onboarding.
  C) shows suspicious UI, goes to suite.
*/

type CommonManualDeviceCheckProps = { onSuccess: () => void };

const firmwareInstalledConfirmationItems = [
    {
        id: 'used-before',
        icon: SealCheckIcon,
        content: <Translation id="TR_ONBOARDING_SECURITY_CHECK_USED_BEFORE" />,
    },
] as const satisfies SecurityConfirmationItem[];

const getNoFirmwareConfirmationItems = (isBelowTablet: boolean, hasBrandedPlasticWrap: boolean) =>
    [
        {
            id: 'shop',
            icon: SealCheckIcon,
            content: (
                <Translation
                    id="TR_ONBOARDING_SECURITY_CHECK_SHOP"
                    values={{
                        reseller: link => (
                            <TrezorLink href={TREZOR_RESELLERS_URL}>{link}</TrezorLink>
                        ),
                        shop: link => <TrezorLink href={TREZOR_URL}>{link}</TrezorLink>,
                    }}
                />
            ),
        },
        ...(hasBrandedPlasticWrap
            ? [
                  {
                      id: 'plastic-wrap',
                      icon: StickerIcon,
                      content: <Translation id="TR_ONBOARDING_SECURITY_CHECK_PLASTIC_WRAP" />,
                  } as const,
              ]
            : []),
        {
            id: 'package',
            icon: PackageIcon,
            content: <Translation id="TR_ONBOARDING_SECURITY_CHECK_PACKAGE" />,
        },
        {
            id: 'hologram',
            icon: TrezorBodyIcon,
            content: (
                <Translation
                    id="TR_ONBOARDING_SECURITY_CHECK_HOLOGRAM"
                    values={{
                        hologram: chunks => (
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
                            >
                                <u>{chunks}</u>
                                <Icon as={QuestionFilledIcon} size={16} />
                            </Tooltip>
                        ),
                    }}
                />
            ),
        },
    ] as const satisfies SecurityConfirmationItem[];

type CommonUILayoutProps = {
    onPrimaryButtonClick: () => void;
    PrimaryButtonWrapper: FC<PropsWithChildren>;
    dataTestId: string;
};

type BaseLayoutWithFlowProps = CommonUILayoutProps & {
    heading: ReactNode;
    description?: ReactNode;
    secondaryButtonLabel: ReactNode;
    supportUrl: Url;
    confirmationItems: readonly SecurityConfirmationItem[];
    confirmationTooltip: ReactNode;
    primaryButtonLabel: ReactNode;
};

/**
 * Basic layout supporting both UI variants, which also implements the fully reversible check failure flow.
 * The "failed" step has always the same UI.
 */
const BaseLayoutWithFlow = ({
    heading,
    description,
    secondaryButtonLabel,
    supportUrl,
    confirmationItems,
    confirmationTooltip,
    primaryButtonLabel,
    onPrimaryButtonClick,
    PrimaryButtonWrapper,
    dataTestId,
}: BaseLayoutWithFlowProps) => {
    const device = useSelector(selectSelectedDevice);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const [isFailed, setIsFailed] = useState(false);
    const [confirmedItemIds, setConfirmedItemIds] = useState<string[]>([]);
    const isVerticalLayout = useIsContentBelowBreakpoint(breakpoints.tablet);

    // Note: no need to persist failure, there are no details worth persisting, so we are persisting only explicit success or nothing.
    const handleRejectDevice = () => setIsFailed(true);
    const handleUndoRejectDevice = () => setIsFailed(false);

    const handleToggleItem = (id: string) =>
        setConfirmedItemIds(ids =>
            ids.includes(id) ? ids.filter(confirmedId => confirmedId !== id) : [...ids, id],
        );

    const humanizedModelColor = useMemo(
        () =>
            device?.features?.internal_model && device?.features?.unit_color
                ? models[device?.features?.internal_model]?.colors?.[device?.features?.unit_color]
                : null,
        [device],
    );

    const isConfirmed =
        isDebugModeActive || confirmationItems.every(item => confirmedItemIds.includes(item.id));

    const primaryButton = (
        <SecurityCheckButton
            onClick={onPrimaryButtonClick}
            data-testid={dataTestId}
            intent="brand"
            isDisabled={!isConfirmed}
        >
            {primaryButtonLabel}
        </SecurityCheckButton>
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
            <Column gap={4}>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_YOU_HAVE_CONNECTED" />
                </Paragraph>
                <Paragraph typographyStyle="headline-md">
                    {device?.name}
                    {humanizedModelColor && <Text> {humanizedModelColor}</Text>}
                </Paragraph>
                <TextButton
                    intent="neutral"
                    priority="secondary"
                    size="large"
                    isUnderlined
                    onClick={handleRejectDevice}
                >
                    <Translation id="TR_CONNECTED_DIFFERENT_DEVICE" />
                </TextButton>
            </Column>
            <Column gap={16} margin={{ top: 32 }}>
                <Column gap={4}>
                    <H3>{heading}</H3>
                    {description && (
                        <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                            {description}
                        </Paragraph>
                    )}
                </Column>
                <SecurityConfirmationChecklist
                    items={confirmationItems}
                    confirmedItemIds={confirmedItemIds}
                    onToggle={handleToggleItem}
                />
            </Column>
            <ContentFlex
                breakpoint={breakpoints.tablet}
                alignItems="center"
                gap={16}
                margin={{ top: 32 }}
            >
                <SecurityCheckButton
                    intent="neutral"
                    priority="secondary"
                    onClick={handleRejectDevice}
                >
                    {secondaryButtonLabel}
                </SecurityCheckButton>
                {isConfirmed ? (
                    <PrimaryButtonWrapper>{primaryButton}</PrimaryButtonWrapper>
                ) : (
                    <Tooltip
                        content={confirmationTooltip}
                        placement="bottom"
                        width={isVerticalLayout ? '100%' : undefined}
                    >
                        {primaryButton}
                    </Tooltip>
                )}
            </ContentFlex>
        </SecurityCheckLayout>
    );
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
    const deviceModel = useSelector(selectDeviceModel) ?? DeviceModelInternal.UNKNOWN;

    return (
        <BaseLayoutWithFlow
            heading={<Translation id="TR_ONBOARDING_SECURITY_CHECK" />}
            secondaryButtonLabel={<Translation id="TR_I_HAVE_DOUBTS" />}
            supportUrl={TREZOR_SUPPORT_IS_MY_DEVICE_SAFE}
            confirmationItems={getNoFirmwareConfirmationItems(
                isBelowTablet,
                HAS_BRANDED_PLASTIC_WRAP_PACKAGING[deviceModel],
            )}
            confirmationTooltip={<Translation id="TR_ONBOARDING_SECURITY_CHECK_CONFIRM_TOOLTIP" />}
            primaryButtonLabel={<Translation id="TR_SETUP_MY_TREZOR" />}
            onPrimaryButtonClick={onPrimaryButtonClick}
            PrimaryButtonWrapper={PrimaryButtonWrapper}
            dataTestId={dataTestId}
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
        description={<Translation id="TR_ONBOARDING_SECURITY_CHECK_FIRMWARE_INSTALLED" />}
        secondaryButtonLabel={<Translation id="TR_I_HAVE_DOUBTS" />}
        supportUrl={TREZOR_SUPPORT_FW_ALREADY_INSTALLED}
        confirmationItems={firmwareInstalledConfirmationItems}
        confirmationTooltip={
            <Translation id="TR_ONBOARDING_SECURITY_CHECK_FIRMWARE_CONFIRM_TOOLTIP" />
        }
        primaryButtonLabel={<Translation id="TR_CONTINUE" />}
        onPrimaryButtonClick={onPrimaryButtonClick}
        PrimaryButtonWrapper={PrimaryButtonWrapper}
        dataTestId={dataTestId}
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
const UninitializedManualDeviceCheck = ({ onSuccess }: CommonManualDeviceCheckProps) => {
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
        onSuccess();
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
            dispatch(gotoThunk({ routeName: 'onboarding-index' }));
        } else {
            dispatch(gotoThunk({ routeName: 'onboarding-index' }));
        }
    };

    const UILayoutComponent = isFirmwareInstalled ? UILayoutWithFirmware : UILayoutWithoutFirmware;

    return (
        <UILayoutComponent
            key={device?.path}
            onPrimaryButtonClick={handleSetupButtonClick}
            PrimaryButtonWrapper={TakesManyMinutesTooltip}
            dataTestId="@onboarding/device-check/setup-button"
        />
    );
};

/**
 * Manual Device Check for an already initialized device, which is simply dismissed on success.
 */
const InitializedManualDeviceCheck = ({ onSuccess }: CommonManualDeviceCheckProps) => {
    const { dispatch } = useServices(injectDispatch);
    const device = useSelector(selectSelectedDevice);
    const deviceId = device?.id;

    const handleContinueButtonClick = () => {
        dispatch(persistentDeviceDataActions.setManualDeviceCheckSuccess({ deviceId }));
        onSuccess();
    };

    return (
        <UILayoutWithFirmware
            key={device?.path}
            onPrimaryButtonClick={handleContinueButtonClick}
            PrimaryButtonWrapper={({ children }: PropsWithChildren) => children}
            dataTestId="@onboarding/complete-onboarding"
        />
    );
};

/**
 * Manual Device Check either for uninitialized, or initialized device (see subcomponents for their different behaviors).
 */
export const ManualDeviceCheck = ({ onSuccess }: CommonManualDeviceCheckProps) => {
    const device = useSelector(selectSelectedDevice);

    const initialized = !!device?.features?.initialized;

    return initialized ? (
        <InitializedManualDeviceCheck onSuccess={onSuccess} />
    ) : (
        <UninitializedManualDeviceCheck onSuccess={onSuccess} />
    );
};
