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

    const testCases: Array<{ coin: NetworkSymbol; category: TestCategory; addressFormat: RegExp }> =
        [
            {
                coin: 'btc',
                category: TestCategory.BTC,
                addressFormat: /^(bc1[a-z0-9]{39,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
            },
            { coin: 'eth', category: TestCategory.ETH, addressFormat: /^0x[a-fA-F0-9]{40}$/ },
            {
                coin: 'sol',
                category: TestCategory.Solana,
                addressFormat: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
            },
            {
                coin: 'trx',
                category: TestCategory.Coins,
                addressFormat: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
            },
        ];
    testCases.forEach(({ coin, category, addressFormat }) => {
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
                expect.soft(clipboardText).toEqual(address);
                expect.soft(address).toMatch(addressFormat);
            },
        );
    });
});
