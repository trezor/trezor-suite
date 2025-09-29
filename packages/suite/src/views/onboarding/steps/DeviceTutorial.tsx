import { useEffect } from 'react';
import { useIntl } from 'react-intl';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Button, Column } from '@trezor/components';
import TrezorConnect from '@trezor/connect';

import { beginOnboardingTutorial } from 'src/actions/onboarding/onboardingActions';
import { OnboardingStepBox } from 'src/components/onboarding';
import { DeviceConfirmImage } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsActionAbortable } from 'src/selectors/suite/suiteSelectors';
import messages from 'src/support/messages';

export const DeviceTutorial = () => {
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    const intl = useIntl();

    useEffect(() => {
        dispatch(beginOnboardingTutorial());
    }, [dispatch]);

    const handleSkipClick = () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    return (
        <OnboardingStepBox
            heading={
                <Column justifyContent="center" alignItems="center" gap={40}>
                    <DeviceConfirmImage device={device} height={200} />
                    <Translation id="TR_TREZOR_DEVICE_TUTORIAL_HEADING" />
                </Column>
            }
            description={<Translation id="TR_TREZOR_DEVICE_TUTORIAL_DESCRIPTION" />}
            device={device}
            innerActions={
                isActionAbortable && (
                    <Button
                        data-testid="@tutorial/skip-button"
                        variant="tertiary"
                        size="small"
                        onClick={handleSkipClick}
                    >
                        <Translation id="TR_SKIP" />
                    </Button>
                )
            }
            devicePromptTitle={<Translation id="TR_CONTINUE_ON_TREZOR" />}
        />
    );
};
