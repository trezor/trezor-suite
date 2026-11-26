import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onDeviceOnboarding } from '../pageObjects/deviceOnboardingActions';
import { onHome } from '../pageObjects/homeActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { openApp, prepareTrezorEmulator } from '../support/setup';

describe('Go through onboarding and connect Trezor. [@androidOnly @T3T1]', () => {
    beforeEach(async () => {
        await prepareTrezorEmulator();
        await openApp({});
    });

    it('Navigate to dashboard', async () => {
        await onOnboarding.finishOnboarding();
        await onDeviceOnboarding.passInitializedDeviceChecks();

        await onHome.waitForScreen();
        await onHome.tapGetStartedButton();
        await onCoinEnabling.handleCoinEnablingInit();
    });
});
