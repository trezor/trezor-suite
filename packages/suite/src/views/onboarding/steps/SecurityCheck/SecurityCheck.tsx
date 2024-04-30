import { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';

import { getConnectedDeviceStatus } from '@suite-common/suite-utils';
import { selectDevice } from '@suite-common/wallet-core';
import { Icon, Tooltip, variables, H2, useElevation } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useLayoutSize, useOnboarding, useSelector } from 'src/hooks/suite';
import { Translation, TrezorLink } from 'src/components/suite';
import { Hologram, OnboardingButtonSkip } from 'src/components/onboarding';
import { CollapsibleOnboardingCard } from 'src/components/onboarding/CollapsibleOnboardingCard';
import { SecurityCheckLayout } from './SecurityCheckLayout';
import { SecurityChecklist } from './SecurityChecklist';
import { SecurityCheckFail } from './SecurityCheckFail';
import { SecurityCheckButton } from './SecurityCheckButton';
import { DeviceAuthenticity } from './DeviceAuthenticity';
import { selectIsOnboadingActive } from 'src/reducers/onboarding/onboardingReducer';
import { Elevation, mapElevationToBorder, typography } from '@trezor/theme';
import { selectSuiteFlags } from '../../../../reducers/suite/suiteReducer';
import { TREZOR_RESELLERS_URL, TREZOR_URL } from '@trezor/urls';

const StyledCard = styled(CollapsibleOnboardingCard)`
    max-width: 840px;
    padding: 16px;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;

const DeviceNameSection = styled.div<{ $elevation: Elevation }>`
    border-bottom: 1px solid ${mapElevationToBorder};
    margin-top: 8px;
    padding-bottom: 24px;
    width: 100%;
`;

const DeviceName = styled.div`
    ${typography.titleMedium}
    color: ${({ theme }) => theme.backgroundPrimaryDefault};
    margin-top: 12px;
`;

const StyledH2 = styled(H2)`
    font-size: 28px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin: 24px 0 0;
`;

const Underline = styled.span`
    position: relative;
    display: inline-block;

    &::after {
        content: '';
        position: absolute;
        bottom: 4px;
        left: 0;
        right: 0;
        border-bottom: 1px dashed ${({ theme }) => theme.TYPE_LIGHT_GREY};
        width: 100%;
    }
`;

const TimeEstimateWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0.66;
    margin-top: 1px;
`;

const IconWrapper = styled.div`
    margin: 0 1px 2px 6px;
`;

const Buttons = styled.div<{ $elevation: Elevation }>`
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    justify-content: space-between;
    padding-top: 24px;
    border-top: 2px solid ${mapElevationToBorder};
    width: 100%;
`;

const StyledSecurityCheckButton = styled(SecurityCheckButton)`
    flex-grow: 1;
`;

const SecurityCheckButtonWithSecondLine = styled(StyledSecurityCheckButton)`
    flex-direction: column;
`;

const Text = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledTrezorLink = styled(TrezorLink)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const StyledTooltip = styled(Tooltip)`
    display: inline-block;
`;

const firmwareInstalledChecklist = [
    {
        icon: 'INFO' as const,
        content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_4" />,
    },
];

const getNoFirmwareChecklist = (isMobileLayout: boolean) => [
    {
        icon: 'VERIFIED' as const,
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
        icon: 'HOLOGRAM' as const,
        content: (
            <Translation
                id="TR_ONBOARDING_DEVICE_CHECK_1"
                values={{
                    strong: chunks => (
                        <StyledTooltip
                            placement={isMobileLayout ? 'top' : 'left'}
                            title={<Translation id="TR_HOLOGRAM_STEP_HEADING" />}
                            content={<Hologram />}
                        >
                            <Underline>{chunks}</Underline>
                        </StyledTooltip>
                    ),
                }}
            />
        ),
    },
    {
        icon: 'PACKAGE' as const,
        content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_3" />,
    },
];

