import { localizeNumber } from '@suite-common/wallet-utils';

import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

test.describe('Doge Send', { tag: ['@group=wallet', '@snapshot'] }, () => {
    test.use({
        emulatorSetupConf: {
            mnemonic:
                'fantasy auto fancy access ring spring patrol expect common tape talent annual',
        },
    });

    const recipientAddress = 'DJk8vtoEuNGtT4YRNoqVxWyRh6kM3s8bzc';
    const sendAmount = '115568568500';
    const feeAmount = '0.01450643';
    const totalAmount = '115,568,568,500.01450643';

    test.beforeEach(async ({ onboardingPage, settingsPage, dashboardPage, blockbookMock }) => {
        await blockbookMock.start('doge');
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await settingsPage.navigateTo('coins');
        await settingsPage.coins.disableNetwork('btc');
        await settingsPage.coins.enableNetwork('doge');
        await settingsPage.coins.openNetworkAdvanceSettings('doge');
        await settingsPage.coins.changeBackend('blockbook', blockbookMock.url);
        await dashboardPage.navigateTo();
        await dashboardPage.discoveryShouldFinish();
    });

    test('Cannot send amount exceeding MAX_SAFE_INTEGER', async ({
        page,
        trezorUserEnvLink,
        walletPage,
        tradingPage,
        devicePrompt,
    }) => {
        await test.step('Open send form for Doge', async () => {
            await walletPage.openAccount({ symbol: 'doge' });
            await walletPage.openSendFormButton.click();
        });

        await test.step('Fill amount over MAX_SAFE_INTEGER and send', async () => {
            await tradingPage.broadcastButton.click();
            await tradingPage.sendAddressInput.fill(recipientAddress);
            await tradingPage.sendAmountInput.fill(sendAmount);
            await tradingPage.sendButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
        });

        await test.step('Verify info on modals and confirm', async () => {
            await trezorUserEnvLink.pressYes();
            await expect(devicePrompt.outputValueOf('amount')).toContainText(
                `${localizeNumber(sendAmount)} DOGE`,
            );
            await expect(devicePrompt.outputValueOf('total')).toContainText(`${totalAmount} DOGE`);
            await expect(devicePrompt.outputValueOf('fee')).toContainText(`${feeAmount} DOGE`);
            await expect(devicePrompt.outputValueOf('address')).toHaveText(
                formatAddress(recipientAddress),
            );
            // await expect(devicePrompt.modal).toHaveScreenshot('send-doge.png');
            await trezorUserEnvLink.pressYes();
            // await expect(devicePrompt.modal).toHaveScreenshot('send-doge-confirmed.png');
            await trezorUserEnvLink.pressYes();
        });

        await expect(page.getByTestId('@toast/sign-tx-error')).toHaveText(
            'Transaction signing error: Invalid amount specified',
        );
    });
});
