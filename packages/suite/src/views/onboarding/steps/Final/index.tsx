import { OnboardingButton, Wrapper } from '@onboarding-components';
import CONFIG from '@onboarding-config';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { H1, H2 } from '@trezor/components-v2';
import React from 'react';

import { Props } from './Container';

const FinalStep = ({ closeModalApp }: Props) => (
    <Wrapper.Step>
        <H1>
            <Translation>{messages.TR_FINAL_HEADING}</Translation>
        </H1>
        <H2>
            <Translation>{messages.TR_FINAL_SUBHEADING}</Translation>
        </H2>
        <Wrapper.Controls>
            <OnboardingButton.Cta onClick={() => closeModalApp(CONFIG.APP.EXIT_APP_ROUTE)}>
                Go to wallet
            </OnboardingButton.Cta>
        </Wrapper.Controls>
    </Wrapper.Step>
);

export default FinalStep;
