import React from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Modal } from '@trezor/components';
import { Step } from '@onboarding-types/steps';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as STEP from '@onboarding-constants/steps';
import steps from '@onboarding-config/steps';
import { isStepInPath } from '@onboarding-utils/steps';

import WelcomeStep from '@onboarding-views/steps/Welcome/Container';
import SkipStep from '@onboarding-views/steps/Skip/Container';
import CreateOrRecover from '@onboarding-views/steps/CreateOrRecover/Container';
import NewOrUsedStep from '@onboarding-views/steps/NewOrUsed/Container';
import SelectDeviceStep from '@onboarding-views/steps/SelectDevice/Container';
import HologramStep from '@onboarding-views/steps/Hologram/Container';
import PairStep from '@onboarding-views/steps/Pair/Container';
import FirmwareStep from '@onboarding-views/steps/Firmware/Container';
import ResetDeviceStep from '@suite/views/onboarding/steps/ResetDevice/Container';
import RecoveryStep from '@onboarding-views/steps/Recovery/Container';
import BackupStep from '@onboarding-views/steps/Backup/Container';
import SecurityStep from '@onboarding-views/steps/Security/Container';
import SetPinStep from '@onboarding-views/steps/Pin/Container';
import FinalStep from '@onboarding-views/steps/Final/Container';
import UnexpectedState from '@onboarding-views/unexpected-states';
import { AppState, Dispatch, InjectedModalApplicationProps } from '@suite-types';
import { Translation } from '@suite-components';

const InnerModalWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
`;

const mapStateToProps = (state: AppState) => {
    return {
        // onboarding reducer
        activeStepId: state.onboarding.activeStepId,
        path: state.onboarding.path,
    };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: bindActionCreators(onboardingActions, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    InjectedModalApplicationProps;

const Onboarding = (props: Props) => {
    const { activeStepId, modal, path } = props;

    const getStep = () => {
        const lookup = steps.find((step: Step) => step.id === activeStepId);
        // todo: maybe get rid of this with stricter typescript
        if (!lookup) {
            throw new TypeError('step not found by step id. unexpected.');
        }
        return lookup;
    };

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
            case STEP.ID_RESET_DEVICE_STEP:
                return ResetDeviceStep;
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
    const stepsInPath = steps.filter(s => s.progress && isStepInPath(s, path));

    return (
        <Modal
            useFixedHeight
            totalProgressBarSteps={stepsInPath.length}
            currentProgressBarStep={stepsInPath.findIndex(step => activeStepId === step.id)}
            hiddenProgressBar={!getStep().progress}
            // heading={capitalizeFirstLetter(activeStepId.replace(/-/g, ' '))}
            heading={<Translation id="TR_ONBOARDING" />}
        >
            <Head>
                <title>Onboarding | Trezor Suite</title>
            </Head>

            <UnexpectedState>
                {modal && <InnerModalWrapper>{modal}</InnerModalWrapper>}
                {!modal && <StepComponent />}
            </UnexpectedState>
        </Modal>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Onboarding);
