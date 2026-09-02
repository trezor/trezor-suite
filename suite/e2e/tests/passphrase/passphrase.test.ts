import { events } from '@suite/analytics';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { ExtractByEventType } from '../../support/types';

const abcAddr = 'bc1qpyfvfvm52zx7gek86ajj5pkkne3h385ada8r2y';
const defAddr = 'bc1qek0hazgrelpuce8anp72ur4kpgel74ype3pw52';

test.describe('Passphrase', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all', passphrase_protection: true } });

    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
    });

    test(
        'basic flow',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a user can successfully add and switch between hidden wallets, and confirm passphrase.',
                category: TestCategory.Wallets,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async ({
            page,
            device,
            analytics,
            devicePrompt,
            dashboardPage,
            walletPage,
            metadataPage,
        }) => {
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
                await walletPage.verifyAddressButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowReceiveAddress(abcAddr);
                await device.pressYes(); // confirm address

                await expect(metadataPage.copyAddressButton).toBeVisible();
                await expect(metadataPage.copyAddressButton).toBeEnabled();

                // Verifying only shows the address on the device. Revealing it — which is what
                // puts it in the address history the later steps assert on — is "show next".
                await walletPage.showNextAddressButton.click();
                await expect(walletPage.usedAddress(0)).toBeVisible();
            });

            await test.step('Add second passphrase wallet #2', async () => {
                await dashboardPage.openDeviceSwitcher();
                await dashboardPage.addUnusedHiddenWallet('def');
                const element = page.getByTestId(/^@account-menu\/btc\//);
                await element.first().click();

                const selectWalletEvent = analytics.findAnalyticsEventByType<
                    ExtractByEventType<(typeof events.selectWalletTypeEvent)['name']>
                >(events.selectWalletTypeEvent.name);
                expect(selectWalletEvent.type).toEqual('hidden');
            });

            await test.step('Open receive address of wallet #2', async () => {
                await walletPage.receiveButton.click();

                await test.step('Verify no address is yet in table', async () => {
                    await expect(walletPage.usedAddress(0)).toBeHidden();
                });

                await expect(walletPage.verifyAddressButton).toBeEnabled();
                await walletPage.verifyAddressButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowReceiveAddress(defAddr);
                await device.pressYes(); // confirm address

                await expect(metadataPage.copyAddressButton).toBeVisible();
                await expect(metadataPage.copyAddressButton).toBeEnabled();
            });

            await test.step('Switch back to the wallet #1, which is cached in device', async () => {
                await dashboardPage.openDeviceSwitcher();
                await dashboardPage.walletAtIndex(1).click();
                await walletPage.receiveButton.click();
            });

            await test.step('Revealed address stays visible in table of wallet #1', async () => {
                await expect(walletPage.usedAddress(0)).toBeVisible();
                await expect(walletPage.verifyAddressButton).toBeEnabled();

                await walletPage.usedAddress(0).hover();
                await walletPage.usedAddressVerifyButton(0).click();
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowReceiveAddress(abcAddr);
                await device.pressYes(); // confirm address

                await expect(metadataPage.copyAddressButton).toBeVisible();
                await expect(metadataPage.copyAddressButton).toBeEnabled();
            });
        },
    );

    test(
        'Errors to confirm passphrase and retry',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ dashboardPage, devicePrompt }) => {
            await test.step('Initiate adding passphrase wallet', async () => {
                await dashboardPage.openDeviceSwitcher();
                await dashboardPage.addHiddenWallet('abc', { skipDiscovery: true });

                await dashboardPage.openUnusedWalletButton1.click();
                await dashboardPage.openUnusedWalletButton2.click();
            });

            await test.step('Confirm wrong passphrase', async () => {
                await dashboardPage.passphraseInput.fill('cba');

                await test.step('Toggle passphrase visibility', async () => {
                    await expect(dashboardPage.passphraseInput).toHaveCSS(
                        '-webkit-text-security',
                        'disc',
                    );
                    await dashboardPage.passphraseShowButton.click();
                    await expect(dashboardPage.passphraseInput).not.toHaveCSS(
                        '-webkit-text-security',
                        'disc',
                    );
                    await dashboardPage.passphraseShowButton.click();
                    await expect(dashboardPage.passphraseInput).toHaveCSS(
                        '-webkit-text-security',
                        'disc',
                    );
                });

                await dashboardPage.passphraseSubmitButton.click();
                await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
                await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase
                await expect(dashboardPage.passphraseMismatchHeader).toContainTranslation(
                    'TR_PASSPHRASE_MISMATCH',
                );
                await expect(dashboardPage.passphraseMismatchDesc).toContainTranslation(
                    'TR_PASSPHRASE_MISMATCH_DESCRIPTION',
                );
            });

            await test.step('Retry passphrase confirmation', async () => {
                await dashboardPage.passphraseMismatchStartOverButton.click();
                await dashboardPage.passphraseInput.fill('abc');
                await dashboardPage.passphraseSubmitButton.click();
                await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
                await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase
                await dashboardPage.openUnusedWalletButton1.click();
                await dashboardPage.openUnusedWalletButton2.click();
            });

            await test.step('Confirm correct passphrase', async () => {
                await dashboardPage.passphraseInput.fill('abc');
                await dashboardPage.passphraseSubmitButton.click();
                await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
                await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase

                await dashboardPage.modal.waitFor({ state: 'detached' });
                await dashboardPage.openDeviceSwitcher();
                await expect(dashboardPage.walletAtIndex(1)).toContainTranslation(
                    'TR_PASSPHRASE_WALLET',
                    {
                        values: { id: '1' },
                    },
                );
            });
        },
    );
});
