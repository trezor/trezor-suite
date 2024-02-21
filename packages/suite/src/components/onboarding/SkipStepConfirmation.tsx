import styled from 'styled-components';

import * as STEP from 'src/constants/onboarding/steps';
import { AnyStepId } from 'src/types/onboarding';
import { Button } from '@trezor/components';
import { Translation, Modal } from 'src/components/suite';
import { useOnboarding } from 'src/hooks/suite';
import { typography } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    color: ${({ theme }) => theme.textDefault};
    ${typography.body};
    padding: 16px 0;
`;

const StyledModal = styled(Modal)`
    width: 600px;
    ${Modal.BottomBar} {
        > * {
            flex: 1;
        }
    }
`;

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

    return (
        <StyledModal
            isCancelable
            heading={text}
            onCancel={onCancel}
            bottomBarComponents={
                <>
                    <Button variant="primary" onClick={onCancel}>
                        <Translation id="TR_DONT_SKIP" />
                    </Button>
                    <Button
                        variant="destructive"
                        data-test-id="@onboarding/skip-button-confirm"
                        onClick={() => goToNextStep(nextStep)}
                    >
                        {text}
                    </Button>
                </>
            }
        >
            <Wrapper>
                <Translation id="TR_DO_YOU_REALLY_WANT_TO_SKIP" />
            </Wrapper>
        </StyledModal>
    );
};
