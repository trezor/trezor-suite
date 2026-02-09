import { Model } from '@trezor/trezor-user-env-link';

import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onDeviceOnboarding } from '../pageObjects/deviceOnboardingActions';
import { onDevicePrompt } from '../pageObjects/devicePromptActions';
import { onHome } from '../pageObjects/homeActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { openApp, prepareTrezorEmulator } from '../support/setup';
import { getModelFromEnv, waitForVisible } from '../support/utils';

describe('Go through onboarding and connect Trezor. [@androidOnly @T3T1]', () => {
    beforeEach(async () => {
        await openApp({});
        await prepareTrezorEmulator();
    });

    it('Navigate to dashboard', async () => {
        await onOnboarding.finishOnboarding();

        if (getModelFromEnv() === Model.T3W1) {
            await onDevicePrompt.allowConnectToTrezor();
            await onDeviceOnboarding.enterTHPPairingCode();
        }

        await onCoinEnabling.waitForInitScreen();
        await onCoinEnabling.handleCoinEnablingInit(['btc', 'eth']);
        await waitForVisible(by.text('Connected'));
        await onHome.scrollScreenToBottom();
        await waitForVisible(by.text('Bitcoin'));
    });
});
