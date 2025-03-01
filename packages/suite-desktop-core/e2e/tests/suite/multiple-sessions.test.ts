import * as messages from '@trezor/protobuf/src/messages';
import { BridgeTransport } from '@trezor/transport';

import { expect, test } from '../../support/fixtures';
import { AnalyticsSection } from '../../support/pageObjects/analyticsSection';
import { DashboardPage } from '../../support/pageObjects/dashboardPage';
import { DevicePrompt } from '../../support/pageObjects/devicePrompt';
import { OnboardingPage } from '../../support/pageObjects/onboarding/onboardingPage';

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

const testCases = [
    {
        testName: 'Session overtaken by another - View-Only Disabled',
        enableViewOnly: false,
    },
    {
        testName: 'Session overtaken by another - View-Only Enabled',
        enableViewOnly: true,
    },
];

test.describe('Multiple sessions', { tag: ['@group=suite'] }, () => {
    test.use({ emulatorSetupConf: { passphrase_protection: true } });

    for (const { testName, enableViewOnly } of testCases) {
        test(testName, async ({ page, onboardingPage, dashboardPage, devicePrompt }) => {
            await onboardingPage.completeOnboarding({ enableViewOnly });
            await dashboardPage.discoveryShouldFinish();
            await test.step('Bridge session taken by another suite session', async () => {
                await stealBridgeSession();
                await expect(dashboardPage.deviceStatus).toHaveText('Refresh');
                await dashboardPage.deviceSwitchingOpenButton.click();
                // TODO: #16601 Uncomment once fixed
                // await expect(dashboardPage.deviceStatusOnSwitchDevice).toHaveText('Refresh');
                await expect(dashboardPage.walletAtIndex(0)).not.toBeVisible();
            });

            await test.step('Take Bridge session back', async () => {
                await dashboardPage.solveIssuesButton.click();
                await expect(dashboardPage.deviceStatusOnSwitchDevice).toHaveText('Connected');
                await expect(dashboardPage.walletAtIndex(0)).toBeVisible();
                await dashboardPage.deviceSwitchingCloseButton.click();
                await expect(dashboardPage.deviceStatus).toHaveText('Connected');
            });

            await test.step('Reload inactive suite session', async () => {
                await stealBridgeSession();
                await expect(dashboardPage.deviceStatus).toHaveText('Refresh');
                await page.reload();
            });

            if (!enableViewOnly) {
                await test.step('After reloading inactive suite session does not take Bridge session back', async () => {
                    await expect(devicePrompt.connectDevicePrompt).toHaveText(
                        'Failed to communicate with your Trezor',
                    );
                });

                // This is where the flow ends for view-only disabled
                return;
            }

            await test.step('After reloading inactive suite session does not take Bridge session back', async () => {
                await expect(dashboardPage.deviceStatus).toHaveText('Disconnected');
                await dashboardPage.deviceSwitchingOpenButton.click();
                await expect(dashboardPage.deviceStatusOnSwitchDevice).toHaveText('Disconnected');
            });

            await test.step('Take Bridge session back', async () => {
                await dashboardPage.solveIssuesButton.click();
                await expect(dashboardPage.deviceStatusOnSwitchDevice).toHaveText('Connected');
            });
        });
    }

    test(
        'Overtake session by opening suite new tab',
        { tag: ['@webOnly'] },
        async ({ context, onboardingPage, dashboardPage }, testInfo) => {
            await onboardingPage.completeOnboarding();
            await dashboardPage.discoveryShouldFinish();

            const pageTwo = await context.newPage();
            await pageTwo.context().addInitScript(() => {
                window.Playwright = true;
            });
            await pageTwo.goto('./');
            const analyticsSectionTwo = new AnalyticsSection(pageTwo);
            const devicePromptTwo = new DevicePrompt(pageTwo);
            const onboardingPageTwo = new OnboardingPage(
                pageTwo,
                onboardingPage.model,
                testInfo,
                devicePromptTwo,
                analyticsSectionTwo,
            );
            await onboardingPageTwo.completeOnboarding();
            const dashboardPageTwo = new DashboardPage(pageTwo, devicePromptTwo);
            await dashboardPageTwo.discoveryShouldFinish();
            await expect(dashboardPageTwo.deviceStatus).toHaveText('Connected');
            await expect(dashboardPage.deviceStatus).toHaveText('Refresh');

            await pageTwo.close();
        },
    );

    // todo: test what happens if you steal session and navigate directly to device settings (web)
    // todo: test the same for other routes as well (/recovery, /backup, etc..)
});
