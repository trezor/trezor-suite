import React from 'react';
import { Translation } from '@suite-components/Translation';

import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import CONFIG from '@onboarding-config';
import l10nMessages from './index.messages';
import { Props } from './Container';

const SecurityStep = (props: Props) => (
    <Wrapper.Step>
        <Wrapper.StepHeading>
            <Translation {...l10nMessages.TR_SECURITY_HEADING} />
        </Wrapper.StepHeading>
        <Wrapper.StepBody>
            <Text>
                <Translation {...l10nMessages.TR_SECURITY_SUBHEADING} />
            </Text>
            <Wrapper.Controls>
                <OnboardingButton.Alt
                    data-test="button-exit-app"
                    onClick={() => {
                        props.exitApp(CONFIG.APP.EXIT_APP_ROUTE);
                    }}
                >
                    <Translation {...l10nMessages.TR_SKIP_SECURITY} />
                </OnboardingButton.Alt>
                <OnboardingButton.Cta
                    onClick={() => {
                        props.goToNextStep();
                    }}
                >
                    <Translation {...l10nMessages.TR_GO_TO_SECURITY} />
                </OnboardingButton.Cta>
            </Wrapper.Controls>
        </Wrapper.StepBody>
    </Wrapper.Step>
);

export default SecurityStep;
