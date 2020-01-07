import React from 'react';
import styled from 'styled-components';
import Head from 'next/head';
import { Prompt } from '@trezor/components';
import { Link, P } from '@trezor/components-v2';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { AnyStepDisallowedState, Step } from '@onboarding-types/steps';

import * as EVENTS from '@onboarding-actions/constants/events';

import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as connectActions from '@onboarding-actions/connectActions';

import * as STEP from '@onboarding-constants/steps';
import { STEP_ANIMATION_DURATION } from '@onboarding-constants/constants';
import steps from '@onboarding-config/steps';

import colors from '@onboarding-config/colors';
import { TOS_URL } from '@suite-constants/urls';

import {
    PROGRESSBAR_HEIGHT,
    PROGRESSBAR_HEIGHT_UNIT,
    STEP_HEIGHT,
    STEP_HEIGHT_UNIT,
    NAVBAR_HEIGHT,
    NAVBAR_HEIGHT_UNIT,
} from '@onboarding-config/layout';

import { getFnForRule } from '@onboarding-utils/rules';

import WelcomeStep from '@onboarding-views/steps/Welcome/Container';
import NewOrUsedStep from '@onboarding-views/steps/NewOrUsed/Container';
import SelectDeviceStep from '@onboarding-views/steps/SelectDevice/Container';
import HologramStep from '@onboarding-views/steps/Hologram/Container';
import PairStep from '@onboarding-views/steps/Pair/Container';
import FirmwareStep from '@onboarding-views/steps/Firmware/Container';
import ShamirStep from '@onboarding-views/steps/Shamir/Container';
import RecoveryStep from '@onboarding-views/steps/Recovery/Container';
import BackupStep from '@onboarding-views/steps/Backup/Container';
import SecurityStep from '@onboarding-views/steps/Security/Container';
import SetPinStep from '@onboarding-views/steps/Pin/Container';
import NameStep from '@onboarding-views/steps/Name/Container';
import BookmarkStep from '@onboarding-views/steps/Bookmark/Container';
import NewsletterStep from '@onboarding-views/steps/Newsletter/Container';
import FinalStep from '@onboarding-views/steps/Final/Container';
import { UnexpectedState, Preloader } from '@onboarding-components';

import { AppState, Dispatch } from '@suite-types';
// import { CSSTransition } from 'react-transition-group';

const BORDER_RADIUS = 12;
const TRANSITION_PROPS = {
    timeout: STEP_ANIMATION_DURATION,
    classNames: 'step-transition',
    unmountOnExit: true,
};

interface WrapperInsideProps extends React.HTMLAttributes<HTMLDivElement> {
    isGlobalInteraction: boolean;
}

const WrapperInside = styled.div<WrapperInsideProps>`
    position: relative;
    display: flex;
    flex-direction: column;
`;

// const ProgressStepsSlot = styled.div`
//     height: ${`${PROGRESSBAR_HEIGHT}${PROGRESSBAR_HEIGHT_UNIT}`};
// `;

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
        <TrezorActionOverlay data-test="@onboading/confirm-action-on-device">
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

// using css transitions somehow break webusb button logic. Temporary workaround to disable
// transitions without need to rewrite much code.
const CSSTransition = (props: any) => {
    if (props.in) {
        return props.children;
    }
    return null;
};

const mapStateToProps = (state: AppState) => {
    return {
        device: state.suite.device,

        // suite reducer
        loaded: state.suite.loaded,

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

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
type Props = StateProps & DispatchProps & { modal: React.ReactNode };

const Onboarding = (props: Props) => {
    const {
        selectedModel,
        activeStepId,

        deviceCall,
        uiInteraction,

        loaded,
        device,
        prevDevice,
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

    return (
        <>
            <Head>
                <title>Onboarding | Trezor Suite</title>
            </Head>
            <Preloader loaded={loaded}>
                <WrapperInside isGlobalInteraction={isGlobalInteraction()}>
                    {errorState && (
                        <UnexpectedStateOverlay>
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
                        </UnexpectedStateOverlay>
                    )}
                    {/* <ProgressStepsSlot>
                            <ProgressSteps
                                hiddenOnSteps={[
                                    STEP.ID_WELCOME_STEP,
                                    STEP.ID_SECURITY_STEP,
                                    STEP.ID_FINAL_STEP,
                                ]}
                                steps={steps}
                                activeStep={activeStep}
                                isDisabled={deviceCall.isProgress}
                            />
                        </ProgressStepsSlot> */}
                    <ComponentWrapper>
                        {uiInteraction.name && isGlobalInteraction() && (
                            <TrezorAction model={model} event={uiInteraction.name} />
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
                            in={activeStepId === STEP.ID_PAIR_DEVICE_STEP}
                            {...TRANSITION_PROPS}
                        >
                            <PairStep />
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
            </Preloader>
        </>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Onboarding);
