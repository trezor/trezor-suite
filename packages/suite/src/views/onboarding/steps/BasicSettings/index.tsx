import { selectEnabledNetworks, startDiscoveryThunk } from '@suite-common/wallet-core';
import { EventType, analytics } from '@trezor/suite-analytics';

import { OnboardingCard } from 'src/components/onboarding/OnboardingCard/OnboardingCard';
import { Translation } from 'src/components/suite/Translation';
import { useDevice, useDispatch, useOnboarding, useSelector } from 'src/hooks/suite';
import { getIsTorLoading } from 'src/utils/suite/tor';

import { BasicSettingsStepBox } from './BasicSettingsStepBox';

const BasicSettings = () => {
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const torStatus = useSelector(state => state.suite.torStatus);
    const onboardingAnalytics = useSelector(state => state.onboarding.onboardingAnalytics);
    const { goToSuite } = useOnboarding();
    const { device } = useDevice();
    const dispatch = useDispatch();

    const noNetworkEnabled = !enabledNetworks.length;
    const isTorLoading = getIsTorLoading(torStatus);

    if (device?.features === undefined) {
        return null;
    }

    const reportAnalytics = () => {
        const payload = {
            ...onboardingAnalytics,
            duration: Date.now() - onboardingAnalytics.startTime!,
            device: device.features.internal_model,
            unitPackaging: device.features.unit_packaging ?? 0,
        };
        delete payload.startTime;

        analytics.report({
            type: EventType.DeviceSetupCompleted,
            payload,
        });
    };

    const handleGoToSuite = () => {
        reportAnalytics();
        goToSuite();
        dispatch(startDiscoveryThunk({ device }));
    };

    return (
        <BasicSettingsStepBox
            heading={<Translation id="TR_ONBOARDING_COINS_STEP" />}
            description={<Translation id="TR_ONBOARDING_COINS_STEP_DESCRIPTION" />}
            innerActions={
                <OnboardingCard.Button
                    data-testid="@onboarding/exit-app-button"
                    onClick={() => {
                        handleGoToSuite();
                    }}
                    isLoading={isTorLoading}
                    isDisabled={noNetworkEnabled}
                >
                    <Translation id="TR_COMPLETE_SETUP" />
                </OnboardingCard.Button>
            }
        />
    );
};

export default BasicSettings;
