import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Link, P, Prompt } from '@trezor/components';
import { CSSTransition } from 'react-transition-group';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { isDev } from '@suite-utils/build';

import BaseStyles from '@suite/support/onboarding/BaseStyles';

import { OnboardingActions } from '@onboarding-types/onboarding';
import { ConnectActions } from '@onboarding-types/connect';
import { AnyStepId, AnyStepDisallowedState, Step } from '@onboarding-types/steps';
import { AnyEvent } from '@onboarding-types/events';

import * as EVENTS from '@suite/actions/onboarding/constants/events';

import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import * as connectActions from '@suite/actions/onboarding/connectActions';

import * as STEP from '@suite/constants/onboarding/steps';
import { STEP_ANIMATION_DURATION } from '@suite/constants/onboarding/constants';
import steps from '@suite/config/onboarding/steps';

import colors from '@suite/config/onboarding/colors';
import { SM } from '@suite/config/onboarding/breakpoints';
import { TOS_URL } from '@suite/constants/onboarding/urls';

import {
    PROGRESSBAR_HEIGHT,
    PROGRESSBAR_HEIGHT_UNIT,
    STEP_HEIGHT,
    STEP_HEIGHT_UNIT,
    NAVBAR_HEIGHT,
    NAVBAR_HEIGHT_UNIT,
} from '@suite/config/onboarding/layout';

import ProgressSteps from '@suite/components/onboarding/ProgressSteps';
import UnexpectedState from '@suite/components/onboarding/UnexpectedState';

import { resolveStaticPath } from '@suite-utils/nextjs';
import { getFnForRule } from '@suite/utils/onboarding/rules';

import WelcomeStep from '@onboarding-views/steps/Welcome/Container';
import NewOrUsedStep from '@onboarding-views/steps/NewOrUsed/Container';
import SelectDeviceStep from '@onboarding-views/steps/SelectDevice/Container';
import HologramStep from '@onboarding-views/steps/Hologram/Container';
import BridgeStep from '@onboarding-views/steps/Bridge/Container';
import ConnectStep from '@onboarding-views/steps/Connect/Container';
import FirmwareStep from '@onboarding-views/steps/Firmware/Container';
import ShamirStep from '@onboarding-views/steps/Shamir/Container';
import RecoveryStep from '@onboarding-views/steps/Recovery/Container';
import BackupStep from '@onboarding-views/steps/Backup/Container';
import SecurityStep from '@onboarding-views/steps/Security/Container';
import SetPinStep from '@onboarding-views/steps/Pin/Container';
import NameStep from '@onboarding-views/steps/Name/Container';
import BookmarkStep from '@onboarding-views/steps/Bookmark/Container';
import NewsletterStep from '@onboarding-views/steps/Newsletter/Container';
import FinalStep from '@onboarding-views/steps/Final';

import { AppState, Dispatch } from '@suite-types';

const BORDER_RADIUS = 12;
const TRANSITION_PROPS = {
    timeout: STEP_ANIMATION_DURATION,
    classNames: 'step-transition',
    unmountOnExit: true,
};

const backgroundAnimation = keyframes`
    0% { opacity: 0 }
    100% { opacity: 1 }
`;

interface WrapperOutsideProps extends React.HTMLAttributes<HTMLDivElement> {
    animate: boolean;
}

const WrapperOutside = styled.div<WrapperOutsideProps>`
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: calc(100vh - ${`${NAVBAR_HEIGHT}${NAVBAR_HEIGHT_UNIT}`});
    max-width: 100vw;
    width: 100%;
    overflow-x: hidden;

    @media only screen and (min-width: ${SM}px) {
        height: 100%;

        ${props =>
            props.animate &&
            css`
                animation: ${backgroundAnimation} 1s linear;
                background-image: url(${resolveStaticPath('images/onboarding/background.jpg')});
                background-size: cover;
            `};
    }
`;

interface WrapperInsideProps extends React.HTMLAttributes<HTMLDivElement> {
    isGlobalInteraction: boolean;
}

