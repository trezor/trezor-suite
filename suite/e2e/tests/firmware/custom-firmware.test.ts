import path from 'node:path';

import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const firmwarePath = path.join(__dirname, '../../fixtures/trezor-2.5.1.bin');

test.describe('Custom firmware', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test(
        'Custom firmware installation',
        { annotation: createTestAnnotation({ stream: TestStream.Firmware }) },
        async ({ settingsPage }) => {
            await settingsPage.deviceTab.openCustomFirmwareModal();
            await settingsPage.deviceTab.selectCustomFirmware(firmwarePath);
            await settingsPage.deviceTab.completeCustomFirmwareInstallation();
            await expect(settingsPage.deviceTab.firmwareReconnectDevice).toBeVisible();
        },
    );
});
