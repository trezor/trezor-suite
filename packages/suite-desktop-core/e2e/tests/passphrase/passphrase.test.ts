import { EventType } from '@trezor/suite-analytics';

import { formatAddress } from '../../support/common';
import { TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { ExtractByEventType } from '../../support/types';

const abcAddr = 'bc1qpyfvfvm52zx7gek86ajj5pkkne3h385ada8r2y';
const defAddr = 'bc1qek0hazgrelpuce8anp72ur4kpgel74ype3pw52';

test.describe('Passphrase', { tag: ['@group=passphrase'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all', passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test(
        'basic flow',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a user can successfully add and switch between hidden wallets, and confirm passphrase.',
                category: TestCategory.Wallets,
                priority: TestPriority.High,
            }),
        },
        async ({ page, analytics, devicePrompt, dashboardPage, walletPage, trezorUserEnvLink }) => {
            await test.step('Add passphrase wallet #1', async () => {
                await dashboardPage.openDeviceSwitcher();
                await dashboardPage.addUnusedHiddenWallet('abc');

                await analytics.interceptAnalytics();
            });

            await test.step('Display receive address of wallet #1', async () => {
                await walletPage.openAccount({
                    symbol: 'btc',
                    type: 'normal',
                    atIndex: 0,
                });
                await walletPage.receiveButton.click();
                await walletPage.revealAddressButton.click();
                await expect(page.getByTestId('@modal/output-value')).toHaveText(
                    formatAddress(abcAddr),
                );
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(devicePrompt).toDisplayReceiveAddress(abcAddr);
                await trezorUserEnvLink.pressYes(); // confirm address

                await expect(page.getByTestId('@metadata/copy-address-button')).toBeVisible();
                await expect(page.getByTestId('@metadata/copy-address-button')).not.toBeDisabled();

                await devicePrompt.closeModal();
            });

            await test.step('Add second passphrase wallet #2', async () => {
                await dashboardPage.openDeviceSwitcher();
                await dashboardPage.addUnusedHiddenWallet('def');
                const element = page.getByTestId(/^@account-menu\/btc\//);
                await element.first().click();

                const selectWalletEvent = analytics.findAnalyticsEventByType<
                    ExtractByEventType<EventType.SelectWalletType>
                >(EventType.SelectWalletType);
                expect(selectWalletEvent.type).toEqual('hidden');
            });

            await test.step('Open receive address of wallet #2', async () => {
                await walletPage.receiveButton.click();
                await test.step('Verify no address is yet in table', async () => {
                    await expect(
                        page.getByTestId('@wallet/receive/used-address/0'),
                    ).not.toBeVisible();
                });

                await expect(walletPage.revealAddressButton).not.toBeDisabled();
                await walletPage.revealAddressButton.click();
                await expect(page.getByTestId('@modal/output-value')).toHaveText(
                    formatAddress(defAddr),
                );
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(devicePrompt).toDisplayReceiveAddress(defAddr);
                await trezorUserEnvLink.pressYes(); // confirm address

                await expect(page.getByTestId('@metadata/copy-address-button')).toBeVisible();
                await expect(page.getByTestId('@metadata/copy-address-button')).not.toBeDisabled();

                await devicePrompt.closeModal();
            });

            await test.step('Switch back to the wallet #1, which is cached in device', async () => {
                await dashboardPage.openDeviceSwitcher();
                await dashboardPage.walletAtIndex(1).click();
                await walletPage.receiveButton.click();
            });

            await test.step('No address is yet in table of wallet #1', async () => {
                await expect(page.getByTestId('@wallet/receive/used-address/0')).not.toBeVisible();
                await expect(walletPage.revealAddressButton).not.toBeDisabled();

                await walletPage.revealAddressButton.click();
                await expect(page.getByTestId('@modal/output-value')).toHaveText(
                    formatAddress(abcAddr),
                );
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(devicePrompt).toDisplayReceiveAddress(abcAddr);
                await trezorUserEnvLink.pressYes(); // confirm address

                await expect(page.getByTestId('@metadata/copy-address-button')).toBeVisible();
                await expect(page.getByTestId('@metadata/copy-address-button')).not.toBeDisabled();

                await devicePrompt.closeModal();
            });
        },
    );

    test('Fail to confirm passphrase and retry', async ({ page, dashboardPage, devicePrompt }) => {
        await test.step('Initiate adding passphrase wallet', async () => {
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.addHiddenWallet('abc', { skipDiscovery: true });

            await page
                .getByTestId('@passphrase-confirmation/step1-open-unused-wallet-button')
                .click();
            await page.getByTestId('@passphrase-confirmation/step2-button').click();
        });

        await test.step('Confirm wrong passphrase', async () => {
            await dashboardPage.passphraseInput.fill('cba');
            await dashboardPage.passphraseSubmitButton.click();
            await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
            await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase
        });

        await test.step('Retry passphrase confirmation', async () => {
            await page.getByTestId('@passphrase-mismatch/start-over').click();
            await dashboardPage.passphraseInput.fill('abc');
            await dashboardPage.passphraseSubmitButton.click();
            await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
            await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase
        });

        await page.getByTestId('@passphrase-confirmation/step1-open-unused-wallet-button').click();
        await page.getByTestId('@passphrase-confirmation/step2-button').click();

        await test.step('Confirm correct passphrase', async () => {
            await dashboardPage.passphraseInput.fill('abc');
            await dashboardPage.passphraseSubmitButton.click();
            await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
            await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase

            await dashboardPage.modal.waitFor({ state: 'detached' });
            await dashboardPage.openDeviceSwitcher();
            await expect(dashboardPage.walletAtIndex(1)).toContainText('Passphrase wallet #1');
        });
    });
});