const WrapperInside = styled.div<WrapperInsideProps>`
    position: relative;
    display: flex;
    flex-direction: column;
    background-color: ${colors.white};
    border-radius: ${BORDER_RADIUS}px;
    z-index: 0;
    max-height: ${({ isGlobalInteraction }) =>
        isGlobalInteraction
            ? `calc(100vh - ${PROGRESSBAR_HEIGHT}${PROGRESSBAR_HEIGHT_UNIT} - ${NAVBAR_HEIGHT}${NAVBAR_HEIGHT_UNIT})`
            : 'none'};

    @media only screen and (min-width: ${SM}px) {
        width: calc(55vw + 150px);
        margin: 50px auto;
        overflow: hidden;
        height: 70%;
    }
`;

const ProgressStepsSlot = styled.div`
    height: ${`${PROGRESSBAR_HEIGHT}${PROGRESSBAR_HEIGHT_UNIT}`};
`;

const ComponentWrapper = styled.div`
    display: flex;
    min-height: ${`${STEP_HEIGHT}${STEP_HEIGHT_UNIT}`};
`;

const TrezorActionOverlay = styled.div`
    position: absolute;
    margin-top: auto;
    margin-bottom: auto;
    width: 100%;
    height: calc(
        ${`100vh - ${PROGRESSBAR_HEIGHT}${PROGRESSBAR_HEIGHT_UNIT} - ${NAVBAR_HEIGHT}${NAVBAR_HEIGHT_UNIT}`}
    );
    display: flex;
    justify-content: center;
    background-color: ${colors.white};
    z-index: 405;
    border-radius: ${BORDER_RADIUS}px;
`;

const TrezorAction = ({ model, event }: { model: 1 | 2; event: AnyEvent }) => {
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
        <TrezorActionOverlay>
            <Prompt model={model} size={100}>
                <TrezorActionText />
            </Prompt>
        </TrezorActionOverlay>
    );
};

const UnexpectedStateOverlay = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: ${colors.white};
    z-index: 405;
    display: flex;
