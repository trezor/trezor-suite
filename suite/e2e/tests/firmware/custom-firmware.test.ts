import path from 'node:path';

import { expect, test } from '../../support/fixtures';

const firmwarePath = path.join(__dirname, '../../fixtures/trezor-2.5.1.bin');

test.describe('Custom firmware', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test('Custom firmware installation', async ({ settingsPage }) => {
        await settingsPage.device.openCustomFirmwareModal();
        await settingsPage.device.selectCustomFirmware(firmwarePath);
        await settingsPage.device.completeCustomFirmwareInstallation();
        await expect(settingsPage.device.firmwareReconnectDevice).toBeVisible();
    });
});
