import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';
import { BigNumber } from '@trezor/utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { transformAddress } from '../../support/testExtends/customMatchers';

test.describe('Send form for bitcoin', { tag: ['@T3W1', '@T3T1'] }, () => {
    const ADDRESS_INDEX_1 = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';

    test.use({
        deviceSetup: {
            mnemonic: 'mnemonic_all',
        },
    });

    test.beforeEach(
        async ({
            page,
            onboardingPage,
            dashboardPage,
            settingsPage,
            walletPage,
            trezorUserEnv,
        }) => {
            await onboardingPage.completeOnboarding();
            await settingsPage.navigateTo('application');
            await settingsPage.toggleDebugModeInSettings();

            await settingsPage.toggleTestnetNetworks();
            await settingsPage.changeNetworks({
                enableNetworks: [asNetworkSymbol('regtest')],
                skipActivation: true,
            });
            await trezorUserEnv.sendToAddressAndMineBlock({
                address: ADDRESS_INDEX_1,
                btc_amount: 1,
            });
            await trezorUserEnv.mineBlocks({ block_amount: 1 });
            await dashboardPage.dashboardMenuButton.click();
            await page.discoveryShouldFinish();
            await walletPage.openAccount({ symbol: asNetworkSymbol('regtest') });
            await walletPage.openSendFormButton.click();
        },
    );

    test(
        'add and remove output in send form, toggle form options, input data',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ page, device, tradingPage, devicePrompt }) => {
            // test adding and removing outputs
            await tradingPage.sendAmountInput.fill('0.3');
            await page.getByTestId('add-output').click();
            await page.getByTestId('outputs.1.amount').fill('0.6');
            await page.getByTestId('outputs.0.remove').click();

            await expect(tradingPage.sendAmountInput).toBeVisible();
            await expect(page.getByTestId('outputs.1.amount')).toBeHidden();

            await tradingPage.sendAddressInput.fill(ADDRESS_INDEX_1);

            // add locktime
            await page.selectDropdownOptionWithRetry(
                page.getByTestId('@send/header-dropdown'),
                page.getByTestId('@send/header-dropdown/locktime'),
            );
            await page.selectDropdownOptionWithRetry(
                page.getByTestId('locktime-option/input'),
                page.getByTestId('locktime-option/option/block'),
            );
            await page.getByTestId('locktime-blockheight-input').fill('1000');

            await tradingPage.sendButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [transformAddress(ADDRESS_INDEX_1, 'fourTetragrams')],
                    actions: { right_button: 'Continue' },
                },
                T3T1: {
                    header: { title: 'Address', subtitle: 'Recipient #1' },
                },
            });
            await device.pressYes();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [['Amount'], ['0.6 REGTEST']],
                    actions: { right_button: 'Confirm' },
                },
                T3T1: {
                    header: { title: 'Amount', subtitle: 'Recipient #1' },
                    body: [['0.6 REGTEST']],
                },
            });
            await device.pressYes();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Confirm Locktime' },
                    body: [['Locktime set to blockheight'], ['1000']],
                    actions: { right_button: 'Confirm' },
                },
            });
            await device.pressYes();

            await expect(page.getByTestId('@send/copy-raw-transaction')).toBeVisible();
        },
    );

    test(
        'switch display units to satoshis, fill a form in satoshis and send',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ page, walletPage, tradingPage }) => {
            await expect(walletPage.sendFormHeader).toBeVisible();
            await page.getByTestId('amount-unit-switch/regtest').click();

            await tradingPage.sendAmountInput.fill('300');
            await page.getByTestId('add-output').click();
            await page.getByTestId('outputs.1.amount').fill('600');
            await page.getByTestId('outputs.0.remove').click();

            await expect(tradingPage.sendAmountInput).toBeVisible();
            await expect(page.getByTestId('outputs.1.amount')).toBeHidden();

            await tradingPage.sendAddressInput.fill(ADDRESS_INDEX_1);
        },
    );

    test(
        'send tx with OP_RETURN output',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ page, device, tradingPage, devicePrompt }) => {
            await tradingPage.sendAmountInput.fill('0.1');
            await tradingPage.sendAddressInput.fill(ADDRESS_INDEX_1);

            await page.getByTestId('@send/header-dropdown').click();
            await page.getByTestId('@send/header-dropdown/opreturn').click();

            await page.getByTestId('outputs.1.dataAscii').fill('meow');

            await tradingPage.sendButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [transformAddress(ADDRESS_INDEX_1, 'fourTetragrams')],
                    actions: { right_button: 'Continue' },
                },
                T3T1: {
                    header: { title: 'Address', subtitle: 'Recipient #1' },
                },
            });
            await device.pressYes();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [['Amount'], ['0.1 REGTEST']],
                    actions: { right_button: 'Confirm' },
                },
                T3T1: {
                    header: { title: 'Amount', subtitle: 'Recipient #1' },
                    body: [['0.1 REGTEST']],
                },
            });
            await device.pressYes();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'OP_RETURN' },
                    body: [['6d656f77']],
                    actions: { right_button: 'Confirm' },
                },
            });
            await device.pressYes();
            const fee = await devicePrompt.cryptoAmountOf('fee').innerText();
            const total = new BigNumber(fee).plus('0.1').toString();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [
                        ['Total amount'],
                        device.wrapText(`${total} REGTEST`, { isAmount: true }),
                        ['incl. Transaction fee'],
                        device.wrapText(`${fee} REGTEST`, { isAmount: true }),
                    ],
                    actions: { right_button: 'Hold to sign' },
                },
                T3T1: {
                    header: { title: 'Summary' },
                },
            });
            await device.pressYes();
            await device.pressYes();

            await devicePrompt.sendButton.click();
            await expect(
                page
                    .getByTestId('@wallet/accounts/transaction-list/pending/group/0')
                    .getByTestId('@wallet/transaction/target-address')
                    .first(),
            ).toContainText('OP_RETURN (meow)');
        },
    );
});
