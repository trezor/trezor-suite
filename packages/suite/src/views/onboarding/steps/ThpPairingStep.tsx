import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { Button, Column, Text } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { OnboardingStepBox } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';

import { ThpPairingCodeEntry } from '../../../components/thp/ThpPairingCodeEntry';
import messages from '../../../support/messages';

export const ThpPairingStep = () => {
    const intl = useIntl();

    const abort = useCallback(
        () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED)),
        [intl],
    );

    return (
        <OnboardingStepBox
            image="CHECK_SHIELD"
            heading={<Translation id="TR_THP_ENTER_ONE_TIME_CODE" />}
            description={
                <Text variant="tertiary" typographyStyle="body">
                    <Translation id="TR_THP_CHECK_TREZOR_FOR_CODE" />
                </Text>
            }
            device={undefined}
        >
            <Column gap={spacings.xxxxl} flex="1" justifyContent="center" alignItems="center">
                <ThpPairingCodeEntry />
                <Button onClick={abort} variant="tertiary">
                    <Translation id="TR_CANCEL" />
                </Button>
            </Column>
        </OnboardingStepBox>
    );
};
