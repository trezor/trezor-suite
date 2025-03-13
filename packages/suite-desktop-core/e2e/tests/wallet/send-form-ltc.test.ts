import { test } from '../../support/fixtures';

test.describe('LTC send form with mocked blockbook', { tag: ['@group=wallet'] }, () => {
    test.use({
        emulatorSetupConf: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });
    test.beforeEach(async ({ dashboardPage, onboardingPage, settingsPage, blockbookMock }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();

        await settingsPage.navigateTo('coins');
        await blockbookMock.start('ltc');

        await settingsPage.coins.disableNetwork('btc');
        await settingsPage.coins.enableNetwork('ltc');
        await settingsPage.coins.openNetworkAdvanceSettings('ltc');
        await settingsPage.coins.changeBackend('blockbook', blockbookMock.url);

        await dashboardPage.dashboardMenuButton.click();
        await dashboardPage.discoveryShouldFinish();
    });

    test('spend output originating from mimble-wimble peg out tx', async ({
        page,
        devicePrompt,
        walletPage,
        tradingPage,
    }) => {
        await walletPage.openAccount({ symbol: 'ltc', type: 'normal', atIndex: 0 });
        await walletPage.openSendFormButton.click();
        await tradingPage.broadcastButton.click();
        await tradingPage.sendAddressInput.fill('ltc1q0lqwsyygg9frql6ujjfhevfculsxwledvv6yzc');
        await page.getByTestId('outputs.0.setMax').click();
        await tradingPage.sendButton.click();
        await devicePrompt.waitForPromptAndConfirm();
    });
});
