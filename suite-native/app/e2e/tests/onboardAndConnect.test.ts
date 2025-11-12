import { expect as detoxExpect } from 'detox';

import { conditionalDescribe } from '@suite-common/test-utils';

import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onDeviceOnboarding } from '../pageObjects/deviceOnboardingActions';
import { onDevicePrompt } from '../pageObjects/devicePromptActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { getModelFromEnv, openApp, prepareTrezorEmulator } from '../support/setup';

conditionalDescribe(
    device.getPlatform() === 'android',
    'Go through onboarding and connect Trezor. [@fixT3W1]',
    () => {
        beforeEach(async () => {
            await openApp({});
            await prepareTrezorEmulator();
        });

        it('Navigate to dashboard', async () => {
            await onOnboarding.finishOnboarding();

            if (getModelFromEnv() === 'T3W1') {
                await onDevicePrompt.allowConnectToTrezor();
                await onDeviceOnboarding.enterTHPPairingCode();
            }

            await onCoinEnabling.waitForInitScreen();
            await onCoinEnabling.handleCoinEnablingInit(['btc', 'eth']);
            const bitcoinTextElement = element(by.text('Bitcoin'));
            await detoxExpect(bitcoinTextElement).toBeVisible();
        });
    },
);
