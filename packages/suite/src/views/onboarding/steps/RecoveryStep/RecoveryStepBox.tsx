import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { OnboardingCard, type OnboardingCardProps } from '@suite/onboarding-components';
import { recoveryActions, selectRecoveryError, selectRecoveryStatus } from '@suite/recovery';
import { DeviceModelInternal } from '@trezor/device-utils';

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
        // allow to change recovery settings for T1B1 in case of error
        if (
            recoveryStatus === 'finished' &&
            recoveryError &&
            deviceModelInternal === DeviceModelInternal.T1B1
        ) {
            return dispatch(recoveryActions.setStatus('initial'));
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
