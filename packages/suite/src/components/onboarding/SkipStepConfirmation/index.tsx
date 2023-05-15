import React from 'react';
import styled from 'styled-components';

import * as STEP from '@onboarding-constants/steps';
import { AnyStepId } from '@onboarding-types';
import { Button, variables } from '@trezor/components';
import { Translation, Modal } from '@suite-components';
import { useOnboarding } from '@suite-hooks';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
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

const SkipStepConfirmation = ({ onCancel }: SkipStepConfirmationProps) => {
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
            bottomBar={
                <>
                    <Button
                        variant="danger"
                        data-test="@onboarding/skip-button-confirm"
                        onClick={() => goToNextStep(nextStep)}
                    >
                        {text}
                    </Button>
                    <Button variant="secondary" onClick={onCancel}>
                        <Translation id="TR_DONT_SKIP" />
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

export default SkipStepConfirmation;
