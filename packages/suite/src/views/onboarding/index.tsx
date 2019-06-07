import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Link, P, Prompt } from '@trezor/components';
import { CSSTransition } from 'react-transition-group';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { isDev } from '@suite/utils/build';

import BaseStyles from '@suite/support/onboarding/BaseStyles';

import { OnboardingReducer, OnboardingActions } from '@suite/types/onboarding/onboarding';
import { ConnectReducer, ConnectActions } from '@suite/types/onboarding/connect';
import { FetchReducer, FetchActions } from '@suite/types/onboarding/fetch';
import { RecoveryReducer, RecoveryActions } from '@suite/types/onboarding/recovery';
import { NewsletterReducer, NewsletterActions } from '@suite/types/onboarding/newsletter';
import { AnyStepId, Step } from '@suite/types/onboarding/steps';
import { Dispatch } from '@suite/types/onboarding/actions';
import {
    FirmwareUpdateReducer,
    FirmwareUpdateActions,
} from '@suite/types/onboarding/firmwareUpdate';
import * as EVENTS from '@suite/actions/onboarding/constants/events';

import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import * as connectActions from '@suite/actions/onboarding/connectActions';
import * as fetchActions from '@suite/actions/onboarding/fetchActions';
import * as newsletterActions from '@suite/actions/onboarding/newsletterActions';
import * as firmwareUpdateActions from '@suite/actions/onboarding/firmwareUpdateActions';
import * as recoveryActions from '@suite/actions/onboarding/recoveryActions';

import * as STEP from '@suite/constants/onboarding/steps';
import { STEP_ANIMATION_DURATION } from '@suite/constants/onboarding/constants';

import colors from '@suite/config/onboarding/colors';
import { SM } from '@suite/config/onboarding/breakpoints';
import { TOS_URL } from '@suite/config/onboarding/urls';

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

import { getFnForRule } from '@suite/utils/onboarding/rules';

import WelcomeStep from '@suite/views/onboarding/steps/Welcome/Container';
import SelectDeviceStep from '@suite/views/onboarding/steps/SelectDevice/Container';
import HologramStep from '@suite/views/onboarding/steps/Hologram/Container';
import BridgeStep from '@suite/views/onboarding/steps/Bridge/Container';
import ConnectStep from '@suite/views/onboarding/steps/Connect/Container';
import FirmwareStep from '@suite/views/onboarding/steps/Firmware/Container';
import BackupStep from '@suite/views/onboarding/steps/Backup/Container';
import StartStep from '@suite/views/onboarding/steps/Start/Container';
import SecurityStep from '@suite/views/onboarding/steps/Security/Container';
import SetPinStep from '@suite/views/onboarding/steps/Pin/Container';
import NameStep from '@suite/views/onboarding/steps/Name/Container';

import BookmarkStep from '@suite/views/onboarding/steps/Bookmark/Container';

import FinalStep from '@suite/views/onboarding/steps/Final';
import NewsletterStep from '@suite/views/onboarding/steps/Newsletter';

