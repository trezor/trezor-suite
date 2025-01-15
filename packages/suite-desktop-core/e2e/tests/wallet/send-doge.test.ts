import { test, expect } from '../../support/fixtures';

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
        await settingsPage.navigateTo('coins');
        await settingsPage.coins.disableNetwork('btc');
        await settingsPage.coins.enableNetwork('doge');
        await settingsPage.coins.openNetworkAdvanceSettings('doge');
        await settingsPage.coins.changeBackend('blockbook', blockbookMock.url);
        await settingsPage.coins.activateCoinsButton.click();
        await dashboardPage.discoveryShouldFinish();
        await dashboardPage.navigateTo();
    });

    test.afterEach(({ blockbookMock }) => {
        blockbookMock.stop();
    });

    test('Cannot send amount exceeding MAX_SAFE_INTEGER', async ({
        page,
        trezorUserEnvLink,
        walletPage,
        marketPage,
        devicePrompt,
    }) => {
        await test.step('Open send form for Doge', async () => {
            await walletPage.accountButton({ symbol: 'doge' }).click();
            await walletPage.sendButton.click();
        });

        await test.step('Fill amount over MAX_SAFE_INTEGER and send', async () => {
            await marketPage.broadcastButton.click();
            await marketPage.sendAddressInput.fill(recipientAddress);
            await marketPage.sendAmountInput.fill(sendAmount);
            await marketPage.sendButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
        });

        await test.step('Verify info on modals and confirm', async () => {
            await expect(devicePrompt.modal).toHaveScreenshot('send-doge.png');
            await expect(
                page.getByTestId('@modal/output-total').getByTestId('@modal/output-value'),
            ).toContainText(`${totalAmount} DOGE`);
            await expect(
                page.getByTestId('@modal/output-fee').getByTestId('@modal/output-value'),
            ).toContainText(`${feeAmount} DOGE`);
            await trezorUserEnvLink.pressYes();
            await expect(devicePrompt.modal).toHaveScreenshot('send-doge-confirmed.png');
            await trezorUserEnvLink.pressYes();
        });

        await expect(page.getByTestId('@toast/sign-tx-error')).toHaveText(
            'Transaction signing error: Invalid amount specified',
        );
    });
});
