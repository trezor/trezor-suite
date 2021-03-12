import React from 'react';
import { Translation } from '@suite-components';
import { OnboardingButtonCta } from '@onboarding-components';
import { useOnboarding, useSelector } from '@suite-hooks';
import { NETWORKS } from '@wallet-config';
import { Network } from '@wallet-types';
import BasicSettingsStepBox from './BasicSettingsStepBox';
import AdvancedSetup from './AdvancedSetup';

const BasicSettings = () => {
    const { device, enabledNetworks } = useSelector(state => ({
        device: state.suite.device,
        enabledNetworks: state.wallet.settings.enabledNetworks,
    }));

    const unavailableCapabilities = device && device.features ? device.unavailableCapabilities : {};

    const enabledMainnetNetworks: Network['symbol'][] = [];
    const enabledTestnetNetworks: Network['symbol'][] = [];

    enabledNetworks.forEach(symbol => {
        const network = NETWORKS.find(n => n.symbol === symbol);
        if (!network) return;
        if (network.testnet) {
            enabledTestnetNetworks.push(network.symbol);
        } else {
            enabledMainnetNetworks.push(network.symbol);
        }
    });

    const mainnetNetworks = NETWORKS.filter(n => !n.accountType && !n.testnet);
    const testnetNetworks = NETWORKS.filter(n => !n.accountType && n?.testnet === true);

    const setupNetworks = [...mainnetNetworks, ...testnetNetworks].filter(
        n => enabledMainnetNetworks.includes(n.symbol) || enabledTestnetNetworks.includes(n.symbol),
    );

    const canCompleteSetup = enabledNetworks.length;
    const { goToNextStep } = useOnboarding();
    return (
        <BasicSettingsStepBox
            mainnetNetworks={mainnetNetworks}
            testnetNetworks={testnetNetworks}
            enabledMainnetNetworks={enabledMainnetNetworks}
            enabledTestnetNetworks={enabledTestnetNetworks}
            unavailableCapabilities={unavailableCapabilities}
            heading={<Translation id="TR_ONBOARDING_COINS_STEP" />}
            description={<Translation id="TR_ONBOARDING_COINS_STEP_DESCRIPTION" />}
            outerActions={
                <AdvancedSetup networks={setupNetworks}>
                    <OnboardingButtonCta
                        data-test="@onboarding/coins/continue-button"
                        onClick={() => {
                            goToNextStep();
                        }}
                        isDisabled={!canCompleteSetup}
                    >
                        <Translation id="TR_COMPLETE_SETUP" />
                    </OnboardingButtonCta>
                </AdvancedSetup>
            }
        />
    );
};

export default BasicSettings;
