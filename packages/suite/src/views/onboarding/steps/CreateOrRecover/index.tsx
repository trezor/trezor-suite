import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import * as STEP from '@onboarding-constants/steps';
import { NeueOption } from '@onboarding-components';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import { OnboardingStepBox } from '@suite/components/firmware';
import { variables } from '@trezor/components';

const OptionsWrapper = styled.div`
    display: flex;

    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const OptionWrapper = styled.div`
    display: flex;
    width: 100%;
`;

const Divider = styled.div`
    flex: 0 0 24px;
`;

const CreateOrRecoverStep = () => {
    const { goToNextStep, addPath } = useActions({
        goToNextStep: onboardingActions.goToNextStep,
        goToPreviousStep: onboardingActions.goToPreviousStep,
        addPath: onboardingActions.addPath,
    });

    return (
        <OnboardingStepBox
            image="WALLET"
            heading={<Translation id="TR_WELCOME_TO_TREZOR_TEXT_WALLET_CREATION" />}
        >
            <OptionsWrapper>
                <OptionWrapper>
                    <NeueOption
                        icon="NEW"
                        data-test="@onboarding/path-create-button"
                        onClick={() => {
                            addPath(STEP.PATH_CREATE);
                            goToNextStep();
                        }}
                        heading={<Translation id="TR_CREATE_WALLET" />}
                        description={<Translation id="TR_IF_YOU_NEVER_HAD_WALLET" />}
                    />
                </OptionWrapper>
                <Divider />
                <OptionWrapper>
                    <NeueOption
                        icon="RECOVER"
                        data-test="@onboarding/path-recovery-button"
                        onClick={() => {
                            addPath(STEP.PATH_RECOVERY);
                            goToNextStep();
                        }}
                        heading={<Translation id="TR_RESTORE_EXISTING_WALLET" />}
                        description={<Translation id="TR_USING_EITHER_YOUR_SINGLE_BACKUP" />}
                    />
                </OptionWrapper>
            </OptionsWrapper>
        </OnboardingStepBox>
    );
};

export default CreateOrRecoverStep;
