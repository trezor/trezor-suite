import { NetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Receive transaction', { tag: ['@T3W1', '@T3T1', '@smoke'] }, () => {
    test.use({
        contextOptions: {
            permissions: ['clipboard-read', 'clipboard-write'],
        },
    });
    test.beforeEach(async ({ onboardingPage, settingsPage, page }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('application');
        await settingsPage.experimentalFeaturesSwitch.click();
        await page.getByTestId('@settings/experimental-features/tron-view-only-checkbox').click();
    });

    const testCases: Array<{ coin: NetworkSymbol; category: TestCategory }> = [
        { coin: 'btc', category: TestCategory.BTC },
        { coin: 'eth', category: TestCategory.ETH },
        { coin: 'sol', category: TestCategory.Solana },
        { coin: 'trx', category: TestCategory.Coins },
    ];
    testCases.forEach(({ coin, category }) => {
        test(
            `Receive a ${coin.toUpperCase()} transaction`,
            {
                annotation: createTestAnnotation({
                    testCase: `Verifies that a user can receive a ${coin.toUpperCase()} transaction.`,
                    category,
                    priority: TestPriority.Critical,
                    stream: TestStream.Engagement,
                }),
            },
            async ({ page, devicePrompt, settingsPage, walletPage }) => {
                if (coin !== 'btc') {
                    await settingsPage.changeNetworks({
                        enableNetworks: [coin],
                        disableNetworks: ['btc'],
                    });
                }
                await walletPage.accountButton({ symbol: coin }).click();
                await walletPage.receiveButton.click();
                await walletPage.revealAddressButton.click();
                const address = await devicePrompt.getAddressFromDisplay();
                await devicePrompt.waitForPromptAndConfirm();
                await walletPage.copyAddressButton.click();
                await expect(walletPage.copyToCliboardToast).toBeVisible();
                const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
                expect(clipboardText).toEqual(address);
            },
        );
    });
});
