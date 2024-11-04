import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import { Translation } from 'src/components/suite';
import { OnboardingButtonCta } from 'src/components/onboarding';
import { useDevice, useOnboarding, useSelector } from 'src/hooks/suite';
import { getIsTorLoading } from 'src/utils/suite/tor';
import { selectEnabledNetworks } from 'src/reducers/wallet/settingsReducer';

import { AdvancedSetup } from './AdvancedSetup';
import { BasicSettingsStepBox } from './BasicSettingsStepBox';

const BasicSettings = () => {
    const enabledNetworks = useSelector(selectEnabledNetworks);
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
                        data-testid="@onboarding/coins/continue-button"
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