import background from './background.jpg';

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
    flex-direction: column;
    /* min-height: calc(100vh - ${NAVBAR_HEIGHT} ${NAVBAR_HEIGHT_UNIT}); */
    max-width: 100vw;
    width: 100%;
    overflow-x: hidden;

    @media only screen and (min-width: ${SM}px) {
        height: 100%;

        ${props =>
            props.animate &&
            css`
                animation: ${backgroundAnimation} 1s linear;
            `};
        ${props =>
            props.animate &&
            css`
                background-image: url(${background});
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

const ProgressStepsWrapper = styled.div`
    display: flex;
    height: 100%;
    justify-content: center;
    align-items: center;
    border-bottom: 1px solid ${colors.grayLight};
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
    transport: any; // todo

    activeStepId: OnboardingReducer['activeStepId'];
    steps: OnboardingReducer['steps'];
    activeSubStep: OnboardingReducer['activeSubStep'];
    selectedModel: OnboardingReducer['selectedModel'];

    deviceCall: ConnectReducer['deviceCall'];
    uiInteraction: ConnectReducer['uiInteraction'];
    deviceInteraction: ConnectReducer['deviceInteraction'];
    connectError: ConnectReducer['connectError'];
    prevDeviceId: ConnectReducer['prevDeviceId'];

    newsletter: NewsletterReducer;
    fetchCall: FetchReducer;
    recovery: RecoveryReducer;
    firmwareUpdate: FirmwareUpdateReducer;

    recoveryActions: RecoveryActions;
    connectActions: ConnectActions;
    fetchActions: FetchActions;
    newsletterActions: NewsletterActions;
    onboardingActions: OnboardingActions;
    firmwareUpdateActions: FirmwareUpdateActions;
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

    getStep(activeStepId: OnboardingReducer['activeStepId']) {
        return this.props.steps.find(step => step.id === activeStepId);
    }

    getScreen() {
        return this.props.activeStepId;
    }

    handleErrors() {
        const { device, prevDeviceId, activeStepId, connectError, uiInteraction } = this.props;

        if (!this.getStep(activeStepId).disallowedDeviceStates) {
            return [];
        }

        const errorStates = [];
        this.getStep(activeStepId).disallowedDeviceStates.forEach(state => {
            const fn = getFnForRule(state);
            if (fn({ device, prevDeviceId, uiInteraction }) === true) {
                errorStates.push(state);
            }
        });
        return errorStates;
    }

    isGlobalInteraction() {
        const { deviceInteraction, deviceCall } = this.props;
        const globals = [
            EVENTS.BUTTON_REQUEST__PROTECT_CALL,
            EVENTS.BUTTON_REQUEST__WIPE_DEVICE,
            EVENTS.BUTTON_REQUEST__RESET_DEVICE,
            EVENTS.BUTTON_REQUEST__MNEMONIC_WORD_COUNT,
            EVENTS.BUTTON_REQUEST__MNEMONIC_INPUT,
            EVENTS.BUTTON_REQUEST__OTHER,
        ];
        return (
            deviceInteraction && globals.includes(deviceInteraction.name) && deviceCall.isProgress
        );
    }

    isStepResolved(stepId: AnyStepId) {
        return Boolean(this.props.steps.find((step: Step) => step.id === stepId).resolved);
    }

    render() {
        const {
            onboardingActions,
            connectActions,

            device,
            transport,

            // todo: Containerize some of the components
            selectedModel,
            activeStepId,
            activeSubStep,
            steps,

            deviceCall,
            deviceInteraction,
            uiInteraction,
        } = this.props;
        const model = selectedModel;

        const errorStates = this.handleErrors();

        // todo: wrap this up to separete component probably
        let TrezorActionText;
        if (activeStepId === STEP.ID_START_STEP) {
            // StartStep call require custom text
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
            <>
                <BaseStyles />

                <WrapperOutside
                    animate={![STEP.ID_WELCOME_STEP, STEP.ID_FINAL_STEP].includes(activeStepId)}
                >
                    <WrapperInside isGlobalInteraction={this.isGlobalInteraction()}>
                        {errorStates.length > 0 && (
                            <UnexpectedStateOverlay>
                                <UnexpectedState
                                    caseType={errorStates[0]}
                                    model={selectedModel}
                                    connectActions={connectActions}
                                    onboardingActions={onboardingActions}
                                    uiInteraction={uiInteraction}
                                />
                            </UnexpectedStateOverlay>
                        )}
                        <ProgressStepsSlot>
                            {this.getStep(activeStepId).title &&
                                this.getStep(activeStepId).title !== 'Basic setup' && (
                                    <ProgressStepsWrapper>
                                        <ProgressSteps
                                            steps={steps}
                                            activeStep={this.getStep(activeStepId)}
                                            onboardingActions={onboardingActions}
                                            isDisabled={deviceCall.isProgress}
                                        />
                                    </ProgressStepsWrapper>
                                )}
                        </ProgressStepsSlot>
                        <ComponentWrapper>
                            {this.isGlobalInteraction() && (
                                <TrezorActionOverlay>
                                    <Prompt model={selectedModel} size={100}>
                                        <TrezorActionText />
                                    </Prompt>
                                </TrezorActionOverlay>
                            )}

                            <CSSTransition
                                in={activeStepId === STEP.ID_WELCOME_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <WelcomeStep />
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
                                in={activeStepId === STEP.ID_START_STEP}
                                {...TRANSITION_PROPS}
                            >
                                <StartStep />
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

const mapStateToProps = (state: State) => {
    return {
        device: state.suite.device,
        transport: state.suite.transport,

        // connect reducer
        prevDeviceId: state.onboarding.connect.prevDeviceId,
        connectError: state.onboarding.connect.connectError,
        deviceCall: state.onboarding.connect.deviceCall,
        deviceInteraction: state.onboarding.connect.deviceInteraction,
        uiInteraction: state.onboarding.connect.uiInteraction,

        // onboarding reducer
        selectedModel: state.onboarding.selectedModel,
        activeStepId: state.onboarding.activeStepId,
        activeSubStep: state.onboarding.activeSubStep,
        steps: state.onboarding.steps,
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
