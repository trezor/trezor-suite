import React from 'react';
import { FormattedMessage } from 'react-intl';
import { H1, H4 } from '@trezor/components';

// import { NEXT_WALLET_URL, PASSWORD_MANAGER_URL } from '@onboarding-constants/urls';
import { Wrapper, OnboardingButton } from '@onboarding-components';
import CONFIG from '@onboarding-config';
import l10nMessages from './index.messages';
import { Props } from './Container';

const FinalStep = ({ exitApp }: Props) => (
    <Wrapper.Step>
        <H1>
            <FormattedMessage {...l10nMessages.TR_FINAL_HEADING} />
        </H1>

        <H4>
            <FormattedMessage {...l10nMessages.TR_FINAL_SUBHEADING} />
        </H4>

        <Wrapper.Controls>
            <OnboardingButton.Cta onClick={() => exitApp(CONFIG.APP.EXIT_APP_ROUTE)}>
                Go to wallet
            </OnboardingButton.Cta>
        </Wrapper.Controls>
    </Wrapper.Step>
);

export default FinalStep;
