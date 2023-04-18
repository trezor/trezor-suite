import React from 'react';
import {
    OnboardingButtonBack,
    OnboardingStepBox,
    OnboardingStepBoxProps,
} from '@onboarding-components';
import { Translation } from '@suite-components';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import { useActions, useSelector } from '@suite-hooks';
import { DeviceModel } from '@trezor/device-utils';
import { useDeviceModel } from '@suite-hooks/useDeviceModel';

const RecoveryStepBox = (props: OnboardingStepBoxProps) => {
    const { goToPreviousStep, setStatus } = useActions({
        goToPreviousStep: onboardingActions.goToPreviousStep,
        setStatus: recoveryActions.setStatus,
    });

    const recovery = useSelector(state => state.recovery);

    const deviceModel = useDeviceModel();

    if (!deviceModel) {
        return null;
    }

    const handleBack = () => {
        if (recovery.status === 'select-recovery-type') {
            return setStatus('initial');
        }
        // allow to change recovery settings for T1 in case of error
        if (recovery.status === 'finished' && recovery.error && deviceModel === DeviceModel.T1) {
            return setStatus('initial');
        }
        return goToPreviousStep();
    };

    const isBackButtonVisible = () => {
        if (recovery.status === 'finished' && recovery.error) {
            return true;
        }
        if (!['finished', 'in-progress', 'waiting-for-confirmation'].includes(recovery.status)) {
            return true;
        }
        return false;
    };

    return (
        <OnboardingStepBox
            image="RECOVERY"
            outerActions={
                isBackButtonVisible() ? (
                    <OnboardingButtonBack
                        onClick={() => handleBack()}
                        data-test="@onboarding/recovery/back-button"
                    >
                        <Translation id="TR_BACK" />
                    </OnboardingButtonBack>
                ) : undefined
            }
            {...props}
        />
    );
};

export default RecoveryStepBox;
