import { deviceActions } from '@suite-common/device';
import { TestCategory, TestPriority, createTestAnnotation } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';

test.describe('Onboarding - simulated entropy check failure', { tag: ['@T2T1'] }, () => {
    test.use({
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage, analyticsSection }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
        await analyticsSection.passThroughAnalytics();
    });

    test(
        'Device compromised (entropy-mismatch)',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that the proper modal is shown when entropy check fails during wallet creation.',
                category: TestCategory.Onboarding,
                priority: TestPriority.High,
            }),
        },
        async ({ page, device, onboardingPage, devicePrompt }) => {
            await page.ensureStoreOnDesktop();

            await page.evaluate(
                action => window.store.dispatch(action),
                deviceActions.setSimulatedEntropyCheckFail({
                    success: false,
                    error: { code: 'Failure_EntropyCheck', message: 'SIMULATED ERROR' },
                }),
            );

            await test.step('Start creating wallet', async () => {
                await onboardingPage.firmware.continueThroughFirmware();
                await onboardingPage.createWalletButton.click();
                await onboardingPage.selectSeedType('12-words');
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
            });

            await test.step('Land on entropy check failure', async () => {
                await expect(onboardingPage.deviceCompromisedModal).toBeVisible();
            });
        },
    );

    test(
        'Transport error (device disconnected during entropy check)',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that the proper modal is shown when entropy check gets interrupted by transport error during wallet creation.',
                category: TestCategory.Onboarding,
                priority: TestPriority.High,
            }),
        },
        async ({ page, device, onboardingPage, devicePrompt }) => {
            // note that this specific string is one of the ignored errors, see getIsIgnoredEntropyCheckError
            const mockedError = 'device disconnected during action';
            await page.ensureStoreOnDesktop();
            await page.evaluate(
                action => window.store.dispatch(action),
                deviceActions.setSimulatedEntropyCheckFail({
                    success: false,
                    error: { code: 'Failure_EntropyCheck', message: mockedError },
                }),
            );

            await test.step('Start creating wallet', async () => {
                await onboardingPage.firmware.continueThroughFirmware();
                await onboardingPage.createWalletButton.click();
                await onboardingPage.selectSeedType('12-words');
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
            });

            await test.step('Display error toast, but stay on the same screen (no device compromised)', async () => {
                await expect(page.getByTestId('@toast/error')).toContainText(mockedError);
                await page.waitForTimeout(500); // we do not expect any navigation, so ensure no navigation occurs
                await expect(onboardingPage.selectSeedConfirmButton).toBeVisible();
            });
        },
    );
});
