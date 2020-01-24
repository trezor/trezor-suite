import React from 'react';
import styled from 'styled-components';
import Head from 'next/head';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Prompt, variables } from '@trezor/components';
import { Link, P } from '@trezor/components-v2';
import { AnyStepDisallowedState, Step } from '@onboarding-types/steps';
import * as EVENTS from '@onboarding-actions/constants/events';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as connectActions from '@onboarding-actions/connectActions';
import * as STEP from '@onboarding-constants/steps';
import steps from '@onboarding-config/steps';
import colors from '@onboarding-config/colors';
import { TOS_URL } from '@suite-constants/urls';
import { STEP_HEIGHT, STEP_HEIGHT_UNIT } from '@onboarding-config/layout';
import { getFnForRule } from '@onboarding-utils/rules';

import WelcomeStep from '@onboarding-views/steps/Welcome/Container';
import CreateOrRecover from '@onboarding-views/steps/CreateOrRecover/Container';
import NewOrUsedStep from '@onboarding-views/steps/NewOrUsed/Container';
import SelectDeviceStep from '@onboarding-views/steps/SelectDevice/Container';
import HologramStep from '@onboarding-views/steps/Hologram/Container';
import PairStep from '@onboarding-views/steps/Pair/Container';
import FirmwareStep from '@onboarding-views/steps/Firmware/Container';
import ShamirStep from '@onboarding-views/steps/Shamir/Container';
import RecoveryStep from '@onboarding-views/steps/Recovery';
import BackupStep from '@onboarding-views/steps/Backup/Container';
import SecurityStep from '@onboarding-views/steps/Security/Container';
import SetPinStep from '@onboarding-views/steps/Pin/Container';
import NameStep from '@onboarding-views/steps/Name/Container';
import BookmarkStep from '@onboarding-views/steps/Bookmark/Container';
import NewsletterStep from '@onboarding-views/steps/Newsletter/Container';
import FinalStep from '@onboarding-views/steps/Final/Container';
import { UnexpectedState, ProgressBar } from '@onboarding-components';

import { AppState, Dispatch, InjectedModalApplicationProps } from '@suite-types';

const BORDER_RADIUS = 12;

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    width: 100%;
    overflow-x: hidden;
    padding-left: 40px;
    padding-right: 40px;
    max-width: 700px; /* neat boxed view */

    @media only screen and (min-width: ${variables.SCREEN_SIZE.SM}) {
        width: calc(55vw + 150px);
        margin: 10px auto;
        height: 80vh;
        overflow: hidden;
    }
`;

const Overlay = styled(Wrapper)`
    position: absolute;
    margin-top: auto;
    margin-bottom: auto;
    display: flex;
    justify-content: center;
    background-color: ${colors.white};
    z-index: 405;
    border-radius: ${BORDER_RADIUS}px;
`;

const ProgressBarSlot = styled.div`
    height: 80px;
`;

const ComponentWrapper = styled.div`
    display: flex;
    min-height: ${`${STEP_HEIGHT}${STEP_HEIGHT_UNIT}`};
