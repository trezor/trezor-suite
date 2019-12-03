import React from 'react';
import { Translation } from '@suite-components/Translation';
import { H1, H2 } from '@trezor/components-v2';

// import { NEXT_WALLET_URL, PASSWORD_MANAGER_URL } from '@onboarding-constants/urls';
import { Wrapper, OnboardingButton } from '@onboarding-components';
import CONFIG from '@onboarding-config';
import l10nMessages from './index.messages';
import { Props } from './Container';

const FinalStep = ({ exitApp }: Props) => (
    <Wrapper.Step>
        <H1>
            <Translation>{l10nMessages.TR_FINAL_HEADING}</Translation>
        </H1>

        <H2>
            <Translation>{l10nMessages.TR_FINAL_SUBHEADING}</Translation>
        </H2>

        <Wrapper.Controls>
            <OnboardingButton.Cta onClick={() => exitApp(CONFIG.APP.EXIT_APP_ROUTE)}>
                Go to wallet
            </OnboardingButton.Cta>
        </Wrapper.Controls>
    </Wrapper.Step>
);

export default FinalStep;
