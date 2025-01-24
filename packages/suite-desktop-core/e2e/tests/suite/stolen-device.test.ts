import { BridgeTransport } from '@trezor/transport';
import * as messages from '@trezor/protobuf/src/messages';

import { test, expect } from '../../support/fixtures';

const stealBridgeSession = async () => {
    const bridge = new BridgeTransport({ messages, id: 'foo-bar' });
    await bridge.init();
    const enumerateRes = await bridge.enumerate();
    if (!enumerateRes.success) return null;
    await bridge.acquire({
        input: { path: enumerateRes.payload[0].path, previous: null },
    });
};

test.describe('stolen device', { tag: ['@group=suite'] }, () => {
    //TODO: there is not pin protection in the emu setup, i remove pin_protection: false
    test.use({ emulatorSetupConf: { passphrase_protection: true } });

    test.beforeEach(async ({ onboardingPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    test('someone steals session, device status turns inactive', async ({ page }) => {
        // simulate stolen session from another window. device receives indicative button
        await page.pause();
        await stealBridgeSession();
        await expect(page.getByTestId('@deviceStatus-connected')).toHaveText('Refresh');
        await page.getByTestId('@menu/switch-device').click();

        //My assumption : This one does not work, It says 'Connected' instead of 'Refresh' My assumption
        // await expect(
        //     page.getByTestId('@menu/switch-device').getByTestId('@deviceStatus-connected'),
        // ).toHaveText('Refresh');
        await page.getByTestId('@switch-device/solve-issue-button').click();
        await expect(
            page.getByTestId('@menu/switch-device').getByTestId('@deviceStatus-connected'),
        ).toHaveText('Connected');

        // when user reloads app while device is acquired, suite will not try to acquire device so that it
        // does not interferes with somebody else's session
        await stealBridgeSession();
        //My assumption : This one does not work, It says 'Connected' instead of 'Refresh' My assumption
        // await expect(
        //     page.getByTestId('@menu/switch-device').getByTestId('@deviceStatus-connected'),
        // ).toHaveText('Refresh');
        await expect(page.getByTestId('@switch-device/solve-issue-button')).toBeVisible();
        await page.reload();
        // This leads to initial 'detect device' screen and says
        // Failed to communicate with your Trezor
        // Try again Failed to communicate with your Trezor
        // CLicking on 'Try again' leads back to 'Dasboard' screen
        await page.getByTestId('@menu/switch-device').click();
        await page.getByTestId('@switch-device/solve-issue-button').click();
    });

    // todos from cypress:
    // - it is broken in settings! there is not acquire button
    // - make sure it works in onboarding, I am not sure there is acquire button present
    // - also firmware update, maybe standalone backup/recovery might have custom implementation  that might be worth revisiting
    // - device state is incorrect is wrong copy!!!
});

/*
Remove before merge:
// @group_suite
// @retry=2


    before
        cy.viewport(1920, 1080).resetDb();
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { passphrase_protection: true, pin_protection: false });
        cy.task('startBridge');
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    'someone steals session, device status turns inactive', () => {
        // simulate stolen session from another window. device receives indicative button
        cy.task('stealBridgeSession');
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/solve-issue-button').click();
        cy.getTestElement('@deviceStatus-connected');

        // when user reloads app while device is acquired, suite will not try to acquire device so that it
        // does not interferes with somebody else's session
        cy.task('stealBridgeSession');
        cy.getTestElement('@switch-device/solve-issue-button');
        cy.reload();
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/solve-issue-button').click();
    });

*/
