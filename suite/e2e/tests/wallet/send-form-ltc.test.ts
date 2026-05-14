import { test } from '../../support/fixtures';

test.describe('LTC send form with mocked blockbook', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });
    test.beforeEach(
        async ({ page, dashboardPage, onboardingPage, settingsPage, blockbookMock }) => {
            await onboardingPage.completeOnboarding();

            await settingsPage.navigateTo('coins');
            await blockbookMock.start('ltc');

            await settingsPage.coinsTab.enableNetwork('ltc');
            await settingsPage.coinsTab.openNetworkAdvanceSettings('ltc');
            await settingsPage.coinsTab.changeBackend('blockbook', blockbookMock.url);

            await dashboardPage.dashboardMenuButton.click();
            await page.discoveryShouldFinish();
        },
    );

    test('spend output originating from mimble-wimble peg out tx', async ({
        page,
        devicePrompt,
        walletPage,
        tradingPage,
    }) => {
        await walletPage.openAccount({ symbol: 'ltc', type: 'normal', atIndex: 0 });
        await walletPage.openSendFormButton.click();
        await page.getByTestId('@send/header-dropdown').click();
        await page.getByTestId('@send/header-dropdown/broadcast').click();
        await tradingPage.sendAddressInput.fill('ltc1q0lqwsyygg9frql6ujjfhevfculsxwledvv6yzc');
        await page.getByTestId('outputs.0.setMax').click();
        await tradingPage.sendButton.click();
        await devicePrompt.waitForPromptAndConfirm();
    });
});
