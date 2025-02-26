import { expect, test } from '../../support/fixtures';

test.describe('Send form for bitcoin', { tag: ['@group=wallet'] }, () => {
    const ADDRESS_INDEX_1 = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';

    test.use({
        emulatorSetupConf: {
            needs_backup: true,
            mnemonic: 'mnemonic_all',
        },
    });
    test.beforeEach(
        async ({ onboardingPage, dashboardPage, settingsPage, walletPage, trezorUserEnvLink }) => {
            await onboardingPage.completeOnboarding();
            await dashboardPage.discoveryShouldFinish();

            await settingsPage.navigateTo('coins');
            await settingsPage.coins.enableNetwork('regtest');

            await trezorUserEnvLink.sendToAddressAndMineBlock({
                address: ADDRESS_INDEX_1,
                btc_amount: 1,
            });
            await trezorUserEnvLink.mineBlocks({ block_amount: 1 });

            await dashboardPage.dashboardMenuButton.click();
            await walletPage.accountButton({ symbol: 'regtest' }).click();
            await walletPage.openSendFormButton.click();
        },
    );

    test('add and remove output in send form, toggle form options, input data', async ({
        page,
        marketPage,
        trezorUserEnvLink,
    }) => {
        // test adding and removing outputs
        await marketPage.sendAmountInput.fill('0.3');
        await page.getByTestId('add-output').click();
        await page.getByTestId('outputs.1.amount').fill('0.6');
        await page.getByTestId('outputs.0.remove').click();

        await expect(marketPage.sendAmountInput).toBeVisible();
        await expect(page.getByTestId('outputs.1.amount')).not.toBeVisible();

        await marketPage.sendAddressInput.fill(ADDRESS_INDEX_1);

        // add locktime
        await page.getByTestId('add-locktime-button').click();
        await page.getByTestId('locktime-input').fill('1000');

        await marketPage.sendButton.click();
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.pressYes();

        await expect(page.getByTestId('@send/copy-raw-transaction')).toBeVisible();
    });

    test('switch display units to satoshis, fill a form in satoshis and send', async ({
        page,
        marketPage,
    }) => {
        await page.getByTestId('amount-unit-switch/regtest').click();

        await marketPage.sendAmountInput.fill('300');
        await page.getByTestId('add-output').click();
        await page.getByTestId('outputs.1.amount').fill('600');
        await page.getByTestId('outputs.0.remove').click();

        await expect(marketPage.sendAmountInput).toBeVisible();
        await expect(page.getByTestId('outputs.1.amount')).not.toBeVisible();

        await marketPage.sendAddressInput.fill(ADDRESS_INDEX_1);
    });

    test('send tx with OP_RETURN output', async ({
        page,
        marketPage,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        await marketPage.sendAmountInput.fill('0.1');
        await marketPage.sendAddressInput.fill(ADDRESS_INDEX_1);

        await page.getByTestId('@send/header-dropdown').click();
        await page.getByTestId('@send/header-dropdown/opreturn').click();

        await page.getByTestId('outputs.1.dataAscii').fill('meow');

        await marketPage.sendButton.click();
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.pressYes();

        await devicePrompt.sendButton.click();
        await expect(
            page.getByTestId('@wallet/accounts/transaction-list/pending/group/0'),
        ).toContainText('OP_RETURN (meow)');
    });
});
