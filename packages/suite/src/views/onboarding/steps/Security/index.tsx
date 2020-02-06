import React from 'react';

import { Translation } from '@suite-components';
import { resolveStaticPath } from '@suite-utils/nextjs';
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
            <img alt="" src={resolveStaticPath('images/onboarding/t-device-initialized.svg')} />
            <Wrapper.Controls>
                <OnboardingButton.Cta
                    data-test="@onboarding/continue-to-security-button"
                    onClick={() => {
                        props.goToNextStep();
                    }}
                >
                    <Translation {...messages.TR_GO_TO_SECURITY} />
                </OnboardingButton.Cta>
            </Wrapper.Controls>
            <Text>Only 2 more steps that take only few more minutes.</Text>
        </Wrapper.StepBody>
        <Wrapper.StepFooter>
            <OnboardingButton.Back
                icon="CROSS"
                data-test="@onboarding/exit-app-button"
                onClick={props.closeModalApp}
            >
                <Translation {...messages.TR_SKIP_SECURITY} />
            </OnboardingButton.Back>
        </Wrapper.StepFooter>
    </Wrapper.Step>
);

export default SecurityStep;
