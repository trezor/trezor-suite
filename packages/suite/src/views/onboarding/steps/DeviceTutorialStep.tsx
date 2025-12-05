import { useEffect } from 'react';
import { useIntl } from 'react-intl';

import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { IconName } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { mapTrezorModelToIcon } from '@trezor/product-components';

import { beginOnboardingTutorial } from 'src/actions/onboarding/onboardingActions';
import { OnboardingCard } from 'src/components/onboarding/OnboardingCard/OnboardingCard';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import messages from 'src/support/messages';

export const DeviceTutorialStep = () => {
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    const intl = useIntl();

    useEffect(() => {
        dispatch(beginOnboardingTutorial());
    }, [dispatch]);

    const handleSkipClick = () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    return (
        <OnboardingCard
            heading={<Translation id="TR_TREZOR_DEVICE_TUTORIAL_HEADING" />}
            description={<Translation id="TR_TREZOR_DEVICE_TUTORIAL_DESCRIPTION" />}
            device={device}
            iconName={
                `${mapTrezorModelToIcon[device?.features?.internal_model || DEFAULT_FLAGSHIP_MODEL]}Filled` as IconName
            }
            innerActions={
                <OnboardingCard.Button
                    data-testid="@tutorial/skip-button"
                    intent="neutral"
                    priority="secondary"
                    onClick={handleSkipClick}
                >
                    <Translation id="TR_SKIP" />
                </OnboardingCard.Button>
            }
            devicePrompt={<Translation id="TR_CONTINUE_ON_TREZOR" />}
            isConfirmedOnDevice
        />
    );
};
