import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { selectDeviceInternalModel } from '@suite-common/device';
import { useServices } from '@trezor/dependency-injection';
import { DEFAULT_FLAGSHIP_MODEL } from '@trezor/device';
import { mapTrezorModelToFilledIcon } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { startOnboardingThunk } from '#src/actions/onboarding/startOnboardingThunk';
import { useSelector } from '#src/hooks/suite/useSelector';

export const DeviceDifferentStep = () => {
    const { dispatch } = useServices(injectDispatch);
    const deviceModelInternal = useSelector(selectDeviceInternalModel);

    return (
        <OnboardingCard
            heading={<Translation id="ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_HEADING" />}
            icon={mapTrezorModelToFilledIcon[deviceModelInternal || DEFAULT_FLAGSHIP_MODEL]}
            description={
                <>
                    <Translation id="ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_P1" />{' '}
                    <Translation id="ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_P2" />
                </>
            }
            intent="warning"
            innerActions={
                <OnboardingCard.Button
                    onClick={() => {
                        dispatch(startOnboardingThunk({ shouldRestart: true }));
                    }}
                    intent="warning"
                    data-testid="@onboarding/unexpected-state/is-same/start-over-button"
                >
                    <Translation id="TR_START_AGAIN" />
                </OnboardingCard.Button>
            }
        />
    );
};