`;

const TrezorAction = ({ model, event }: { model: number; event: string }) => {
    let TrezorActionText;
    if (event === EVENTS.BUTTON_REQUEST__RESET_DEVICE) {
        TrezorActionText = () => (
            <P>
                Complete action on your device. By clicking continue you agree with{' '}
                <Link target="_blank" href={TOS_URL}>
                    Terms of services
                </Link>
            </P>
        );
    } else {
        TrezorActionText = () => <P>Complete action on your device.</P>;
    }

    return (
        <Overlay data-test="@onboading/confirm-action-on-device">
            <Prompt model={model} size={100}>
                <TrezorActionText />
            </Prompt>
        </Overlay>
    );
};

const mapStateToProps = (state: AppState) => {
    return {
        device: state.suite.device,

        // connect reducer
        deviceCall: state.onboarding.deviceCall,
        // deviceInteraction: state.onboarding.connect.deviceInteraction,
        uiInteraction: state.onboarding.uiInteraction,

        // onboarding reducer
        prevDevice: state.onboarding.prevDevice,
        selectedModel: state.onboarding.selectedModel,
        activeStepId: state.onboarding.activeStepId,
        path: state.onboarding.path,
    };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: bindActionCreators(onboardingActions, dispatch),
    connectActions: bindActionCreators(connectActions, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    InjectedModalApplicationProps;

const Onboarding = (props: Props) => {
    const {
        selectedModel,
        activeStepId,

        deviceCall,
        uiInteraction,

        device,
        prevDevice,

        modal,
    } = props;

    const model =
        (device && device.features && device.features.major_version) || selectedModel || 2;

    const getStep = (activeStepId: AppState['onboarding']['activeStepId']) => {
        const lookup = steps.find((step: Step) => step.id === activeStepId);
        // todo: is there a better way how to solve lookup completeness with typescript?
        if (!lookup) {
            throw new TypeError('step not found by step id. unexepected.');
        }
        return lookup;
    };

    const getError = () => {
        const { device, prevDevice, activeStepId, path, uiInteraction } = props;
        const activeStep = getStep(activeStepId);
        if (!activeStep.disallowedDeviceStates) {
            return null;
        }

        return activeStep.disallowedDeviceStates.find((state: AnyStepDisallowedState) => {
            const fn = getFnForRule(state);
            return fn({ device, prevDevice, path, uiInteraction });
        });
    };

    const isGlobalInteraction = () => {
        const globals = [
            EVENTS.BUTTON_REQUEST__PROTECT_CALL,
            EVENTS.BUTTON_REQUEST__WIPE_DEVICE,
            EVENTS.BUTTON_REQUEST__RESET_DEVICE,
            EVENTS.BUTTON_REQUEST__MNEMONIC_WORD_COUNT,
            EVENTS.BUTTON_REQUEST__MNEMONIC_INPUT,
            EVENTS.BUTTON_REQUEST__OTHER,
            'ButtonRequest_RecoveryHomepage',
            'ButtonRequest_MnemonicWordCount',
        ];
        return !!(
            uiInteraction.name &&
            globals.includes(uiInteraction.name) &&
            deviceCall.isProgress
        );
    };

    const errorState = getError();

    const getStepComponent = () => {
        switch (activeStepId) {
            case STEP.ID_WELCOME_STEP:
                return WelcomeStep;
            case STEP.ID_CREATE_OR_RECOVER:
                return CreateOrRecover;
            case STEP.ID_NEW_OR_USED:
                return NewOrUsedStep;
            case STEP.ID_SELECT_DEVICE_STEP:
                return SelectDeviceStep;
            case STEP.ID_UNBOXING_STEP:
                return HologramStep;
            case STEP.ID_PAIR_DEVICE_STEP:
                return PairStep;
            case STEP.ID_FIRMWARE_STEP:
                return FirmwareStep;
            case STEP.ID_SHAMIR_STEP:
                return ShamirStep;
            case STEP.ID_RECOVERY_STEP:
                return RecoveryStep;
            case STEP.ID_SECURITY_STEP:
                return SecurityStep;
            case STEP.ID_BACKUP_STEP:
                return BackupStep;
            case STEP.ID_SET_PIN_STEP:
                return SetPinStep;
            case STEP.ID_NAME_STEP:
                return NameStep;
            case STEP.ID_NEWSLETTER_STEP:
                return NewsletterStep;
            case STEP.ID_BOOKMARK_STEP:
                return BookmarkStep;
            case STEP.ID_FINAL_STEP:
                return FinalStep;
            default:
                throw new Error('no corresponding component found');
        }
    };

    const StepComponent = getStepComponent();

    return (
        <Wrapper>
            <Head>
                <title>Onboarding | Trezor Suite</title>
            </Head>
            {errorState && (
                <Overlay>
                    <UnexpectedState
                        caseType={errorState}
                        prevModel={
                            (prevDevice &&
                                prevDevice.features &&
                                prevDevice.features.major_version) ||
                            2
                        }
                        uiInteraction={uiInteraction}
                    />
                </Overlay>
            )}
            <ProgressBarSlot>
                <ProgressBar activeStepId={activeStepId} />
            </ProgressBarSlot>
            <ComponentWrapper>
                {uiInteraction.name && isGlobalInteraction() && (
                    <TrezorAction model={model} event={uiInteraction.name} />
                )}

                <StepComponent modal={modal} />
            </ComponentWrapper>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Onboarding);
