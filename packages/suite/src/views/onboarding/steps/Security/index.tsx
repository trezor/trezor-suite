import React from 'react';
import { Translation } from '@suite-components/Translation';

import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import messages from '@suite/support/messages';
import { Props } from './Container';

const SecurityStep = (props: Props) => (
    <Wrapper.Step>
        <Wrapper.StepHeading>
            <Translation {...messages.TR_SECURITY_HEADING} />
        </Wrapper.StepHeading>
        <Wrapper.StepBody>
            <Text>
                <Translation {...messages.TR_SECURITY_SUBHEADING} />
            </Text>
            <Wrapper.Controls>
                <OnboardingButton.Alt data-test="button-exit-app" onClick={props.closeModalApp}>
                    <Translation {...messages.TR_SKIP_SECURITY} />
                </OnboardingButton.Alt>
                <OnboardingButton.Cta
                    onClick={() => {
                        props.goToNextStep();
                    }}
                >
                    <Translation {...messages.TR_GO_TO_SECURITY} />
                </OnboardingButton.Cta>
            </Wrapper.Controls>
        </Wrapper.StepBody>
    </Wrapper.Step>
);

export default SecurityStep;
