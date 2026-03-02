import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onHome } from '../pageObjects/homeActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { openApp, prepareTrezorEmulator } from '../support/setup';
import { waitForVisible } from '../support/utils';

describe('Go through onboarding and connect Trezor. [@androidOnly @T3T1]', () => {
    beforeEach(async () => {
        await openApp({});
        await prepareTrezorEmulator();
    });

    it('Navigate to dashboard', async () => {
        await onOnboarding.finishOnboarding();

        await onCoinEnabling.waitForInitScreen();
        await onCoinEnabling.handleCoinEnablingInit(['btc', 'eth']);
        await waitForVisible(by.text('Connected'));
        await onHome.scrollScreenToBottom();
        await waitForVisible(by.text('Bitcoin'));
    });
});
