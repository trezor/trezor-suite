import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { Column } from '@trezor/components';
import TrezorConnect from '@trezor/connect';

import { OnboardingCard } from 'src/components/onboarding/OnboardingCard/OnboardingCard';
import { Translation } from 'src/components/suite/Translation';

import { ThpPairingCodeEntry } from '../../../components/connection/thp/ThpPairingCodeEntry';
import messages from '../../../support/messages';

export const ThpPairingStep = () => {
    const intl = useIntl();

    const abort = useCallback(
        () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED)),
        [intl],
    );

    return (
        <OnboardingCard
            iconName="bluetooth"
            heading={<Translation id="TR_THP_ENTER_ONE_TIME_CODE" />}
            description={<Translation id="TR_THP_CHECK_TREZOR_FOR_CODE" />}
            innerActions={
                <OnboardingCard.Button onClick={abort} variant="tertiary">
                    <Translation id="TR_CANCEL" />
                </OnboardingCard.Button>
            }
        >
            <Column alignItems="center">
                <ThpPairingCodeEntry />
            </Column>
        </OnboardingCard>
    );
};
