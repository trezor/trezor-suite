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

        await onHome.scrollScreenToBottom();
        await waitForVisible(by.text('Get started'));
    });
});
