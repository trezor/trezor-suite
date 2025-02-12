import { EventType } from '@trezor/suite-analytics';
import { ExtractByEventType } from '@trezor/suite-web/e2e/support/types';
import { splitStringEveryNCharacters } from '@trezor/utils';

import { expect, test } from '../../support/fixtures';

const abcAddr = 'bc1qpyfvfvm52zx7gek86ajj5pkkne3h385ada8r2y';
const defAddr = 'bc1qek0hazgrelpuce8anp72ur4kpgel74ype3pw52';

test.describe('Passphrase', { tag: ['@group=passphrase'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all', passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    // add hidden wallet (abc)
    // check 1st address
    // switch to 2nd hidden wallet (def)
    // check 1st address
    // go back to 1st hidden wallet
    // check confirm passphrase appears.
    test('basic flow', async ({
        page,
        analytics,
        dashboardPage,
        walletPage,
        trezorUserEnvLink,
    }) => {
        // add 1st hidden wallet
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.addUnusedHiddenWallet('abc');

        await analytics.interceptAnalytics();

        await walletPage
            .accountButton({
                symbol: 'btc',
                type: 'normal',
                atIndex: 0,
            })
            .click();
        await walletPage.receiveButton.click();
        await walletPage.revealAddressButton.click();
        await expect(page.getByTestId('@modal/output-value')).toContainText(
            splitStringEveryNCharacters(abcAddr, 4).join(' '),
        );
        await trezorUserEnvLink.pressYes(); // confirm address

        await expect(page.getByTestId('@metadata/copy-address-button')).toBeVisible();
        await expect(page.getByTestId('@metadata/copy-address-button')).not.toBeDisabled();

        await page.getByTestId('@modal/close-button').click();

        // add 2nd hidden wallet
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.addUnusedHiddenWallet('def');

        const selectWalletEvent = analytics.findAnalyticsEventByType<
            ExtractByEventType<EventType.SelectWalletType>
        >(EventType.SelectWalletType);
        expect(selectWalletEvent.type).toEqual('hidden');

        // go to receive
        await walletPage.receiveButton.click();

        // no address should be in table yet
        await expect(page.getByTestId('@wallet/receive/used-address/0')).not.toBeVisible();
        await expect(walletPage.revealAddressButton).not.toBeDisabled();

        await walletPage.revealAddressButton.click();
        await expect(page.getByTestId('@modal/output-value')).toContainText(
            splitStringEveryNCharacters(defAddr, 4).join(' '),
        );
        await trezorUserEnvLink.pressYes(); // confirm address

        await expect(page.getByTestId('@metadata/copy-address-button')).toBeVisible();
        await expect(page.getByTestId('@metadata/copy-address-button')).not.toBeDisabled();

        await page.getByTestId('@modal/close-button').click();

        // now go back to the 1st wallet, which is cached in device
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.walletAtIndex(1).click();
        await walletPage.receiveButton.click();

        // no address should be in table yet
        await expect(page.getByTestId('@wallet/receive/used-address/0')).not.toBeVisible();
        await expect(walletPage.revealAddressButton).not.toBeDisabled();

        await walletPage.revealAddressButton.click();
        await expect(page.getByTestId('@modal/output-value')).toContainText(
            splitStringEveryNCharacters(abcAddr, 4).join(' '),
        );
        await trezorUserEnvLink.pressYes(); // confirm address

        await expect(page.getByTestId('@metadata/copy-address-button')).toBeVisible();
        await expect(page.getByTestId('@metadata/copy-address-button')).not.toBeDisabled();

        await page.getByTestId('@modal/close-button').click();
    });

    // add hidden wallet (abc)
    // fail to confirm passphrase
    // try again from notification, succeed
    test('Fail to confirm passphrase and retry', async ({ page, dashboardPage, devicePrompt }) => {
        // add 1st hidden wallet
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.addHiddenWallet('abc');

        await page.getByTestId('@passphrase-confirmation/step1-open-unused-wallet-button').click();
        await page.getByTestId('@passphrase-confirmation/step2-button').click();

        // confirm - input wrong passphrase
        await dashboardPage.passphraseInput.fill('cba');
        await dashboardPage.passphraseSubmitButton.click();
        await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
        await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase

        // retry
        await page.getByTestId('@passphrase-mismatch/start-over').click();

        // confirm again - input correct this time
        await dashboardPage.passphraseInput.fill('abc');
        await dashboardPage.passphraseSubmitButton.click();
        await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
        await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase

        await page.getByTestId('@passphrase-confirmation/step1-open-unused-wallet-button').click();
        await page.getByTestId('@passphrase-confirmation/step2-button').click();

        // confirm - input wrong passphrase
        await dashboardPage.passphraseInput.fill('abc');
        await dashboardPage.passphraseSubmitButton.click();
        await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
        await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase

        await dashboardPage.modal.waitFor({ state: 'detached' });
        await dashboardPage.openDeviceSwitcher();
        await expect(dashboardPage.walletAtIndex(1)).toContainText('Passphrase wallet #1');
    });
});
