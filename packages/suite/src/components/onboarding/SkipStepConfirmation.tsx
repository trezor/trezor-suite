import * as STEP from 'src/constants/onboarding/steps';
import { AnyStepId } from 'src/types/onboarding';
import { NewModal } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useOnboarding } from 'src/hooks/suite';

interface SkipStepConfirmationProps {
    onCancel: () => void;
}

export const SkipStepConfirmation = ({ onCancel }: SkipStepConfirmationProps) => {
    const { activeStepId, goToNextStep } = useOnboarding();

    let text;
    let nextStep: AnyStepId;
    switch (activeStepId) {
        case STEP.ID_SECURITY_STEP:
        case STEP.ID_BACKUP_STEP:
            text = <Translation id="TR_SKIP_BACKUP" />;
            nextStep = STEP.ID_SET_PIN_STEP;
            break;
        case STEP.ID_SET_PIN_STEP:
            text = <Translation id="TR_SKIP_PIN" />;
            break;
        default:
            throw new Error(`Unexpected step to skip: ${activeStepId}`);
    }

    const handleSkipStepConfirm = () => {
        goToNextStep(nextStep);
    };

    return (
        <NewModal
            heading={text}
            onCancel={onCancel}
            size="small"
            bottomContent={
                <>
                    <NewModal.Button onClick={onCancel}>
                        <Translation id="TR_DONT_SKIP" />
                    </NewModal.Button>
                    <NewModal.Button
                        variant="tertiary"
                        data-testid="@onboarding/skip-button-confirm"
                        onClick={handleSkipStepConfirm}
                    >
                        {text}
                    </NewModal.Button>
                </>
            }
        >
            <Translation id="TR_DO_YOU_REALLY_WANT_TO_SKIP" />
        </NewModal>
    );
};
