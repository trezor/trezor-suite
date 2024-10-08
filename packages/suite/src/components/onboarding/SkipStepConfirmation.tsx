import { ReactNode } from 'react';
import * as STEP from 'src/constants/onboarding/steps';
import { AnyStepId } from 'src/types/onboarding';
import { NewModal } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useOnboarding } from 'src/hooks/suite';

type SkipStepConfirmationProps = {
    onCancel: () => void;
};

type SkipModalContent = {
    heading?: ReactNode;
    secondaryButtonText?: ReactNode;
    body?: ReactNode;
    nextStep?: AnyStepId;
};

const getModalContent = (activeStepId: AnyStepId): SkipModalContent => {
    switch (activeStepId) {
        case STEP.ID_SECURITY_STEP:
        case STEP.ID_BACKUP_STEP:
            return {
                heading: <Translation id="TR_SKIP_BACKUP" />,
                secondaryButtonText: <Translation id="TR_SKIP_BACKUP" />,
                body: <Translation id="TR_SKIP_BACKUP_DESCRIPTION" />,
                nextStep: STEP.ID_SET_PIN_STEP,
            };
        case STEP.ID_SET_PIN_STEP:
            return {
                heading: <Translation id="TR_SKIP_PIN" />,
                secondaryButtonText: <Translation id="TR_SKIP_PIN" />,
                body: <Translation id="TR_SKIP_PIN_DESCRIPTION" />,
            };
        default:
            return {};
    }
};

export const SkipStepConfirmation = ({ onCancel }: SkipStepConfirmationProps) => {
    const { activeStepId, goToNextStep } = useOnboarding();
    const { heading, secondaryButtonText, body, nextStep } = getModalContent(activeStepId);

    if (!heading) return;

    const handleSkipStepConfirm = () => {
        goToNextStep(nextStep);
    };

    return (
        <NewModal
            heading={heading}
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
                        {secondaryButtonText}
                    </NewModal.Button>
                </>
            }
        >
            {body}
        </NewModal>
    );
};
