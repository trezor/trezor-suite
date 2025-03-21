import { expect, test } from '../../support/fixtures';

/**
 * Test case:
 * 1. Navigate to `Settings/Application`
 * 2. Scroll down to the `Experimental features` part
 * 3. Click on Join button
 * 4. Confrim the EAP modal
 * 5. Check if there is a button with `Leave` on it
 */
test.use({ startEmulator: false });

test('Join early access button', { tag: '@settings' }, async ({ settingsPage }) => {
    await settingsPage.navigateTo('application');
    await settingsPage.joinEarlyAccessProgram();
    await expect(settingsPage.earlyAccessJoinButton).toHaveText('Opt out');
});
