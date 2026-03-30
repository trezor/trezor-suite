import { expect, test } from '../../../support/fixtures';
import { MetadataProvider } from '../../../support/mocks/metadataMock';

const standardWalletIndex = 0;
const hiddenWalletIndex = 1;

test.describe(
    'Metadata - wallet labeling',
    { tag: ['@webOnly', '@T3W1', '@T3T1', '@smoke'] },
    () => {
        test.beforeEach(async ({ onboardingPage, metadataMock, metadataPage }) => {
            await metadataMock.start(MetadataProvider.DROPBOX);
            await onboardingPage.completeOnboarding();
            await metadataPage.enableLegacyLabeling(MetadataProvider.DROPBOX);
        });

        test.use({
            deviceSetup: {
                mnemonic: 'mnemonic_all',
                passphrase_protection: true,
            },
        });

        test('persists wallet labels', async ({
            page,
            device,
            dashboardPage,
            metadataPage,
            devicePrompt,
            metadataMock,
        }) => {
            await test.step('Setup standard wallet and enable labels', async () => {
                await dashboardPage.openDeviceSwitcher();
            });

            await test.step('Add and Edit label of standard wallet', async () => {
                await metadataPage.wallet.clickEditLabel(standardWalletIndex);
                await metadataPage.wallet.fillLabelInput('label for standard wallet');

                await metadataPage.wallet.successIconIsVisible(standardWalletIndex);
                await expect(metadataPage.wallet.walletLabel(standardWalletIndex)).toHaveText(
                    'label for standard wallet',
                );

                await metadataPage.wallet.clickEditLabel(standardWalletIndex);
                await metadataPage.wallet.fillLabelInput('wallet for drugs');
                await metadataPage.wallet.successIconIsVisible(standardWalletIndex);
            });

            await test.step('Add hidden wallet and enable labeling', async () => {
                await dashboardPage.addUnusedHiddenWallet('abc');

                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();

                await dashboardPage.openDeviceSwitcher();
                await metadataPage.wallet.clickEditLabel(hiddenWalletIndex);
                await metadataPage.wallet.fillLabelInput('wallet not for drugs');
                await metadataPage.wallet.successIconIsVisible(hiddenWalletIndex);
            });

            await test.step('Verify wallet labels', async () => {
                await expect(metadataPage.wallet.walletLabel(standardWalletIndex)).toHaveText(
                    'wallet for drugs',
                );
                await expect(metadataPage.wallet.walletLabel(hiddenWalletIndex)).toHaveText(
                    'wallet not for drugs',
                );
            });

            await test.step('Reload app', async () => {
                await page.waitForTimeout(1000); // wait for changes to db
                await page.reload();
                await metadataMock.setupWindowStubs();
            });

            await test.step('Verify wallet labels after reload', async () => {
                await dashboardPage.openDeviceSwitcher();

                await expect(metadataPage.wallet.walletLabel(standardWalletIndex)).toHaveText(
                    'wallet for drugs',
                );
                await expect(metadataPage.wallet.walletLabel(hiddenWalletIndex)).toHaveText(
                    'wallet not for drugs',
                );
            });
        });

        test('labels can be enabled and edited when different wallet is open', async ({
            device,
            dashboardPage,
            metadataPage,
            devicePrompt,
        }) => {
            await test.step('Setup standard wallet with label and edit it', async () => {
                await dashboardPage.openDeviceSwitcher();
                await metadataPage.wallet.clickEditLabel(standardWalletIndex);
                await metadataPage.wallet.fillLabelInput('label for standard wallet');
                await metadataPage.wallet.successIconIsVisible(standardWalletIndex);
            });

            await test.step('Add passphrase wallet C and switch back to first wallet', async () => {
                await dashboardPage.addUnusedHiddenWallet('C');
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressNo();
                await dashboardPage.openDeviceSwitcher();
                await dashboardPage.walletAtIndex(standardWalletIndex).click();
            });

            await test.step('Enable labeling for wallet C', async () => {
                await dashboardPage.openDeviceSwitcher();
                await metadataPage.wallet.clickEditLabel(hiddenWalletIndex);
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
                await metadataPage.wallet.clickEditLabel(hiddenWalletIndex);
                await metadataPage.wallet.fillLabelInput(
                    'still works, metadata enabled for currently not selected device',
                );
                await metadataPage.wallet.successIconIsVisible(hiddenWalletIndex);
            });

            await test.step('Verify wallet labels', async () => {
                await expect(metadataPage.wallet.walletLabel(standardWalletIndex)).toHaveText(
                    'label for standard wallet',
                );
                await expect(metadataPage.wallet.walletLabel(hiddenWalletIndex)).toHaveText(
                    'still works, metadata enabled for currently not selected device',
                );
            });
        });
    },
);
