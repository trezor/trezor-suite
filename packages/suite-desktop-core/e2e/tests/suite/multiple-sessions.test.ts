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

const testCases = [
    {
        description: 'Multiple sessions for view-only disabled',
        enableViewOnly: false,
    },
    {
        description: 'Multiple sessions for view-only enabled',
        enableViewOnly: true,
    },
];

test.describe('Multiple sessions', { tag: ['@group=suite'] }, () => {
    test.use({ emulatorSetupConf: { passphrase_protection: true } });

    for (const { description, enableViewOnly } of testCases) {
        test(description, async ({ page, onboardingPage, dashboardPage }) => {
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

            // This is where the flow ends for view-only disabled
            if (!enableViewOnly) {
                return;
            }

            await test.step('Reloading inactive suite session does not take Bridge session back', async () => {
                await stealBridgeSession();
                await expect(dashboardPage.deviceStatus).toHaveText('Refresh');
                await page.reload();
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
});
