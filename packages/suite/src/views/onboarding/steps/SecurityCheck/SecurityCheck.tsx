import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { getConnectedDeviceStatus } from '@suite-common/suite-utils';
import { selectDevice } from '@suite-common/wallet-core';
import { Icon, Tooltip, variables, useTheme, H1 } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';

import { useOnboarding, useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { Hologram, OnboardingButtonSkip } from 'src/components/onboarding';
import { CollapsibleOnboardingCard } from 'src/components/onboarding/CollapsibleOnboardingCard';
import { MAX_WIDTH } from 'src/constants/suite/layout';
import { SecurityCheckLayout } from './SecurityCheckLayout';
import { SecurityChecklist } from './SecurityChecklist';
import { SecurityCheckFail } from './SecurityCheckFail';
import { SecurityCheckButton } from './SecurityCheckButton';
import { DeviceAuthenticity } from './DeviceAuthenticity';

const StyledCard = styled(CollapsibleOnboardingCard)`
    max-width: ${MAX_WIDTH};
    padding: 16px;

    /* compensate top margin from WelcomeStep wrapper only for this card, because it has lot of content */
    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
        margin-top: -15vh;
    }

    @media all and (max-width: ${variables.SCREEN_SIZE.MD}) {
        margin-top: -20vh;
    }

    @media all and (max-height: ${variables.SCREEN_SIZE.MD}) {
        margin-top: -5vh;
    }
    @media all and (max-height: ${variables.SCREEN_SIZE.SM}) {
        margin-top: 0vh;
    }
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;

const DeviceNameSection = styled.div`
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin-top: 8px;
    padding-bottom: 24px;
    width: 100%;
`;

const DeviceName = styled.div`
    font-size: ${variables.FONT_SIZE.H1};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_GREEN};
    margin-top: 12px;
`;

const StyledH1 = styled(H1)`
    font-size: 28px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin: 24px 0 0 0;
`;

const Underline = styled.span`
    text-decoration: underline;
    text-decoration-style: dashed;
`;

const TimeEstimateWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0.66;
`;

const IconWrapper = styled.div`
    margin-right: 6px;
`;

const Buttons = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    justify-content: space-between;
    padding-top: 24px;
    border-top: 2px solid ${({ theme }) => theme.STROKE_GREY};
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

const StyledTooltip = styled(Tooltip)`
    display: inline-block;

    ${variables.SCREEN_QUERY.MOBILE} {
        pointer-events: none;

        span {
            text-decoration: none;
        }
    }
`;

const noFirmwareChecklist = [
    {
        icon: 'HOLOGRAM',
        content: (
            <Translation
                id="TR_ONBOARDING_DEVICE_CHECK_1"
                values={{
                    strong: chunks => (
                        <StyledTooltip placement="left" rich content={<Hologram />}>
                            <Underline>{chunks}</Underline>
                        </StyledTooltip>
                    ),
                }}
            />
        ),
    },
    {
        icon: 'VERIFIED',
        content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_2" />,
    },
    {
        icon: 'PACKAGE',
        content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_3" />,
    },
] as const;
const firmwareInstalledChecklist = [
    {
        icon: 'INFO',
        content: <Translation id="TR_ONBOARDING_DEVICE_CHECK_4" />,
    },
] as const;

export const SecurityCheck = () => {
    const { goToNextStep, goToSuite, rerun, updateAnalytics } = useOnboarding();
    const recovery = useSelector(state => state.recovery);
    const device = useSelector(selectDevice);
    const initialRun = useSelector(state => state.suite.flags.initialRun);
    const theme = useTheme();
    const [isFailed, setIsFailed] = useState(false);
    const [isDeviceAuthenticityCheck, setIsDeviceAuthenticityCheck] = useState(false);

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
    const checklistItems = isFirmwareInstalled ? firmwareInstalledChecklist : noFirmwareChecklist;

    const toggleView = () => setIsFailed(current => !current);
    const goToDeviceAuthentication = () => setIsDeviceAuthenticityCheck(true);
    const handleContinueButtonClick = () =>
        initialRun && device?.features?.internal_model === DeviceModelInternal.T2B1
            ? goToDeviceAuthentication()
            : goToSuite();
    const handleSetupButtonClick = () => (isRecoveryInProgress ? rerun() : goToNextStep());

    // Start measuring onboarding duration. In case of an ongoing recovery, the timer is started in middleware.
    useEffect(() => {
        if (!initialized && !isRecoveryInProgress) {
            updateAnalytics({
                startTime: Date.now(),
            });
        }
    }, [initialized, isRecoveryInProgress, updateAnalytics]);

    if (isDeviceAuthenticityCheck) {
        return <DeviceAuthenticity />;
    }

    return (
        <StyledCard>
            <SecurityCheckLayout>
                {isFailed ? (
                    <SecurityCheckFail goBack={toggleView} />
                ) : (
                    <>
                        <Content>
                            <DeviceNameSection>
                                <Text>
                                    <Translation id="TR_YOU_HAVE_CONNECTED" />
                                </Text>
                                <DeviceName>{device?.name}</DeviceName>
                                <OnboardingButtonSkip onClick={toggleView}>
                                    <Translation id="TR_CONNECTED_DIFFERENT_DEVICE" />
                                </OnboardingButtonSkip>
                            </DeviceNameSection>
                            <StyledH1>
                                <Translation id={headingText} />
                            </StyledH1>
                            <SecurityChecklist items={checklistItems} />
                        </Content>
                        <Buttons>
                            <StyledSecurityCheckButton variant="secondary" onClick={toggleView}>
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
                                            <Icon
                                                size={12}
                                                icon="CLOCK_ACTIVE"
                                                color={theme.TYPE_WHITE}
                                            />
                                        </IconWrapper>
                                        <Translation id="TR_TAKES_N_MINUTES" values={{ n: '5' }} />
                                    </TimeEstimateWrapper>
                                </SecurityCheckButtonWithSecondLine>
                            )}
                        </Buttons>
                    </>
                )}
            </SecurityCheckLayout>
        </StyledCard>
    );
};
