import React from 'react';
import styled from 'styled-components';
import Head from 'next/head';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { variables } from '@trezor/components-v2';
import { AnyStepDisallowedState, Step } from '@onboarding-types/steps';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as connectActions from '@onboarding-actions/connectActions';
import * as STEP from '@onboarding-constants/steps';
import steps from '@onboarding-config/steps';
import { getFnForRule } from '@onboarding-utils/rules';

import WelcomeStep from '@onboarding-views/steps/Welcome/Container';
import SkipStep from '@onboarding-views/steps/Skip/Container';
import CreateOrRecover from '@onboarding-views/steps/CreateOrRecover/Container';
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
import FinalStep from '@onboarding-views/steps/Final/Container';
import { UnexpectedState } from '@onboarding-components';
import { ProgressBar } from '@suite-components';
import { AppState, Dispatch, InjectedModalApplicationProps } from '@suite-types';

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
        margin: 20px auto 0 auto;
        height: 80vh;
        overflow: hidden;
    }
`;

const ComponentWrapper = styled.div`
    display: flex;
    justify-content: center;
    min-height: 65vh;
`;

// used to position modal to center
const ActionModalWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const mapStateToProps = (state: AppState) => {
    return {
        device: state.suite.device,

        // connect reducer
        deviceCall: state.onboarding.deviceCall,
        uiInteraction: state.onboarding.uiInteraction,

        // onboarding reducer
        prevDevice: state.onboarding.prevDevice,
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
    const { activeStepId, device, uiInteraction, prevDevice, path, modal } = props;

    const getStep = () => {
        const lookup = steps.find((step: Step) => step.id === activeStepId);
        // todo: is there a better way how to solve lookup completeness with typescript?
        if (!lookup) {
            throw new TypeError('step not found by step id. unexepected.');
        }
        return lookup;
    };

    const getError = () => {
        const activeStep = getStep();
        if (!activeStep.disallowedDeviceStates) {
            return null;
        }

        return activeStep.disallowedDeviceStates.find((state: AnyStepDisallowedState) => {
            const fn = getFnForRule(state);
            return fn({ device, prevDevice, path, uiInteraction });
        });
    };

    const errorState = getError();

    const getStepComponent = () => {
        switch (activeStepId) {
            case STEP.ID_WELCOME_STEP:
                return WelcomeStep;
            case STEP.ID_SKIP_STEP:
                return SkipStep;
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

            <ProgressBar
                total={steps.filter(s => s.progress).length}
                current={steps.findIndex(step => activeStepId === step.id)}
                showBuy={getStep().buy}
                showHelp={getStep().help}
                hidden={!getStep().progress}
            />

            <ComponentWrapper>
                {errorState && (
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
                )}
                {!errorState && modal && (
                    <ActionModalWrapper data-test="@onboading/confirm-action-on-device">
                        bla bla
                        {modal}
                    </ActionModalWrapper>
                )}
                {!errorState && !modal && <StepComponent />}
            </ComponentWrapper>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Onboarding);
