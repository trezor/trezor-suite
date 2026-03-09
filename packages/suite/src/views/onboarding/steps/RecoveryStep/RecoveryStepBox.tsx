import { Translation } from '@suite/intl';
import { recoveryActions } from '@suite/recovery';
import { DeviceModelInternal } from '@trezor/device-utils';

import { goToPreviousStep } from 'src/actions/onboarding/onboardingActions';
import {
    OnboardingCard,
    type OnboardingCardProps,
} from 'src/components/onboarding/OnboardingCard/OnboardingCard';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';

const RecoveryStepBox = (props: OnboardingCardProps) => {
    const recovery = useSelector(state => state.recovery);
    const dispatch = useDispatch();

    const { device } = useDevice();

    const deviceModelInternal = device?.features?.internal_model;

    if (!deviceModelInternal) {
        return null;
    }

    const handleBack = () => {
        if (recovery.status === 'select-recovery-type') {
            return dispatch(recoveryActions.setStatus('initial'));
        }
        // allow to change recovery settings for T1B1 in case of error
        if (
            recovery.status === 'finished' &&
            recovery.error &&
            deviceModelInternal === DeviceModelInternal.T1B1
        ) {
            return dispatch(recoveryActions.setStatus('initial'));
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
        <OnboardingCard
            iconName="trezorBackup"
            outerActions={
                isBackButtonVisible() ? (
                    <OnboardingCard.SecondaryButton
                        onClick={() => handleBack()}
                        data-testid="@onboarding/recovery/back-button"
                    >
                        <Translation id="TR_BACK" />
                    </OnboardingCard.SecondaryButton>
                ) : undefined
            }
            {...props}
        />
    );
};

export default RecoveryStepBox;
