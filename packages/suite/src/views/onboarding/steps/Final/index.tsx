import React from 'react';
import styled from 'styled-components';

import { OnboardingButton, Wrapper, Text } from '@onboarding-components';
import { Translation, Image } from '@suite-components';

import { Props } from './Container';

const StyledImage = styled(Image)`
    flex: 1;
`;

const FinalStep = ({ closeModalApp }: Props) => (
    <Wrapper.Step data-test="@onboarding/final">
        <Wrapper.StepHeading>
            <Translation id="TR_FINAL_HEADING" />
        </Wrapper.StepHeading>
        <Wrapper.StepBody>
            <Text>
                <Translation id="TR_FINAL_SUBHEADING" />
            </Text>
            <StyledImage image="ALL_DONE" />
        </Wrapper.StepBody>
        <Wrapper.Controls>
            <OnboardingButton.Cta
                data-test="@onboarding/exit-app-button"
                onClick={() => closeModalApp()}
            >
                <Translation id="TR_GO_TO_SUITE" />
            </OnboardingButton.Cta>
        </Wrapper.Controls>
    </Wrapper.Step>
);

export default FinalStep;