`;

interface Props {
    device: any; // todo

    activeStepId: AppState['onboarding']['activeStepId'];
    selectedModel: AppState['onboarding']['selectedModel'];
    path: AppState['onboarding']['path'];

    deviceCall: AppState['onboarding']['connect']['deviceCall'];
    uiInteraction: AppState['onboarding']['connect']['uiInteraction'];
    deviceInteraction: AppState['onboarding']['connect']['deviceInteraction'];
    prevDeviceId: AppState['onboarding']['connect']['prevDeviceId'];

    connectActions: ConnectActions;
    onboardingActions: OnboardingActions;
}

class Onboarding extends React.PureComponent<Props> {
    componentDidMount() {
        // todo: should be only for web
        if (!isDev()) {
            window.onbeforeunload = () => {
                if (this.props.activeStepId !== STEP.ID_FINAL_STEP) {
                    return 'Are you sure want to leave onboarding without saving?';
                }
                return null;
            };
        }
    }

    getStep(activeStepId: AppState['onboarding']['activeStepId']): Step {
        const lookup = steps.find((step: Step) => step.id === activeStepId);
        // todo: is there a better way how to solve lookup completeness with typescript?
        if (!lookup) {
            throw new TypeError('step not found by step id. unexepected.');
        }
        return lookup;
    }

    getScreen() {
        return this.props.activeStepId;
    }

    getError() {
        const { device, prevDeviceId, activeStepId, path } = this.props;
        const activeStep = this.getStep(activeStepId);
        if (!activeStep.disallowedDeviceStates) {
            return null;
        }

        return activeStep.disallowedDeviceStates.find((state: AnyStepDisallowedState) => {
            const fn = getFnForRule(state);
            return fn({ device, prevDeviceId, path });
        });
    }

    isGlobalInteraction() {
        const { deviceInteraction, deviceCall } = this.props;
        // if (deviceCall.name === RECOVER_DEVICE )
        const globals = [
            EVENTS.BUTTON_REQUEST__PROTECT_CALL,
            EVENTS.BUTTON_REQUEST__WIPE_DEVICE,
            EVENTS.BUTTON_REQUEST__RESET_DEVICE,
            EVENTS.BUTTON_REQUEST__MNEMONIC_WORD_COUNT,
            EVENTS.BUTTON_REQUEST__MNEMONIC_INPUT,
            EVENTS.BUTTON_REQUEST__OTHER,
        ];
        return globals.includes(deviceInteraction.name) && deviceCall.isProgress;
    }

    // todo: reconsider if we need resolved logic.
    isStepResolved(stepId: AnyStepId) {
        return Boolean(steps.find((step: Step) => step.id === stepId)!.resolved);
    }

    render() {
        const {
            onboardingActions,
            connectActions,

            selectedModel,
            activeStepId,

            deviceCall,
            deviceInteraction,
            uiInteraction,
        } = this.props;
        const model = selectedModel || (2 as 1 | 2);
        const errorState = this.getError();
        const activeStep = this.getStep(activeStepId);
        return (
            <>
                <BaseStyles />
                <WrapperOutside
                    animate={![STEP.ID_WELCOME_STEP, STEP.ID_FINAL_STEP].includes(activeStepId)}
                >
                    <WrapperInside isGlobalInteraction={this.isGlobalInteraction()}>
                        {errorState && (
                            <UnexpectedStateOverlay>
                                <UnexpectedState
                                    caseType={errorState}
                                    model={model}
                                    connectActions={connectActions}
                                    onboardingActions={onboardingActions}
                                    uiInteraction={uiInteraction}
                                />
                            </UnexpectedStateOverlay>
                        )}
                        <ProgressStepsSlot>
                            <ProgressSteps
                                hiddenOnSteps={[
                                    STEP.ID_WELCOME_STEP,
                                    STEP.ID_SECURITY_STEP,
                                    STEP.ID_FINAL_STEP,
                                ]}
                                steps={steps}
                                activeStep={activeStep}
                                onboardingActions={onboardingActions}
                                isDisabled={deviceCall.isProgress}
                            />
                        </ProgressStepsSlot>
                        <ComponentWrapper>
                            {this.isGlobalInteraction() && (
                                <TrezorAction model={model} event={deviceInteraction.name} />
                            )}

                            <CSSTransition
                                in={activeStepId === STEP.ID_WELCOME_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <WelcomeStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_NEW_OR_USED}
                                {...TRANSITION_PROPS}
                            >
                                <NewOrUsedStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_SELECT_DEVICE_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <SelectDeviceStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_UNBOXING_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <HologramStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_BRIDGE_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <BridgeStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_CONNECT_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <ConnectStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_FIRMWARE_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <FirmwareStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_SHAMIR_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <ShamirStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_RECOVERY_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <RecoveryStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_SECURITY_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <SecurityStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_BACKUP_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <BackupStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_SET_PIN_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <SetPinStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_NAME_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <NameStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_NEWSLETTER_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <NewsletterStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_BOOKMARK_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <BookmarkStep />
                            </CSSTransition>

                            <CSSTransition
                                in={activeStepId === STEP.ID_FINAL_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <FinalStep />
                            </CSSTransition>
                        </ComponentWrapper>
                    </WrapperInside>
                </WrapperOutside>
            </>
        );
    }
}

const mapStateToProps = (state: AppState) => {
    return {
        device: state.onboarding.connect.device,

        // connect reducer
        prevDeviceId: state.onboarding.connect.prevDeviceId,
        deviceCall: state.onboarding.connect.deviceCall,
        deviceInteraction: state.onboarding.connect.deviceInteraction,
        uiInteraction: state.onboarding.connect.uiInteraction,

        // onboarding reducer
        selectedModel: state.onboarding.selectedModel,
        activeStepId: state.onboarding.activeStepId,
        path: state.onboarding.path,
    };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: bindActionCreators(onboardingActions, dispatch),
    connectActions: bindActionCreators(connectActions, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Onboarding);
