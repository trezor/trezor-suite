import React from 'react';
import styled from 'styled-components';

import { Translation, Image } from '@suite-components';
import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { useActions, useSelector } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';

const StyledImage = styled(Image)`
    height: 250px;
    margin-bottom: auto;
`;

const SecurityStep = () => {
    const { goToNextStep, closeModalApp } = useActions({
        goToNextStep: onboardingActions.goToNextStep,
        closeModalApp: routerActions.closeModalApp,
    });
    const device = useSelector(state => state.suite.device);

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                <Translation id="TR_SECURITY_HEADING" />
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                <Text>
                    <Translation id="TR_SECURITY_SUBHEADING" />
                </Text>
                <StyledImage
                    image={
                        device?.features?.major_version === 1
                            ? 'DEVICE_INITIALIZED_1'
                            : 'DEVICE_INITIALIZED_2'
                    }
                />
                <Wrapper.Controls>
                    <OnboardingButton.Cta
                        data-test="@onboarding/continue-to-security-button"
                        onClick={() => {
                            goToNextStep();
                        }}
                    >
                        <Translation id="TR_GO_TO_SECURITY" />
                    </OnboardingButton.Cta>
                </Wrapper.Controls>
                <Text>
                    <Translation id="TR_ONLY_2_MORE_STEPS" />
                </Text>
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <OnboardingButton.Back
                    icon="CROSS"
                    data-test="@onboarding/exit-app-button"
                    onClick={() => closeModalApp()}
                >
                    <Translation id="TR_SKIP_SECURITY" />
                </OnboardingButton.Back>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default SecurityStep;
