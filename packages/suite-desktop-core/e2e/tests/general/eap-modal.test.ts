import { test, expect } from '../../support/fixtures';

/**
 * Test case:
 * 1. Navigate to `Settings/Application`
 * 2. Scroll down to the `Experimental features` part
 * 3. Click on Join button
 * 4. Confrim the EAP modal
 * 5. Check if there is a button with `Leave` on it
 */
// TODO: #15561 FIX settings cleanup:  eap setting is remembered even after cache cleanup at the beginning of the test. This shouldn't affect gha run but breaks the local one.
test.skip(!process.env.GITHUB_ACTION, 'Test is working only in CI. Skipping local run.');

test.beforeAll(async ({ onboardingPage }) => {
    await onboardingPage.completeOnboarding();
});

test('Join early access button', async ({ settingsPage }) => {
    const buttonText = 'Leave';
    await settingsPage.navigateTo();
    await settingsPage.applicationTabButton.click();
    await settingsPage.joinEarlyAccessProgram();
    expect(await settingsPage.earlyAccessJoinButton.textContent()).toContain(buttonText);
});
