import { conditionalDescribe } from '@suite-common/test-utils';

import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onDeviceOnboarding } from '../pageObjects/deviceOnboardingActions';
import { onDevicePrompt } from '../pageObjects/devicePromptActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { getModelFromEnv, openApp, prepareTrezorEmulator } from '../utils';

conditionalDescribe(
    device.getPlatform() === 'android',
    'Go through onboarding and connect Trezor. [@fixT3W1]',
    () => {
        beforeAll(async () => {
            await openApp({});
            await prepareTrezorEmulator();
        });

        it('Navigate to dashboard', async () => {
            await onOnboarding.finishOnboarding();

            if (getModelFromEnv() === 'T3W1') {
                await onDevicePrompt.allowConnectToTrezor();
                await onDeviceOnboarding.enterTHPPairingCode();
            }

            await waitFor(element(by.id('@screen/CoinEnablingInit')))
                .toBeVisible()
                .withTimeout(10000);

            await onCoinEnabling.handleCoinEnablingInit(['btc', 'eth']);
        });
    },
);
