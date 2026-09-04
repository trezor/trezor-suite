import type { NetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { DEVICE_RENDERED_EVM_INDENT } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Receive transaction', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ webClipboardRead: true });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    const testCases: Array<{
        coin: NetworkSymbol;
        category: TestCategory;
        addressFormat: RegExp;
        deviceDisplayPrefix: string;
    }> = [
        {
            coin: 'btc',
            category: TestCategory.BTC,
            addressFormat: /^(bc1[a-z0-9]{39,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
            deviceDisplayPrefix: '',
        },
        {
            coin: 'eth',
            category: TestCategory.ETH,
            addressFormat: /^ {2}0x[a-fA-F0-9]{40}$/,
            deviceDisplayPrefix: DEVICE_RENDERED_EVM_INDENT,
        },
        {
            coin: 'sol',
            category: TestCategory.Solana,
            addressFormat: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
            deviceDisplayPrefix: '',
        },
        {
            coin: 'trx',
            category: TestCategory.Coins,
            addressFormat: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
            deviceDisplayPrefix: '',
        },
    ];
    testCases.forEach(({ coin, category, addressFormat, deviceDisplayPrefix }) => {
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
            async ({ devicePrompt, settingsPage, walletPage, clipboard }) => {
                await test.step(`Enable ${coin.toUpperCase()} and open the receive tab`, async () => {
                    await settingsPage.changeNetworks({ enableNetworks: [coin] });
                    await walletPage.accountButton({ symbol: coin }).click();
                    await walletPage.receiveButton.click();
                });

                await test.step('Copy the receive address', async () => {
                    // Copying is the entry point to verification: it opens the prompt offering to
                    // verify the address that was just copied.
                    await walletPage.copyAddressButton.click();
                    await expect(walletPage.copyToCliboardToast).toBeVisible();
                    await expect(walletPage.addressCopiedModal).toBeVisible();
                });

                const address = await test.step('Verify the address on the device', async () => {
                    await walletPage.addressCopiedModalVerifyButton.click();
                    const displayedAddress = await devicePrompt.getAddressFromDisplay();
                    await devicePrompt.waitForPromptAndConfirm();
                    await expect(walletPage.addressCopiedModal).toBeHidden();

                    return displayedAddress;
                });

                await test.step('Verify the copied address matches the device display and QR code', async () => {
                    const clipboardText = await clipboard.read();
                    expect.soft(address).toEqual(`${deviceDisplayPrefix}${clipboardText}`);
                    expect.soft(address).toMatch(addressFormat);
                    await expect(walletPage.receiveQrCode).toHaveQrCodeValue(clipboardText);
                });
            },
        );
    });
});
