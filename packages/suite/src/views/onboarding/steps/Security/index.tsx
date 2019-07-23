import React from 'react';
import { Button } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import { goToNextStep } from '@onboarding-actions/onboardingActions';

import Text from '@suite/components/onboarding/Text';
import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';

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
                <Button
                    isWhite
                    onClick={() => {
                        props.goToNextStep();
                    }}
                >
                    <FormattedMessage {...l10nMessages.TR_SKIP_SECURITY} />
                </Button>
                <Button
                    onClick={() => {
                        props.goToNextStep();
                    }}
                >
                    <FormattedMessage {...l10nMessages.TR_GO_TO_SECURITY} />
                </Button>
            </ControlsWrapper>
        </StepBodyWrapper>
    </StepWrapper>
);

export default SecurityStep;
