import React from 'react';

import { DeviceModelInternal } from '@trezor/connect';
import {
    OnboardingButtonBack,
    OnboardingStepBox,
    OnboardingStepBoxProps,
} from 'src/components/onboarding';
import { Translation } from 'src/components/suite';
import { goToPreviousStep } from 'src/actions/onboarding/onboardingActions';
import { setStatus } from 'src/actions/recovery/recoveryActions';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';

const RecoveryStepBox = (props: OnboardingStepBoxProps) => {
    const recovery = useSelector(state => state.recovery);
    const dispatch = useDispatch();

    const { device } = useDevice();

    const deviceModelInternal = device?.features?.internal_model;

    if (!deviceModelInternal) {
        return null;
    }

    const handleBack = () => {
        if (recovery.status === 'select-recovery-type') {
            return dispatch(setStatus('initial'));
        }
        // allow to change recovery settings for T1B1 in case of error
        if (
            recovery.status === 'finished' &&
            recovery.error &&
            deviceModelInternal === DeviceModelInternal.T1B1
        ) {
            return dispatch(setStatus('initial'));
        }
        return dispatch(goToPreviousStep());
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
