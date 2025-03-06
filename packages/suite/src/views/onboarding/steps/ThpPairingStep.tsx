import { useCallback, useEffect } from 'react';
import { useIntl } from 'react-intl';

import { Column } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { OnboardingStepBox } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';

import { useOnboardingCancelButtonContext } from '../../../components/onboarding/OnboardingCancelButtonContext';
import { ThpPairingPinEntry } from '../../../components/thp/ThpPairingPinEntry';
import messages from '../../../support/messages';

export const ThpPairingStep = () => {
    const intl = useIntl();
    const isActionAbortable = useSelector(selectIsActionAbortable);

    const { setOnCancelHandler } = useOnboardingCancelButtonContext();

    const abort = useCallback(
        () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED)),
        [intl],
    );

    useEffect(() => {
        if (setOnCancelHandler === null) {
            return;
        }

        // important to not call the abort function in the setState React method
        setOnCancelHandler(() => abort);

        return () => setOnCancelHandler(null);
    }, [setOnCancelHandler, abort]);

    return (
        <OnboardingStepBox
            image="CHECK_SHIELD"
            heading={<Translation id="TR_THP_ENTER_ONE_TIME_CODE" />}
            device={undefined}
            isActionAbortable={isActionAbortable}
        >
            <Column gap={spacings.xxxxl} flex="1" justifyContent="center" alignItems="center">
                <ThpPairingPinEntry />
            </Column>
        </OnboardingStepBox>
    );
};