export const SecurityCheckContent = ({
    goToDeviceAuthentication,
    isAuthenticityCheckSupported,
}: {
    goToDeviceAuthentication: () => void;
    isAuthenticityCheckSupported: boolean;
}) => {
    const { isMobileLayout } = useLayoutSize();
    const recovery = useSelector(state => state.recovery);
    const device = useSelector(selectDevice);
    const { initialRun } = useSelector(selectSuiteFlags);
    const {
        isDeviceAuthenticityCheckDisabled,
        debug: { isUnlockedBootloaderAllowed },
    } = useSelector(state => state.suite.settings);
    const isOnboardingActive = useSelector(selectIsOnboadingActive);

    const [isFailed, setIsFailed] = useState(false);

    const { goToNextStep, goToSuite, rerun, updateAnalytics } = useOnboarding();
    const theme = useTheme();
    const dispatch = useDispatch();

    const { elevation } = useElevation();

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

    const isDeviceAuthenticationNeeded =
        device !== undefined &&
        isAuthenticityCheckSupported &&
        initialRun &&
        !isDeviceAuthenticityCheckDisabled &&
        (!isUnlockedBootloaderAllowed || device.features?.bootloader_locked !== false);

    const handleContinueButtonClick = () =>
        isDeviceAuthenticationNeeded ? goToDeviceAuthentication() : goToSuite();

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
        <SecurityCheckFail goBack={toggleView} />
    ) : (
        <SecurityCheckLayout>
            <Content>
                <DeviceNameSection $elevation={elevation}>
                    <Text>
                        <Translation id="TR_YOU_HAVE_CONNECTED" />
                    </Text>
                    <DeviceName>{device?.name}</DeviceName>
                    <OnboardingButtonSkip onClick={toggleView}>
                        <Translation id="TR_CONNECTED_DIFFERENT_DEVICE" />
                    </OnboardingButtonSkip>
                </DeviceNameSection>
                <StyledH2>
                    <Translation id={headingText} />
                </StyledH2>
                <SecurityChecklist items={checklistItems} />
            </Content>
            <Buttons $elevation={elevation}>
                <StyledSecurityCheckButton variant="tertiary" onClick={toggleView}>
                    <Translation id={secondaryButtonText} />
                </StyledSecurityCheckButton>
                {initialized ? (
                    <StyledSecurityCheckButton
                        data-test="@onboarding/exit-app-button"
                        onClick={handleContinueButtonClick}
                    >
                        <Translation id="TR_YES_CONTINUE" />
                    </StyledSecurityCheckButton>
                ) : (
                    <SecurityCheckButtonWithSecondLine
                        onClick={handleSetupButtonClick}
                        data-test="@analytics/continue-button"
                    >
                        <Translation id={primaryButtonTopText} />
                        <TimeEstimateWrapper>
                            <IconWrapper>
                                <Icon size={12} icon="CLOCK_ACTIVE" color={theme.iconOnPrimary} />
                            </IconWrapper>
                            <Translation id="TR_TAKES_N_MINUTES" />
                        </TimeEstimateWrapper>
                    </SecurityCheckButtonWithSecondLine>
                )}
            </Buttons>
        </SecurityCheckLayout>
    );
};

export const SecurityCheck = () => {
    const device = useSelector(selectDevice);

    const [isDeviceAuthenticityCheck, setIsDeviceAuthenticityCheck] = useState(false);

    const isAuthenticityCheckSupported = ![
        DeviceModelInternal.T1B1,
        DeviceModelInternal.T2T1,
    ].includes(device?.features?.internal_model || DeviceModelInternal.T1B1);

    // Edge case:
    // Devices A and B are connected, only device A supports authenticity check.
    // Device A disconnects while on the first screen of the check.
    useEffect(() => {
        if (!isAuthenticityCheckSupported) {
            setIsDeviceAuthenticityCheck(false);
        }
    }, [isAuthenticityCheckSupported]);

    if (isDeviceAuthenticityCheck) {
        return <DeviceAuthenticity />;
    }

    const goToDeviceAuthentication = () => setIsDeviceAuthenticityCheck(true);

    return (
        <StyledCard>
            <SecurityCheckContent
                goToDeviceAuthentication={goToDeviceAuthentication}
                isAuthenticityCheckSupported={isAuthenticityCheckSupported}
            />
        </StyledCard>
    );
};
