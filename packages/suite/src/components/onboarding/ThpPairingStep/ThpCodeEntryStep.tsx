import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { Translation, messages } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { Column } from '@trezor/components';
import TrezorConnect from '@trezor/connect';

import { ThpPairingCodeEntry } from 'src/components/connection/thp/ThpPairingCodeEntry';

// reflection of components/firmware/ThpPairing/ThpCodeEntryStep
export const ThpCodeEntryStep = () => {
    const intl = useIntl();

    const abort = useCallback(
        () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED)),
        [intl],
    );

    return (
        <OnboardingCard
            iconName="plugsConnected"
            heading={<Translation id="TR_THP_ENTER_ONE_TIME_CODE" />}
            description={<Translation id="TR_THP_CHECK_TREZOR_FOR_CODE" />}
            innerActions={
                <OnboardingCard.Button onClick={abort} intent="neutral" priority="secondary">
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
