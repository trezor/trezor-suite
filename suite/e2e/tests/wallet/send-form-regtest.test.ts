import { expect, test } from '../../support/fixtures';

test.describe('Send form for bitcoin', { tag: ['@T3W1', '@T3T1'] }, () => {
    const ADDRESS_INDEX_1 = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';

    test.use({
        deviceSetup: {
            mnemonic: 'mnemonic_all',
        },
    });
    test.beforeEach(
        async ({ onboardingPage, dashboardPage, settingsPage, walletPage, trezorUserEnv }) => {
            await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });

            await settingsPage.toggleTestnetNetworks();
            await settingsPage.navigateTo('coins');
            await settingsPage.coinsTab.enableNetwork('regtest');

            await trezorUserEnv.sendToAddressAndMineBlock({
                address: ADDRESS_INDEX_1,
                btc_amount: 1,
            });
            await trezorUserEnv.mineBlocks({ block_amount: 1 });
            await dashboardPage.dashboardMenuButton.click();
            await walletPage.openAccount({ symbol: 'regtest' });
            await walletPage.openSendFormButton.click();
        },
    );

    test('add and remove output in send form, toggle form options, input data', async ({
        page,
        device,
        tradingPage,
    }) => {
        // test adding and removing outputs
        await tradingPage.sendAmountInput.fill('0.3');
        await page.getByTestId('add-output').click();
        await page.getByTestId('outputs.1.amount').fill('0.6');
        await page.getByTestId('outputs.0.remove').click();

        await expect(tradingPage.sendAmountInput).toBeVisible();
        await expect(page.getByTestId('outputs.1.amount')).toBeHidden();

        await tradingPage.sendAddressInput.fill(ADDRESS_INDEX_1);

        // add locktime
        await page.getByTestId('@send/header-dropdown').click();
        await page.getByTestId('@send/header-dropdown/locktime').click();
        await page.getByTestId('locktime-option/input').click();
        await page.getByTestId('locktime-option/option/block').click();
        await page.getByTestId('locktime-blockheight-input').fill('1000');

        await tradingPage.sendButton.click();
        await device.pressYes();
        await device.pressYes();
        await device.pressYes();

        await expect(page.getByTestId('@send/copy-raw-transaction')).toBeVisible();
    });

    test('switch display units to satoshis, fill a form in satoshis and send', async ({
        page,
        walletPage,
        tradingPage,
    }) => {
        await expect(walletPage.sendFormHeader).toBeVisible();
        await page.getByTestId('amount-unit-switch/regtest').click();

        await tradingPage.sendAmountInput.fill('300');
        await page.getByTestId('add-output').click();
        await page.getByTestId('outputs.1.amount').fill('600');
        await page.getByTestId('outputs.0.remove').click();

        await expect(tradingPage.sendAmountInput).toBeVisible();
        await expect(page.getByTestId('outputs.1.amount')).toBeHidden();

        await tradingPage.sendAddressInput.fill(ADDRESS_INDEX_1);
    });

    test('send tx with OP_RETURN output', async ({ page, device, tradingPage, devicePrompt }) => {
        await tradingPage.sendAmountInput.fill('0.1');
        await tradingPage.sendAddressInput.fill(ADDRESS_INDEX_1);

        await page.getByTestId('@send/header-dropdown').click();
        await page.getByTestId('@send/header-dropdown/opreturn').click();

        await page.getByTestId('outputs.1.dataAscii').fill('meow');

        await tradingPage.sendButton.click();
        await device.pressYes();
        await device.pressYes();
        await device.pressYes();
        await device.pressYes();
        await device.pressYes();

        await devicePrompt.sendButton.click();
        await expect(
            page
                .getByTestId('@wallet/accounts/transaction-list/pending/group/0')
                .getByTestId('@wallet/transaction/target-address')
                .first(),
        ).toContainText('OP_RETURN (meow)');
    });
});
