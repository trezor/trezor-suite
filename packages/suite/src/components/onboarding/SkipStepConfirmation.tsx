import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { type AnyStepId, STEP } from '@suite/onboarding';
import { Modal } from '@trezor/components';


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

const getModalContent = (
    activeStepId: AnyStepId,
    resolveNextAfterSkipped: (stepId: AnyStepId) => AnyStepId | undefined,
): SkipModalContent => {
    switch (activeStepId) {
        case STEP.ID_FIRMWARE_STEP:
            return {
                heading: <Translation id="TR_SKIP_UPDATE" />,
                secondaryButtonText: <Translation id="TR_SKIP_UPDATE" />,
                body: <Translation id="TR_SKIP_UPDATE_DESCRIPTION" />,
            };
        case STEP.ID_SECURITY_STEP:
        case STEP.ID_BACKUP_STEP:
            return {
                heading: <Translation id="TR_SKIP_BACKUP" />,
                secondaryButtonText: <Translation id="TR_SKIP_BACKUP" />,
                body: <Translation id="TR_SKIP_BACKUP_DESCRIPTION" />,
                nextStep: resolveNextAfterSkipped(STEP.ID_SET_PIN_STEP),
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
    const { activeStepId, goToNextStep, resolveNextAfterSkipped } = useOnboarding();
    const { heading, secondaryButtonText, body, nextStep } = getModalContent(
        activeStepId,
        resolveNextAfterSkipped,
    );

    if (!heading) return;

    const handleSkipStepConfirm = () => {
        goToNextStep(nextStep);
    };

    return (
        <Modal
            heading={heading}
            onCancel={onCancel}
            width={600}
            bottomContent={
                <>
                    <Modal.Button onClick={onCancel}>
                        <Translation id="TR_DONT_SKIP" />
                    </Modal.Button>
                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        data-testid="@onboarding/skip-button-confirm"
                        onClick={handleSkipStepConfirm}
                    >
                        {secondaryButtonText}
                    </Modal.Button>
                </>
            }
        >
            {body}
        </Modal>
    );
};
