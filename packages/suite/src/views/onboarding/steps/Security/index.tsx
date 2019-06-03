import React from 'react';
import { Button } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import { OnboardingActions } from '@suite/types/onboarding/onboarding';
import * as STEP from '@suite/constants/onboarding/steps';
import Text from '@suite/components/onboarding/Text';
import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';

import l10nMessages from './index.messages';

interface Props {
    onboardingActions: OnboardingActions;
}

const SecurityStep = ({ onboardingActions }: Props) => (
    <StepWrapper>
        <StepHeadingWrapper>
            <FormattedMessage {...l10nMessages.TR_SECURITY_HEADING} />
        </StepHeadingWrapper>
        <StepBodyWrapper>
            <Text>
                <FormattedMessage {...l10nMessages.TR_SECURITY_SUBHEADING} />
            </Text>
            <ControlsWrapper>
                <Button isWhite onClick={() => onboardingActions.goToNextStep(STEP.ID_FINAL_STEP)}>
                    <FormattedMessage {...l10nMessages.TR_SKIP_SECURITY} />
                </Button>
                <Button
                    onClick={() => {
                        onboardingActions.goToNextStep();
                    }}
                >
                    <FormattedMessage {...l10nMessages.TR_GO_TO_SECURITY} />
                </Button>
            </ControlsWrapper>
        </StepBodyWrapper>
    </StepWrapper>
);

export default SecurityStep;
