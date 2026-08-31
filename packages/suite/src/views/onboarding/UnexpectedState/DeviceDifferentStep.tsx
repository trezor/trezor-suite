import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { selectSelectedDevice } from '@suite-common/device';
import { useSelector } from '@suite-common/redux-utils';
import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { mapTrezorModelToFilledIcon } from '@trezor/product-components';

import { useOnboarding } from 'src/hooks/suite';

export const DeviceDifferentStep = () => {
    const { resetOnboarding, enableOnboardingReducer } = useOnboarding();
    const device = useSelector(selectSelectedDevice);

    return (
        <OnboardingCard
            heading={<Translation id="ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_HEADING" />}
            icon={
                mapTrezorModelToFilledIcon[
                    device?.features?.internal_model || DEFAULT_FLAGSHIP_MODEL
                ]
            }
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
                        resetOnboarding();
                        enableOnboardingReducer(true);
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
