import { TestCategory, TestPriority } from '@trezor/e2e-utils';
import * as messages from '@trezor/protobuf/src/messages';
import { BridgeTransport } from '@trezor/transport';

import { expect, test } from '../../support/fixtures';
import { DashboardPage } from '../../support/pageObjects/dashboardPage';
import { DevicePrompt } from '../../support/pageObjects/devicePrompt';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { enhancePage } from '../../support/testExtends/enhancePage';

const stealBridgeSession = async () => {
    await test.step('Steal Bridge session', async () => {
        const bridge = new BridgeTransport({ messages, id: 'foo-bar' });
        await bridge.init();
        const enumerateRes = await bridge.enumerate();
        if (!enumerateRes.success) return null;
        await bridge.acquire({
            input: { path: enumerateRes.payload[0].path, previous: null },
        });
    });
};

test.describe('Multiple sessions', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { passphrase_protection: true } });
    test(
        'Session overtaken by another',
        {
            annotation: createTestAnnotation({
                testCase: `Verifies that a user can successfully take over a session.`,
                category: TestCategory.Wallets,
                priority: TestPriority.Medium,
            }),
        },
        async ({ page, onboardingPage, dashboardPage }) => {
            await onboardingPage.completeOnboarding();
            await test.step('Bridge session taken by another suite session', async () => {
                await stealBridgeSession();
                await expect(dashboardPage.deviceStatus).toHaveTranslation('TR_USE_HERE');
                await dashboardPage.deviceSwitchingOpenButton.click();
                await expect(dashboardPage.deviceStatusOnSwitchDevice).toHaveTranslation(
                    'TR_USE_HERE',
                );
                await expect(dashboardPage.walletAtIndex(0)).toBeVisible();
            });

            await test.step('Take Bridge session back', async () => {
                await dashboardPage.solveIssuesButton.click();
                await expect(dashboardPage.deviceStatusOnSwitchDevice).toHaveTranslation(
                    'TR_CONNECTED',
                );
                await expect(dashboardPage.walletAtIndex(0)).toBeVisible();
                await dashboardPage.deviceSwitchingCloseButton.click();
                await expect(dashboardPage.deviceStatus).toHaveTranslation('TR_CONNECTED');
            });

            await test.step('Reload inactive suite session to take Bridge session back', async () => {
                await stealBridgeSession();
                await expect(dashboardPage.deviceStatus).toHaveTranslation('TR_USE_HERE');
                await page.reload();
                await expect(page.getByTestId('@deviceStatus-connected').first()).toBeVisible({
                    timeout: 30_000,
                });
            });
        },
    );

    test(
        'Overtake session by opening suite new tab',
        {
            tag: ['@webOnly', '@T3W1', '@T3T1'],
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can successfully take over a session by opening suite in new tab.',
                category: TestCategory.Wallets,
                priority: TestPriority.Medium,
            }),
        },
        async ({ context, device, onboardingPage, dashboardPage }) => {
            await onboardingPage.completeOnboarding();

            const pageTwo = await context.newPage();
            context.grantPermissions(['local-network-access']);
            enhancePage(pageTwo);
            await pageTwo.context().addInitScript(() => {
                window.Playwright = true;
            });
            await pageTwo.goto('./');
            const devicePromptTwo = new DevicePrompt(pageTwo, device);

            const dashboardPageTwo = new DashboardPage(pageTwo, device, devicePromptTwo);
            await expect(dashboardPageTwo.deviceStatus).toHaveTranslation('TR_CONNECTED', {
                timeout: 30_000, // Longer timeout needed here to wait for page load and session restore
            });
            await expect(dashboardPage.deviceStatus).toHaveTranslation('TR_USE_HERE');

            await pageTwo.close();
        },
    );
});
