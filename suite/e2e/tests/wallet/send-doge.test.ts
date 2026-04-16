import { localizeNumber } from '@suite-common/wallet-utils';

import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';

test.describe('Doge Send', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic:
                'fantasy auto fancy access ring spring patrol expect common tape talent annual',
        },
    });

    const recipientAddress = 'DJk8vtoEuNGtT4YRNoqVxWyRh6kM3s8bzc';
    const sendAmount = '115568568500';
    const feeAmount = '0.01450643';
    const totalAmount = '115,568,568,500.01450643';

    test.beforeEach(
        async ({ page, onboardingPage, settingsPage, dashboardPage, blockbookMock }) => {
            await blockbookMock.start('doge');
            await onboardingPage.completeOnboarding();
            await settingsPage.navigateTo('coins');
            await settingsPage.coinsTab.enableNetwork('doge');
            await settingsPage.coinsTab.openNetworkAdvanceSettings('doge');
            await settingsPage.coinsTab.changeBackend('blockbook', blockbookMock.url);
            await dashboardPage.navigateTo();
            await page.discoveryShouldFinish();
        },
    );

    test('Cannot send amount exceeding MAX_SAFE_INTEGER', async ({
        page,
        device,
        walletPage,
        tradingPage,
        devicePrompt,
    }) => {
        await test.step('Open send form for Doge', async () => {
            await walletPage.openAccount({ symbol: 'doge' });
            await walletPage.openSendFormButton.click();
        });

        await test.step('Fill amount over MAX_SAFE_INTEGER and send', async () => {
            await page.getByTestId('@send/header-dropdown').click();
            await page.getByTestId('@send/header-dropdown/broadcast').click();
            await tradingPage.sendAddressInput.fill(recipientAddress);
            await tradingPage.sendAmountInput.fill(sendAmount);
            await tradingPage.sendButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
        });

        await test.step('Verify info on modals and confirm', async () => {
            await device.pressYes();
            await expect(devicePrompt.outputValueOf('amount')).toContainText(
                `${localizeNumber(sendAmount)} DOGE`,
            );
            await expect(devicePrompt.outputValueOf('total')).toContainText(`${totalAmount} DOGE`);
            await expect(devicePrompt.outputValueOf('fee')).toContainText(`${feeAmount} DOGE`);
            await expect(devicePrompt.outputValueOf('address')).toHaveText(
                formatAddressWithNewlines(recipientAddress),
            );
            await device.pressYes();
            await device.pressYes();
        });

        await expect(page.getByTestId('@toast/sign-tx-error')).toHaveText(
            'Transaction signing error: Invalid amount specified',
        );
    });
});
