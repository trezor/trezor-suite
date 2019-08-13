import React from 'react';
import { FormattedMessage } from 'react-intl';

import { goToNextStep } from '@onboarding-actions/onboardingActions';
import * as STEP from '@onboarding-constants/steps';
import { ButtonCta, ButtonAlt } from '@onboarding-components/Buttons';
import Text from '@onboarding-components/Text';
import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
    ControlsWrapper,
} from '@onboarding-components/Wrapper';

import l10nMessages from './index.messages';

interface Props {
    goToNextStep: typeof goToNextStep;
}

const SecurityStep = (props: Props) => (
    <StepWrapper>
        <StepHeadingWrapper>
            <FormattedMessage {...l10nMessages.TR_SECURITY_HEADING} />
        </StepHeadingWrapper>
        <StepBodyWrapper>
            <Text>
                <FormattedMessage {...l10nMessages.TR_SECURITY_SUBHEADING} />
            </Text>
            <ControlsWrapper>
                <ButtonAlt
                    onClick={() => {
                        props.goToNextStep(STEP.ID_FINAL_STEP);
                    }}
                >
                    <FormattedMessage {...l10nMessages.TR_SKIP_SECURITY} />
                </ButtonAlt>
                <ButtonCta
                    onClick={() => {
                        props.goToNextStep();
                    }}
                >
                    <FormattedMessage {...l10nMessages.TR_GO_TO_SECURITY} />
                </ButtonCta>
            </ControlsWrapper>
        </StepBodyWrapper>
    </StepWrapper>
);

export default SecurityStep;
