import { useEffect } from 'react';
import { useIntl } from 'react-intl';

import { Translation, messages } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import TrezorConnect from '@trezor/connect';
import { mapTrezorModelToFilledIcon } from '@trezor/product-components';

import { beginOnboardingTutorialThunk } from 'src/actions/onboarding/onboardingActions';
import { useSelector } from 'src/hooks/suite';
import { selectOnboardedDevice } from 'src/selectors/onboarding/onboardingSelectors';

export const DeviceTutorialStep = () => {
    const device = useSelector(selectOnboardedDevice);
    const { dispatch } = useServices(selectDispatch);
    const intl = useIntl();

    useEffect(() => {
        dispatch(beginOnboardingTutorialThunk(device));
        // `device` is deliberately not a dependency: it changes as the device reports button
        // requests, and re-running this would restart the tutorial on the device.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    // Cancelling before the `showDeviceTutorial` call reaches the device (and registers in Connect
    // core) is a no-op, leaving the device stuck showing the tutorial. Wait for the device to report
    // it is waiting for interaction before allowing Skip.
    const isDeviceReady = !!device?.buttonRequests.length;

    const handleSkipClick = () =>
        TrezorConnect.cancel({ reason: intl.formatMessage(messages.TR_CANCELLED) });

    return (
        <OnboardingCard
            heading={<Translation id="TR_TREZOR_DEVICE_TUTORIAL_HEADING" />}
            description={<Translation id="TR_TREZOR_DEVICE_TUTORIAL_DESCRIPTION" />}
            device={device}
            icon={
                mapTrezorModelToFilledIcon[
                    device?.features?.internal_model || DEFAULT_FLAGSHIP_MODEL
                ]
            }
            innerActions={
                <OnboardingCard.Button
                    data-testid="@tutorial/skip-button"
                    intent="neutral"
                    priority="secondary"
                    onClick={handleSkipClick}
                    isDisabled={!isDeviceReady}
                    isLoading={!isDeviceReady}
                >
                    <Translation id="TR_SKIP" />
                </OnboardingCard.Button>
            }
            devicePrompt={<Translation id="TR_CONTINUE_ON_TREZOR" />}
            isConfirmedOnDevice
        />
    );
};
