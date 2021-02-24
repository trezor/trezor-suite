import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { Step } from '@onboarding-types/steps';
import * as STEP from '@onboarding-constants/steps';
import steps from '@onboarding-config/steps';
import { isStepInPath } from '@onboarding-utils/steps';

import WelcomeStep from '@onboarding-views/steps/Welcome';
import SkipStep from '@onboarding-views/steps/Skip';
import CreateOrRecover from '@onboarding-views/steps/CreateOrRecover';
import NewOrUsedStep from '@onboarding-views/steps/NewOrUsed';
import SelectDeviceStep from '@onboarding-views/steps/SelectDevice';
import HologramStep from '@onboarding-views/steps/Hologram';
import PairStep from '@onboarding-views/steps/Pair';
import FirmwareStep from '@onboarding-views/steps/Firmware';
import ResetDeviceStep from '@suite/views/onboarding/steps/ResetDevice';
import RecoveryStep from '@onboarding-views/steps/Recovery';
import BackupStep from '@onboarding-views/steps/Backup';
import SecurityStep from '@onboarding-views/steps/Security';
import SetPinStep from '@onboarding-views/steps/Pin';
import FinalStep from '@onboarding-views/steps/Final';
import UnexpectedState from '@onboarding-views/unexpected-states';
import { AppState, InjectedModalApplicationProps } from '@suite-types';
import { Translation, Modal, Metadata } from '@suite-components';

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

type Props = ReturnType<typeof mapStateToProps> & InjectedModalApplicationProps;

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
            <Metadata title="Onboarding | Trezor Suite" />
            <UnexpectedState>
                {modal && <InnerModalWrapper>{modal}</InnerModalWrapper>}
                {!modal && <StepComponent />}
            </UnexpectedState>
        </Modal>
    );
};

export default connect(mapStateToProps)(Onboarding);
