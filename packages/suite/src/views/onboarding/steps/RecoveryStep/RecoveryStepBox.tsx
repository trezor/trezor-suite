import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { OnboardingCard, type OnboardingCardProps } from '@suite/onboarding-components';
import { recoveryActions, selectRecoveryError, selectRecoveryStatus } from '@suite/recovery';
import { TrezorBackupIcon } from '@trezor/icons';

import { goToPreviousStep } from 'src/actions/onboarding/onboardingActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

const RecoveryStepBox = (props: OnboardingCardProps) => {
    const recoveryStatus = useSelector(selectRecoveryStatus);
    const recoveryError = useSelector(selectRecoveryError);
    const dispatch = useDispatch();

    const { device } = useDevice();

    const deviceModelInternal = device?.features?.internal_model;

    if (!deviceModelInternal) {
        return null;
    }

    const handleBack = () => {
        if (recoveryStatus === 'select-recovery-type') {
            return dispatch(recoveryActions.setStatus('initial'));
        }
        // Allow the user to restart recovery after an error (any device model). Reset the whole
        // reducer so the stale error/status is cleared; otherwise re-entering the step would render
        // the "recovery failed" screen again instead of a clean start.
        if (recoveryStatus === 'finished' && recoveryError) {
            return dispatch(recoveryActions.resetReducer());
        }

        return dispatch(goToPreviousStep());
    };

    const isBackButtonVisible = () => {
        if (recoveryStatus === 'finished' && recoveryError) {
            return true;
        }
        if (!['finished', 'in-progress', 'waiting-for-confirmation'].includes(recoveryStatus)) {
            return true;
        }

        return false;
    };

    return (
        <OnboardingCard
            icon={TrezorBackupIcon}
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
