import React from 'react';
import { Translation } from '@suite-components';
import { useOnboarding } from '@suite-hooks';
import * as STEP from '@onboarding-constants/steps';
import {
    Option,
    OptionWrapper,
    OptionsWrapper,
    OptionsDivider,
    OnboardingStepBox,
} from '@onboarding-components';

const CreateOrRecoverStep = () => {
    const { goToNextStep, addPath, updateAnalytics } = useOnboarding();

    return (
        <OnboardingStepBox
            image="WALLET"
            heading={<Translation id="TR_WELCOME_TO_TREZOR_TEXT_WALLET_CREATION" />}
        >
            <OptionsWrapper>
                <OptionWrapper>
                    <Option
                        icon="NEW"
                        data-test="@onboarding/path-create-button"
                        onClick={() => {
                            addPath(STEP.PATH_CREATE);
                            goToNextStep();
                            updateAnalytics({ seed: 'create' });
                        }}
                        heading={<Translation id="TR_CREATE_WALLET" />}
                    />
                </OptionWrapper>
                <OptionsDivider />
                <OptionWrapper>
                    <Option
                        icon="RECOVER"
                        data-test="@onboarding/path-recovery-button"
                        onClick={() => {
                            addPath(STEP.PATH_RECOVERY);
                            goToNextStep();
                            updateAnalytics({ seed: 'recover' });
                        }}
                        heading={<Translation id="TR_RESTORE_EXISTING_WALLET" />}
                    />
                </OptionWrapper>
            </OptionsWrapper>
        </OnboardingStepBox>
    );
};

export default CreateOrRecoverStep;
