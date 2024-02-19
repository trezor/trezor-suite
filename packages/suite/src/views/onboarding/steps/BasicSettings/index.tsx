import { Translation } from 'src/components/suite';
import { OnboardingButtonCta } from 'src/components/onboarding';
import { useDevice, useOnboarding, useSelector } from 'src/hooks/suite';
import { BasicSettingsStepBox } from './BasicSettingsStepBox';
import { AdvancedSetup } from './AdvancedSetup';
import { getIsTorLoading } from 'src/utils/suite/tor';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

const BasicSettings = () => {
    const enabledNetworks = useSelector(state => state.wallet.settings.enabledNetworks);
    const torStatus = useSelector(state => state.suite.torStatus);
    const { device } = useDevice();

    const bitcoinOnlyFirmware = hasBitcoinOnlyFirmware(device);

    const { goToNextStep } = useOnboarding();

    const noNetworkEnabled = !enabledNetworks.length;
    const isTorLoading = getIsTorLoading(torStatus);

    return (
        <BasicSettingsStepBox
            heading={<Translation id="TR_ONBOARDING_COINS_STEP" />}
            description={
                <Translation
                    id={
                        bitcoinOnlyFirmware
                            ? 'TR_ONBOARDING_COINS_STEP_DESCRIPTION_BITCOIN_ONLY'
                            : 'TR_ONBOARDING_COINS_STEP_DESCRIPTION'
                    }
                />
            }
            outerActions={
                <AdvancedSetup>
                    <OnboardingButtonCta
                        data-test-id="@onboarding/coins/continue-button"
                        onClick={() => {
                            goToNextStep();
                        }}
                        isLoading={isTorLoading}
                        isDisabled={noNetworkEnabled}
                    >
                        <Translation id="TR_COMPLETE_SETUP" />
                    </OnboardingButtonCta>
                </AdvancedSetup>
            }
        />
    );
};

export default BasicSettings;
